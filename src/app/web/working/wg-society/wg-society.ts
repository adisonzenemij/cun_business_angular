import { Component, OnDestroy, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Highcharts from 'highcharts';
import { FAST_API_URL, FastApi } from '../../../services/backend/python/fast/fast-api';
import { Theme } from '../../../services/core/theme';

interface Society { id_universal: string; fd_company: string; fd_document: string; }
interface SearchHit { _id: string; _source: Record<string, unknown>; }
interface SearchResult { hits?: { hits?: SearchHit[] }; }
type DetailKey = 'financieros' | 'situacion_financiera' | 'resultado_integral';
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

  readonly societies = signal<Society[]>([]);
  readonly selectedId = signal('');
  readonly loading = signal(true);
  readonly consulting = signal(false);
  readonly error = signal('');
  readonly consultation = signal<Consultation | null>(null);
  readonly activeDetail = signal<DetailKey | null>(null);
  readonly financialFieldsOpen = signal(false);
  readonly visibleFinancialFields = signal<string[]>([
    'infoEmpresa.NIT', 'infoEmpresa.nombreEmpresa', 'fechaCorte', 'infoEmpresa.puntoEntrada', 'estado',
    'situacionFinanciera.activo', 'resultadoIntegral.ingreso', 'resultadoIntegral.gananciaPerdida',
    'indicadores.roa', 'indicadores.roe', 'calculated.ros', 'calculated.margenBruto',
  ]);
  readonly activeCutoffs = signal<Record<DetailKey, string>>({
    financieros: '', situacion_financiera: '', resultado_integral: '',
  });

  constructor() {
    effect(() => {
      this.theme.mode();
      this.consultation();
      this.activeDetail();
      this.scheduleDetailChart();
    });
    this.loadSocieties();
  }

  ngOnDestroy(): void {
    if (this.chartTimer) clearTimeout(this.chartTimer);
    this.detailChart?.destroy();
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

  openDetail(key: DetailKey): void { this.activeDetail.set(key); }
  closeDetail(): void { this.financialFieldsOpen.set(false); this.activeDetail.set(null); this.detailChart?.destroy(); }
  refreshDetailChart(): void { this.scheduleDetailChart(); }
  detailLabel(key: DetailKey | null = this.activeDetail()): string {
    return ({ financieros: 'Financieros', situacion_financiera: 'Situación Financiera', resultado_integral: 'Resultado Integral' } as Record<DetailKey, string>)[key ?? 'financieros'];
  }

  vistaRecords(): SearchHit[] { return this.consultation()?.vista_360.hits?.hits ?? []; }
  vistaFields(): string[] { return [...new Set(this.vistaRecords().flatMap((record) => Object.keys(record._source)))]; }
  cutoffs(key: DetailKey): string[] { return this.cutoffsFrom(this.consultation()?.[key] ?? {}); }
  selectCutoff(key: DetailKey, cutoff: string): void { this.activeCutoffs.update((current) => ({ ...current, [key]: cutoff })); }

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

  detailRows(key: DetailKey): ValueRow[] {
    const source = this.selectedSource(key);
    return source ? this.flatten(source) : [];
  }

  private selectedSource(key: DetailKey): Record<string, unknown> | undefined {
    const cutoff = this.activeCutoffs()[key];
    return this.consultation()?.[key]?.[cutoff]?.hits?.hits?.[0]?._source;
  }

  private scheduleDetailChart(): void {
    if (this.chartTimer) clearTimeout(this.chartTimer);
    this.chartTimer = setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(() => this.renderDetailChart())), 0);
  }

  private renderDetailChart(): void {
    this.detailChart?.destroy();
    const key = this.activeDetail();
    const consultation = this.consultation();
    const container = document.getElementById('society-detail-chart');
    if (!key || !consultation || !container || !container.clientWidth) return;
    const cutoffs = this.cutoffsFrom(consultation[key]).reverse();
    const metrics = this.chartMetrics(key);
    const dark = document.documentElement.dataset['bsTheme'] === 'dark';
    const style: Highcharts.CSSObject = { color: dark ? '#f8f9fa' : '#212529', fontWeight: '400' };
    const compact = new Intl.NumberFormat('es-CO', { notation: 'compact', maximumFractionDigits: 1 });
    this.detailChart = Highcharts.chart(container, {
      chart: { type: 'line', backgroundColor: 'transparent' },
      title: { text: 'General', style },
      subtitle: { text: `${this.detailLabel(key)} por fecha de corte`, style },
      credits: { enabled: false },
      accessibility: { enabled: false },
      xAxis: { categories: cutoffs, labels: { style } },
      yAxis: { title: { text: 'Pesos colombianos', style }, labels: { style, formatter() { return compact.format(this.value as number); } } },
      legend: { itemStyle: style, itemHoverStyle: style },
      tooltip: { valuePrefix: '$ ', valueDecimals: 0 },
      plotOptions: { line: { dataLabels: { enabled: true, formatter() { return compact.format(this.y as number); }, style: { ...style, textOutline: 'none' } } } },
      series: metrics.map((metric) => ({
        type: 'line', name: metric.name,
        data: cutoffs.map((cutoff) => this.number(this.path(consultation[key][cutoff]?.hits?.hits?.[0]?._source, metric.field))),
      })),
    });
  }

  private chartMetrics(key: DetailKey): ChartMetric[] {
    if (key === 'situacion_financiera') return [
      { name: 'Activos', field: 'resultado.activos.activoTotal.valorCorte' },
      { name: 'Pasivos', field: 'resultado.pasivos.pasivoTotal.valorCorte' },
      { name: 'Patrimonio', field: 'resultado.patrimonio.patrimonioTotal.valorCorte' },
    ];
    if (key === 'resultado_integral') return [
      { name: 'Ingresos', field: 'resultado.registros.ingresosActividadesOrdinarias.corte' },
      { name: 'Costo de ventas', field: 'resultado.registros.costoVentas.corte' },
      { name: 'Utilidad neta', field: 'resultado.registros.gananciaPerdida.corte' },
    ];
    return [
      { name: 'Activos', field: 'situacionFinanciera.activo' },
      { name: 'Ingresos', field: 'resultadoIntegral.ingreso' },
      { name: 'Utilidad neta', field: 'resultadoIntegral.gananciaPerdida' },
    ];
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
      'resultadoIntegral.ingreso': 'Ingresos', 'resultadoIntegral.gananciaPerdida': 'Utilidad neta',
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
  private flatten(value: unknown, prefix = ''): ValueRow[] {
    if (value === null || value === undefined) return [{ field: prefix, value: '—' }];
    if (typeof value !== 'object') return [{ field: prefix, value: String(value) }];
    if (Array.isArray(value)) return value.length ? value.flatMap((item, index) => this.flatten(item, `${prefix}[${index}]`)) : [{ field: prefix, value: '—' }];
    return Object.entries(value as Record<string, unknown>).flatMap(([field, item]) => this.flatten(item, prefix ? `${prefix}.${field}` : field));
  }
}
