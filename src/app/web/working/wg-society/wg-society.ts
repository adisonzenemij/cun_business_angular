import { Component, OnDestroy, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Highcharts from 'highcharts/esm/highcharts';
import 'highcharts/esm/modules/exporting';
import 'highcharts/esm/modules/export-data';
import { FAST_API_URL, FastApi } from '../../../services/backend/python/fast/fast-api';
import { Theme } from '../../../services/core/theme';

interface Society { id_universal: string; fd_company: string; fd_document: string; }
interface SearchHit { _id: string; _source: Record<string, unknown>; }
interface SearchResult { hits?: { hits?: SearchHit[] }; }
type DetailKey = 'financieros' | 'situacion_financiera' | 'resultado_integral';
type FinancialChartTab = 'comparacion' | 'activos' | 'ingresos' | 'utilidad_neta';
type SituationChartType = 'lineas' | 'columnas' | 'barras' | 'donas';
type Consultation = { vista_360: SearchResult } & Record<DetailKey, Record<string, SearchResult>>;
interface ValueRow { field: string; value: string; }
interface FinancialRow { key: string; label: string; value: string; }
interface ChartMetric { name: string; field: string; }

@Component({
  imports: [FormsModule],
  selector: 'app-wg-society',
  styleUrl: './wg-society.css',
  templateUrl: './wg-society.html',
})
export class WgSociety implements OnDestroy {
  private readonly api = inject(FastApi);
  private readonly theme = inject(Theme);
  private detailChart?: Highcharts.Chart;
  private chartTimer?: ReturnType<typeof setTimeout>;
  private chartRenderVersion = 0;

  readonly societies = signal<Society[]>([]);
  readonly selectedId = signal('');
  readonly loading = signal(true);
  readonly consulting = signal(false);
  readonly error = signal('');
  readonly consultation = signal<Consultation | null>(null);
  readonly activeDetail = signal<DetailKey | null>(null);
  readonly situationChartType = signal<SituationChartType>('lineas');
  readonly columnsDetail = signal<DetailKey | null>(null);
  readonly chartFieldsDetail = signal<DetailKey | null>(null);
  readonly layoutOpen = signal(false);
  readonly leftColumnWidth = signal(6);
  readonly columnsSearch = signal('');
  readonly chartFieldsSearch = signal('');
  readonly tableSearches = signal<Record<DetailKey, Record<string, string>>>({
    financieros: {}, situacion_financiera: {}, resultado_integral: {},
  });
  readonly visibleFinancialFields = signal<string[]>([
    'infoEmpresa.NIT', 'infoEmpresa.nombreEmpresa', 'fechaCorte', 'infoEmpresa.puntoEntrada', 'estado',
    'situacionFinanciera.activo', 'resultadoIntegral.ingreso', 'resultadoIntegral.gananciaPerdida',
    'indicadores.roa', 'indicadores.roe', 'calculated.ros', 'calculated.margenBruto',
  ]);
  readonly visibleDetailFields = signal<Partial<Record<Exclude<DetailKey, 'financieros'>, string[]>>>({});
  readonly visibleChartFields = signal<Record<DetailKey, string[]>>({
    financieros: ['situacionFinanciera.activo', 'resultadoIntegral.ingreso', 'resultadoIntegral.gananciaPerdida'],
    situacion_financiera: ['resultado.activos.activoTotal.valorCorte', 'resultado.pasivos.pasivoTotal.valorCorte', 'resultado.patrimonio.patrimonioTotal.valorCorte'],
    resultado_integral: ['resultado.registros.ingresosActividadesOrdinarias.corte', 'resultado.registros.costoVentas.corte', 'resultado.registros.gananciaPerdida.corte'],
  });
  readonly chartSeriesTab = signal<Record<DetailKey, string>>({
    financieros: 'unificado', situacion_financiera: 'unificado', resultado_integral: 'unificado',
  });
  readonly activeCutoffs = signal<Record<DetailKey, string>>({
    financieros: '', situacion_financiera: '', resultado_integral: '',
  });

  constructor() {
    effect(() => {
      this.theme.mode();
      this.consultation();
      this.activeDetail();
      this.situationChartType();
      this.visibleChartFields();
      this.chartSeriesTab();
      this.scheduleDetailChart();
    });
    this.loadSocieties();
  }

  ngOnDestroy(): void {
    if (this.chartTimer) clearTimeout(this.chartTimer);
    this.chartRenderVersion++;
    this.destroyDetailChart();
  }

  loadSocieties(): void {
    this.loading.set(true);
    this.api.list<Society>('societies').subscribe({
      next: (societies) => {
        this.societies.set(societies.sort((a, b) => a.fd_company.localeCompare(b.fd_company)));
        this.loading.set(false);
      },
      error: () => { this.error.set('No fue posible cargar las sociedades.'); this.loading.set(false); },
    });
  }

  consult(): void {
    const societyId = this.selectedId();
    if (!societyId) return;
    this.consulting.set(true);
    this.error.set('');
    this.api.http.post<Consultation>(`${FAST_API_URL}/societies/${societyId}/consult`, {}).subscribe({
      next: (consultation) => {
        this.consultation.set(consultation);
        this.activeCutoffs.set({
          financieros: this.cutoffsFrom(consultation.financieros)[0] ?? '',
          situacion_financiera: this.cutoffsFrom(consultation.situacion_financiera)[0] ?? '',
          resultado_integral: this.cutoffsFrom(consultation.resultado_integral)[0] ?? '',
        });
        this.consulting.set(false);
      },
      error: (error) => { this.error.set(error.error?.detail ?? 'No fue posible consultar la sociedad.'); this.consulting.set(false); },
    });
  }

  changeSociety(value: string): void {
    this.selectedId.set(value);
    this.consultation.set(null);
    this.activeDetail.set(null);
    this.error.set('');
  }

  openDetail(key: DetailKey): void { this.situationChartType.set('lineas'); this.chartSeriesTab.update((tabs) => ({ ...tabs, [key]: 'unificado' })); this.activeDetail.set(key); }
  closeDetail(): void { this.columnsDetail.set(null); this.chartFieldsDetail.set(null); this.layoutOpen.set(false); this.activeDetail.set(null); this.chartRenderVersion++; this.destroyDetailChart(); }
  refreshDetailChart(): void { this.scheduleDetailChart(); }
  selectSituationChartType(type: SituationChartType): void { this.situationChartType.set(type); }
  selectChartSeriesTab(key: DetailKey, field: string): void { this.chartSeriesTab.update((tabs) => ({ ...tabs, [key]: field })); }
  activeChartSeriesTab(key: DetailKey): string { return this.chartSeriesTab()[key]; }
  rightColumnWidth(): number { return 12 - this.leftColumnWidth(); }
  setLeftColumnWidth(value: number | string): void { this.leftColumnWidth.set(Math.max(2, Math.min(10, Number(value) || 6))); }
  setRightColumnWidth(value: number | string): void { this.setLeftColumnWidth(12 - (Number(value) || 6)); }
  detailLabel(key: DetailKey | null = this.activeDetail()): string {
    return ({ financieros: 'Financieros', situacion_financiera: 'Situación Financiera', resultado_integral: 'Resultado Integral' } as Record<DetailKey, string>)[key ?? 'financieros'];
  }

  vistaRecords(): SearchHit[] { return this.consultation()?.vista_360.hits?.hits ?? []; }
  vistaFields(): string[] { return [...new Set(this.vistaRecords().flatMap((record) => Object.keys(record._source)))]; }
  cutoffs(key: DetailKey): string[] { return this.cutoffsFrom(this.consultation()?.[key] ?? {}); }
  selectCutoff(key: DetailKey, cutoff: string): void { this.activeCutoffs.update((current) => ({ ...current, [key]: cutoff })); }

  tableSearch(key: DetailKey): string {
    return this.tableSearches()[key][this.activeCutoffs()[key]] ?? '';
  }

  setTableSearch(key: DetailKey, search: string): void {
    const cutoff = this.activeCutoffs()[key];
    this.tableSearches.update((searches) => ({ ...searches, [key]: { ...searches[key], [cutoff]: search } }));
  }

  financialRows(): FinancialRow[] {
    return this.financialFieldsAvailable().filter((row) => this.visibleFinancialFields().includes(row.key));
  }

  financialFieldsAvailable(): FinancialRow[] {
    const source = this.selectedSource('financieros');
    if (!source) return [];
    const rows = this.flatten(source).map((row) => ({
      key: row.field, label: this.financialLabel(row.field), value: this.formatFinancialValue(row.field, row.value),
    }));
    rows.push(
      { key: 'calculated.ros', label: 'ROS', value: this.formatPercent(this.ratio(this.path(source, 'resultadoIntegral.gananciaPerdida'), this.path(source, 'resultadoIntegral.ingreso'))) },
      { key: 'calculated.margenBruto', label: 'Margen bruto', value: this.formatPercent(this.ratio(this.path(source, 'resultadoIntegral.utilidad'), this.path(source, 'resultadoIntegral.ingreso'))) },
    );
    return rows;
  }

  toggleFinancialField(field: string, checked: boolean): void {
    this.visibleFinancialFields.update((selected) => checked ? [...new Set([...selected, field])] : selected.filter((item) => item !== field));
  }
  isFinancialFieldVisible(field: string): boolean { return this.visibleFinancialFields().includes(field); }

  detailRows(key: Exclude<DetailKey, 'financieros'>): FinancialRow[] {
    const selected = this.visibleDetailFields()[key];
    const rows = this.detailFieldsAvailable(key);
    return selected ? rows.filter((row) => selected.includes(row.key)) : rows;
  }

  tableRows(key: DetailKey): FinancialRow[] {
    return key === 'financieros' ? this.financialRows() : this.detailRows(key);
  }

  filteredTableRows(key: DetailKey): FinancialRow[] {
    return this.filterFields(this.tableRows(key), this.tableSearch(key));
  }

  detailFieldsAvailable(key: Exclude<DetailKey, 'financieros'>): FinancialRow[] {
    const source = this.selectedSource(key);
    return source ? this.flatten(source).map((row) => ({
      key: row.field,
      label: this.detailFieldLabel(row.field),
      value: this.formatDetailValue(row.field, row.value),
    })) : [];
  }

  fieldsAvailable(key: DetailKey): FinancialRow[] {
    return key === 'financieros' ? this.financialFieldsAvailable() : this.detailFieldsAvailable(key);
  }

  filteredFieldsAvailable(key: DetailKey): FinancialRow[] {
    return this.filterFields(this.fieldsAvailable(key), this.columnsSearch());
  }

  isFieldVisible(key: DetailKey, field: string): boolean {
    if (key === 'financieros') return this.isFinancialFieldVisible(field);
    return this.visibleDetailFields()[key]?.includes(field) ?? true;
  }

  toggleField(key: DetailKey, field: string, checked: boolean): void {
    if (key === 'financieros') {
      this.toggleFinancialField(field, checked);
      return;
    }
    this.visibleDetailFields.update((current) => {
      const fields = current[key] ?? this.detailFieldsAvailable(key).map((row) => row.key);
      return { ...current, [key]: checked ? [...new Set([...fields, field])] : fields.filter((item) => item !== field) };
    });
  }

  chartFieldsAvailable(key: DetailKey): FinancialRow[] {
    const source = this.selectedSource(key);
    if (!source) return [];
    return this.flatten(source)
      .filter((row) => this.isChartAmountField(key, row.field, row.value))
      .map((row) => ({ key: row.field, label: this.chartFieldLabel(key, source, row.field), value: this.formatCurrency(row.value) }));
  }

  isChartFieldVisible(key: DetailKey, field: string): boolean { return this.visibleChartFields()[key].includes(field); }

  toggleChartField(key: DetailKey, field: string, checked: boolean): void {
    this.visibleChartFields.update((selected) => ({
      ...selected,
      [key]: checked ? [...new Set([...selected[key], field])] : selected[key].filter((item) => item !== field),
    }));
    if (!checked && this.activeChartSeriesTab(key) === field) this.selectChartSeriesTab(key, 'unificado');
  }

  filteredChartFieldsAvailable(key: DetailKey): FinancialRow[] {
    return this.filterFields(this.chartFieldsAvailable(key), this.chartFieldsSearch());
  }

  chartSeriesTabs(key: DetailKey): ChartMetric[] { return this.chartMetrics(key); }
  showChartSeriesTabs(key: DetailKey): boolean { return this.chartMetrics(key).length > 1; }

  private selectedSource(key: DetailKey): Record<string, unknown> | undefined {
    const cutoff = this.activeCutoffs()[key];
    return this.consultation()?.[key]?.[cutoff]?.hits?.hits?.[0]?._source;
  }

  private scheduleDetailChart(): void {
    if (this.chartTimer) clearTimeout(this.chartTimer);
    const version = ++this.chartRenderVersion;
    this.chartTimer = setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(() => {
      if (version !== this.chartRenderVersion) return;
      this.renderDetailChart();
      this.detailChart?.reflow();
    })), 0);
  }

  private destroyDetailChart(): void {
    const chart = this.detailChart;
    this.detailChart = undefined;
    if (chart?.container && chart.renderer) chart.destroy();
  }

  private chartExporting(dark: boolean): Highcharts.ExportingOptions {
    const foreground = dark ? '#f8f9fa' : '#212529';
    return {
      enabled: true,
      buttons: {
        contextButton: {
          menuItems: ['viewFullscreen', 'printChart', 'separator', 'downloadPNG', 'downloadJPEG', 'downloadSVG', 'downloadPDF', 'separator', 'downloadCSV', 'downloadXLS', 'viewData'],
          theme: { fill: 'transparent', stroke: dark ? '#6c757d' : '#adb5bd', style: { color: foreground } },
        },
      },
    };
  }

  private chartNavigation(dark: boolean): Highcharts.NavigationOptions {
    const foreground = dark ? '#f8f9fa' : '#212529';
    return {
      menuStyle: { background: dark ? '#212529' : '#ffffff', border: `1px solid ${dark ? '#495057' : '#ced4da'}`, color: foreground },
      menuItemStyle: { color: foreground, fontWeight: '400' },
      menuItemHoverStyle: { background: dark ? '#343a40' : '#e9ecef', color: foreground },
    };
  }

  private renderDetailChart(): void {
    this.destroyDetailChart();
    const key = this.activeDetail();
    const consultation = this.consultation();
    const container = document.getElementById('society-detail-chart');
    if (!key || !consultation || !container || !container.clientWidth) return;
    const cutoffs = this.cutoffsFrom(consultation[key]).reverse();
    const metrics = this.displayChartMetrics(key);
    const dark = document.documentElement.dataset['bsTheme'] === 'dark';
    const style: Highcharts.CSSObject = { color: dark ? '#f8f9fa' : '#212529', fontWeight: '400' };
    const compact = new Intl.NumberFormat('es-CO', { notation: 'compact', maximumFractionDigits: 1 });
    const situationType = this.situationChartType();
    if (situationType === 'donas') {
      this.detailChart = Highcharts.chart(container, {
        chart: { type: 'pie', backgroundColor: 'transparent' },
        title: { text: undefined, style },
        subtitle: { text: `${this.detailLabel(key)} por fecha de corte`, style },
        lang: { chartTitle: '' },
        credits: { enabled: false },
        exporting: this.chartExporting(dark),
        navigation: this.chartNavigation(dark),
        accessibility: { enabled: false },
        legend: { itemStyle: style, itemHoverStyle: style },
        tooltip: { pointFormat: '<b>$ {point.y:,.0f}</b> ({point.percentage:.1f}%)' },
        plotOptions: { pie: { innerSize: '55%', borderRadius: 6, borderWidth: 2, dataLabels: { enabled: true, format: '{point.name}: {point.percentage:.0f}%', style: { ...style, textOutline: 'none' } } } },
        series: [{
          type: 'pie', name: 'Valores financieros',
          data: metrics.flatMap((metric) => cutoffs.map((cutoff) => ({
            name: `${metric.name} - ${cutoff}`,
            y: this.number(this.path(consultation[key][cutoff]?.hits?.hits?.[0]?._source, metric.field)),
          }))),
        }],
      });
      this.detailChart.exporting.getDataRows = () => [
        ['Comparativo', 'Fecha de corte', 'Valores Financieros'],
        ...metrics.flatMap((metric) => cutoffs.map((cutoff) => [
          metric.name,
          cutoff,
          this.formatCurrency(this.path(consultation[key][cutoff]?.hits?.hits?.[0]?._source, metric.field)),
        ])),
      ];
      return;
    }
    const cartesianType: 'line' | 'column' | 'bar' = ({ lineas: 'line', columnas: 'column', barras: 'bar', donas: 'line' } as Record<SituationChartType, 'line' | 'column' | 'bar'>)[situationType];
    this.detailChart = Highcharts.chart(container, {
      chart: { type: cartesianType, backgroundColor: 'transparent' },
      title: { text: undefined, style },
      subtitle: { text: `${this.detailLabel(key)} por fecha de corte`, style },
      lang: { chartTitle: '', exportData: { categoryHeader: 'Fecha de corte' } },
      credits: { enabled: false },
      exporting: this.chartExporting(dark),
      navigation: this.chartNavigation(dark),
      accessibility: { enabled: false },
      xAxis: { categories: cutoffs, labels: { style } },
      yAxis: { title: { text: 'Pesos colombianos', style }, labels: { style, formatter() { return compact.format(this.value as number); } } },
      legend: { itemStyle: style, itemHoverStyle: style },
      tooltip: { valuePrefix: '$ ', valueDecimals: 0 },
      plotOptions: cartesianType === 'line'
        ? { line: { dataLabels: { enabled: true, formatter() { return compact.format(this.y as number); }, style: { ...style, textOutline: 'none' } } } }
        : cartesianType === 'column'
          ? { column: { borderWidth: 0, pointPadding: .1, dataLabels: { enabled: true, formatter() { return compact.format(this.y as number); }, style: { ...style, textOutline: 'none' } } } }
          : { bar: { borderWidth: 0, borderRadius: 4, groupPadding: .1, dataLabels: { enabled: true, formatter() { return compact.format(this.y as number); }, style: { ...style, textOutline: 'none' } } } },
      series: metrics.map((metric) => ({
        type: cartesianType, name: metric.name,
        data: cutoffs.map((cutoff) => this.number(this.path(consultation[key][cutoff]?.hits?.hits?.[0]?._source, metric.field))),
      })),
    });
  }

  private chartMetrics(key: DetailKey): ChartMetric[] {
    return this.chartFieldsAvailable(key)
      .filter((field) => this.visibleChartFields()[key].includes(field.key))
      .map((field) => ({ name: field.label, field: field.key }));
  }

  private displayChartMetrics(key: DetailKey): ChartMetric[] {
    const metrics = this.chartMetrics(key);
    const selected = this.activeChartSeriesTab(key);
    return metrics.length > 1 && selected !== 'unificado'
      ? metrics.filter((metric) => metric.field === selected)
      : metrics;
  }

  situationChartTypeLabel(type: SituationChartType): string {
    return ({ lineas: 'Líneas', columnas: 'Columnas', barras: 'Barras', donas: 'Donas' } as Record<SituationChartType, string>)[type];
  }

  private cutoffsFrom(results: Record<string, SearchResult>): string[] { return Object.keys(results).sort((first, second) => second.localeCompare(first)); }
  private path(source: Record<string, unknown> | undefined, path: string): unknown { return path.split('.').reduce<unknown>((value, key) => value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined, source); }
  private number(value: unknown): number { return typeof value === 'number' ? value : Number(value) || 0; }
  private ratio(numerator: unknown, denominator: unknown): number | undefined { const divisor = this.number(denominator); return divisor ? this.number(numerator) / divisor : undefined; }
  private text(value: unknown): string { return value === null || value === undefined || value === '' ? '—' : String(value); }
  private formatCurrency(value: unknown): string { return value === null || value === undefined ? '—' : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(this.number(value)); }
  private formatPercent(value: unknown): string { return value === null || value === undefined ? '—' : new Intl.NumberFormat('es-CO', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(this.number(value)); }

  private financialLabel(field: string): string {
    const labels: Record<string, string> = {
      'infoEmpresa.NIT': 'NIT', 'infoEmpresa.nombreEmpresa': 'Empresa', 'fechaCorte': 'Fecha de corte',
      'infoEmpresa.corte': 'Fecha de corte', 'infoEmpresa.puntoEntrada': 'Punto de entrada',
      estado: 'Estado actual', 'situacionFinanciera.activo': 'Activos',
      'resultadoIntegral.ingreso': 'Ingresos', 'resultadoIntegral.gananciaPerdida': 'Utilidad Neta',
      'indicadores.roa': 'ROA', 'indicadores.roe': 'ROE',
    };
    if (labels[field]) return labels[field];
    return field.replace(/\./g, ' · ').replace(/([a-záéíóúñ])([A-Z])/g, '$1 $2').replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
  }
  private formatFinancialValue(field: string, value: string): string {
    if (['situacionFinanciera.activo', 'resultadoIntegral.ingreso', 'resultadoIntegral.gananciaPerdida'].includes(field)) return this.formatCurrency(value);
    if (['indicadores.roa', 'indicadores.roe'].includes(field)) return this.formatPercent(value);
    return value;
  }
  private detailFieldLabel(field: string): string {
    const labels: Record<string, string> = {
      'infoEmpresa.NIT': 'NIT', 'infoEmpresa.nombreEmpresa': 'Empresa', 'infoEmpresa.corte': 'Fecha de corte',
      'infoEmpresa.puntoEntrada': 'Punto de entrada', 'infoEmpresa.formulario': 'Formulario',
      'infoEmpresa.codigoFormulario': 'Código de formulario', 'infoEmpresa.num_radicado': 'Número de radicado',
      'infoEmpresa.documentos_adicionales': 'Documentos adicionales', 'resultado.NIT': 'NIT',
      'resultado.fechaCorte': 'Fecha de corte',
    };
    if (labels[field]) return labels[field];
    const segments = field.split('.').map((segment) => {
      const special: Record<string, string> = {
        infoEmpresa: 'Información de empresa', resultado: 'Resultado', registros: 'Registros',
        valorCorte: 'Valor al corte', valorAnterior: 'Valor anterior', corteAnterior: 'Corte anterior',
        corte: 'Corte', nombre: 'Nombre', NIT: 'NIT',
      };
      return special[segment] ?? segment
        .replace(/([a-záéíóúñ])([A-Z])/g, '$1 $2')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase());
    });
    return segments.join(' - ');
  }
  private formatDetailValue(field: string, value: string): string {
    if (value === 'â€”' || value === '') return 'â€”';
    const isAmount = /\.(corte|corteAnterior|valorCorte|valorAnterior)$/.test(field)
      && !['infoEmpresa.corte', 'resultado.fechaCorte'].includes(field);
    return isAmount ? this.formatCurrency(value) : value;
  }
  private isChartAmountField(key: DetailKey, field: string, value: string): boolean {
    if (!Number.isFinite(Number(value))) return false;
    if (key === 'financieros') return !/(^|\.)(NIT|num_radicado|hombres|mujeres|activos|cerrados|pais|sector|top500|top9000)(Anterior)?$/i.test(field);
    if (key === 'resultado_integral') return field.startsWith('resultado.registros.') && field.endsWith('.corte');
    return field.startsWith('resultado.') && /\.(corte|valorCorte|totalCorte)$/.test(field);
  }
  private chartFieldLabel(key: DetailKey, source: Record<string, unknown>, field: string): string {
    const labels: Record<string, string> = {
      'situacionFinanciera.activo': 'Activos', 'resultadoIntegral.ingreso': 'Ingresos',
      'resultadoIntegral.gananciaPerdida': 'Utilidad Neta',
      'resultado.activos.activoTotal.valorCorte': 'Activos',
      'resultado.pasivos.pasivoTotal.valorCorte': 'Pasivos',
      'resultado.patrimonio.patrimonioTotal.valorCorte': 'Patrimonio',
      'resultado.registros.ingresosActividadesOrdinarias.corte': 'Ingresos',
      'resultado.registros.costoVentas.corte': 'Costo de ventas',
      'resultado.registros.gananciaPerdida.corte': 'Utilidad Neta',
    };
    if (labels[field]) return labels[field];
    const nameField = field.replace(/\.(corte|valorCorte|totalCorte)$/, '.nombre');
    const name = this.path(source, nameField);
    return typeof name === 'string' && name.trim() ? name : this.detailFieldLabel(field);
  }
  private filterFields(fields: FinancialRow[], query: string): FinancialRow[] {
    const normalizedQuery = query.trim().toLocaleLowerCase('es-CO');
    if (!normalizedQuery) return fields;
    return fields.filter((field) => `${field.label} ${field.key}`.toLocaleLowerCase('es-CO').includes(normalizedQuery));
  }
  private flatten(value: unknown, prefix = ''): ValueRow[] {
    if (value === null || value === undefined) return [{ field: prefix, value: '—' }];
    if (typeof value !== 'object') return [{ field: prefix, value: String(value) }];
    if (Array.isArray(value)) return value.length ? value.flatMap((item, index) => this.flatten(item, `${prefix}[${index}]`)) : [{ field: prefix, value: '—' }];
    return Object.entries(value as Record<string, unknown>).flatMap(([field, item]) => this.flatten(item, prefix ? `${prefix}.${field}` : field));
  }
}
