import { Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FAST_API_URL, FastApi } from '../../../services/backend/python/fast/fast-api';
import DataTable from 'datatables.net-bs5';
import Highcharts from 'highcharts/esm/highcharts';
import 'highcharts/esm/modules/exporting';
import 'highcharts/esm/modules/export-data';
import * as XLSX from 'xlsx';

interface Society { id_universal: string; fd_company: string; fd_document: string; }
type RuesRow = Record<string, unknown>;
interface RuesResponse { rows?: RuesRow[]; records?: number; codigo_error?: string; mensaje_error?: string; }
interface RuesReference { codigo_camara: string; matricula: string; }

const DEFAULT_OWNER_FIELDS = [
  'categoria_matricula', 'desc_estado_matricula', 'matricula', 'nombre_camara',
  'razon_social', 'fecha_matricula', 'fecha_renovacion', 'ultimo_ano_renovado',
];

const OWNER_FIELD_LABELS: Record<string, string> = {
  categoria_matricula: 'Categoria', desc_estado_matricula: 'Estado', matricula: 'Matricula',
  nombre_camara: 'Camara de Comercio', razon_social: 'Razon Social', fecha_matricula: 'Fecha Matricula',
  fecha_renovacion: 'Fecha Renovacion', ultimo_ano_renovado: 'Ultimo Año Renovado',
};

@Component({
  imports: [FormsModule],
  selector: 'app-wg-rues',
  styleUrl: './wg-rues.css',
  templateUrl: './wg-rues.html',
})
export class WgRues implements OnDestroy {
  private readonly api = inject(FastApi);
  @ViewChild('ownersDataTable') private readonly ownersTable?: ElementRef<HTMLTableElement>;
  private ownersDataTable?: { destroy(remove?: boolean): unknown };
  private readonly ownerCharts = new Map<string, Highcharts.Chart>();
  readonly societies = signal<Society[]>([]);
  readonly selectedId = signal('');
  readonly loading = signal(true);
  readonly consulting = signal(false);
  readonly ownersLoading = signal(false);
  readonly error = signal('');
  readonly ownersError = signal('');
  readonly result = signal<RuesResponse | null>(null);
  readonly owners = signal<RuesResponse | null>(null);
  readonly selectedOwner = signal<RuesRow | null>(null);
  readonly ownersColumnsOpen = signal(false);
  readonly ownersColumnsSearch = signal('');
  readonly visibleOwnerFields = signal<string[]>(DEFAULT_OWNER_FIELDS);

  constructor() { this.loadSocieties(); }

  loadSocieties(): void {
    this.loading.set(true);
    this.api.list<Society>('companies').subscribe({
      next: (societies) => { this.societies.set(societies.sort((first, second) => first.fd_company.localeCompare(second.fd_company))); this.loading.set(false); },
      error: () => { this.error.set('No fue posible cargar las empresas.'); this.loading.set(false); },
    });
  }

  changeSociety(value: string): void {
    this.selectedId.set(value); this.result.set(null); this.destroyOwnersDataTable(); this.destroyOwnerCharts(); this.owners.set(null); this.selectedOwner.set(null); this.error.set(''); this.ownersError.set('');
  }

  consult(): void {
    const societyId = this.selectedId();
    if (!societyId) return;
    this.consulting.set(true); this.error.set(''); this.result.set(null); this.destroyOwnersDataTable(); this.destroyOwnerCharts(); this.owners.set(null); this.selectedOwner.set(null);
    this.api.http.post<RuesResponse>(`${FAST_API_URL}/companies/${societyId}/rues`, {}).subscribe({
      next: (response) => { if (response.codigo_error && response.codigo_error !== '0000') this.error.set(response.mensaje_error || 'RUES no pudo completar la consulta.'); this.result.set(response); this.consulting.set(false); },
      error: (response) => { this.error.set(response.error?.detail ?? 'No fue posible consultar RUES.'); this.consulting.set(false); },
    });
  }

  consultOwners(row: RuesRow): void {
    const societyId = this.selectedId(); const reference = this.ownerReference(row);
    if (!societyId || !reference) return;
    this.ownersLoading.set(true); this.ownersError.set(''); this.destroyOwnersDataTable(); this.destroyOwnerCharts(); this.owners.set(null); this.selectedOwner.set(row);
    this.api.http.post<RuesResponse>(`${FAST_API_URL}/companies/${societyId}/rues/owners`, reference).subscribe({
      next: (response) => { if (response.codigo_error && response.codigo_error !== '0000') this.ownersError.set(response.mensaje_error || 'RUES no pudo consultar los propietarios.'); this.owners.set(response); this.ownersLoading.set(false); setTimeout(() => { this.initializeOwnersDataTable(); this.renderOwnerCharts(); }); },
      error: (response) => { this.ownersError.set(response.error?.detail ?? 'No fue posible consultar propietarios y establecimientos.'); this.ownersLoading.set(false); },
    });
  }

  rows(response: RuesResponse | null): RuesRow[] { return response?.rows ?? []; }
  fields(response: RuesResponse | null): string[] { return [...new Set(this.rows(response).flatMap((row) => Object.keys(row).filter((field) => !/^enlace/i.test(field))))]; }
  label(field: string): string { return field.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, (letter) => letter.toUpperCase()); }
  value(value: unknown): string { return value === null || value === undefined || value === '' ? '—' : String(value); }
  ownerFields(): string[] {
    const available = new Set(this.fields(this.owners()));
    return this.visibleOwnerFields().filter((field) => available.has(field));
  }
  ownerFieldLabel(field: string): string { return OWNER_FIELD_LABELS[field] ?? this.label(field); }
  filteredOwnerFields(): string[] {
    const search = this.ownersColumnsSearch().trim().toLocaleLowerCase();
    return this.fields(this.owners()).filter((field) => !search || this.ownerFieldLabel(field).toLocaleLowerCase().includes(search) || field.toLocaleLowerCase().includes(search));
  }
  isOwnerFieldVisible(field: string): boolean { return this.visibleOwnerFields().includes(field); }
  toggleOwnerField(field: string, checked: boolean): void {
    this.destroyOwnersDataTable();
    this.visibleOwnerFields.update((fields) => checked ? [...new Set([...fields, field])] : fields.filter((item) => item !== field));
    setTimeout(() => this.initializeOwnersDataTable());
  }
  ownerTitle(): string { return this.value(this.selectedOwner()?.['razon_social'] ?? this.selectedOwner()?.['sigla'] ?? this.selectedOwner()?.['identificacion']); }
  canConsultOwners(row: RuesRow): boolean { return this.ownerReference(row) !== null; }

  exportOwnersCsv(): void {
    const { headers, records } = this.ownerExportData();
    const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const csv = [headers, ...records].map((record) => record.map(escape).join(';')).join('\r\n');
    this.downloadOwners(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }), 'csv');
  }

  exportOwnersExcel(): void {
    const { headers, records } = this.ownerExportData();
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...records]);
    worksheet['!cols'] = headers.map((header, index) => ({ wch: Math.min(60, Math.max(header.length + 2, ...records.map((record) => record[index].length + 2))) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Propietarios');
    XLSX.writeFile(workbook, `${crypto.randomUUID()}.xlsx`, { compression: true });
  }

  exportResultCsv(): void {
    const { headers, records } = this.resultExportData();
    const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const csv = [headers, ...records].map((record) => record.map(escape).join(';')).join('\r\n');
    this.downloadOwners(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }), 'csv');
  }

  exportResultExcel(): void {
    const { headers, records } = this.resultExportData();
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...records]);
    worksheet['!cols'] = headers.map((header, index) => ({ wch: Math.min(60, Math.max(header.length + 2, ...records.map((record) => record[index].length + 2))) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Consulta NIT');
    XLSX.writeFile(workbook, `${crypto.randomUUID()}.xlsx`, { compression: true });
  }

  refreshActiveChart(): void { this.renderOwnerBarChart('rues-active-chart', 'Matrículas activas por cámara de comercio', 'ACTIVA', '#20c997'); }
  refreshCancelledChart(): void { this.renderOwnerBarChart('rues-cancelled-chart', 'Matrículas canceladas por cámara de comercio', 'CANCELADA', '#dc3545'); }
  refreshStatusChart(): void { this.renderOwnerPieChart('rues-status-chart', 'Cantidad por estado', 'desc_estado_matricula'); }
  refreshCategoryChart(): void { this.renderOwnerPieChart('rues-category-chart', 'Cantidad por categoría', 'categoria_matricula'); }

  private ownerReference(row: RuesRow): RuesReference | null {
    const match = /ConsultarDetalleRM\(['"]?(\d+)['"]?\)/i.exec(String(row['enlace'] ?? ''));
    if (!match || match[1].length < 3) return null;

    // RUES codifica el enlace como cámara invertida + matrícula, compartiendo
    // el segundo dígito de la cámara como primer dígito de la matrícula.
    // Ej.: 40000004627 -> cámara 04, matrícula 0000004627.
    const encoded = match[1];
    return { codigo_camara: `${encoded[1]}${encoded[0]}`, matricula: encoded.slice(1) };
  }

  ngOnDestroy(): void { this.destroyOwnersDataTable(); this.destroyOwnerCharts(); }

  private initializeOwnersDataTable(): void {
    if (!this.ownersTable || this.ownersDataTable || !this.rows(this.owners()).length) return;
    this.ownersDataTable = new DataTable(this.ownersTable.nativeElement, {
      language: {
        emptyTable: 'No hay propietarios ni establecimientos',
        search: 'Buscar:',
        lengthMenu: 'Mostrar _MENU_ registros',
        info: 'Mostrando _START_ a _END_ de _TOTAL_',
        paginate: { next: 'Siguiente', previous: 'Anterior' },
      },
      pageLength: 10,
    });
  }

  private destroyOwnersDataTable(): void {
    this.ownersDataTable?.destroy();
    this.ownersDataTable = undefined;
  }

  private renderOwnerCharts(): void {
    this.destroyOwnerCharts();
    this.renderOwnerBarChart('rues-active-chart', 'Matrículas activas por cámara de comercio', 'ACTIVA', '#20c997');
    this.renderOwnerBarChart('rues-cancelled-chart', 'Matrículas canceladas por cámara de comercio', 'CANCELADA', '#dc3545');
    this.renderOwnerPieChart('rues-status-chart', 'Cantidad por estado', 'desc_estado_matricula');
    this.renderOwnerPieChart('rues-category-chart', 'Cantidad por categoría', 'categoria_matricula');
  }

  private renderOwnerBarChart(containerId: string, title: string, status: string, color: string): void {
    const element = document.getElementById(containerId);
    if (!element) return;
    const data = this.countByChamber(status);
    const { dark, style, gridColor } = this.chartTheme();
    this.destroyOwnerChart(containerId);
    this.ownerCharts.set(containerId, Highcharts.chart(element, {
      chart: { type: 'bar', backgroundColor: 'transparent', height: 380 },
      title: { text: undefined, style },
      credits: { enabled: false },
      exporting: this.chartExporting(dark), navigation: this.chartNavigation(dark),
      xAxis: { categories: data.map(([label]) => label), title: { text: 'Cámara de comercio', style }, labels: { style }, lineColor: gridColor, tickColor: gridColor },
      yAxis: { allowDecimals: false, title: { text: 'Cantidad de matrículas', style }, labels: { style }, gridLineColor: gridColor },
      tooltip: { pointFormat: '<b>{point.y}</b> matrícula(s)' },
      legend: { enabled: false },
      plotOptions: { bar: { borderWidth: 0, borderRadius: 4, groupPadding: .1, dataLabels: { enabled: true, style: { ...style, textOutline: 'none' } } } },
      series: [{ type: 'bar', name: title, color, data: data.map(([, count]) => count) }],
    }));
  }

  private renderOwnerPieChart(containerId: string, title: string, field: string): void {
    const element = document.getElementById(containerId);
    if (!element) return;
    const data = this.countByField(field);
    const { dark, style } = this.chartTheme();
    this.destroyOwnerChart(containerId);
    this.ownerCharts.set(containerId, Highcharts.chart(element, {
      chart: { type: 'pie', backgroundColor: 'transparent', height: 360 },
      title: { text: undefined, style },
      credits: { enabled: false },
      exporting: this.chartExporting(dark), navigation: this.chartNavigation(dark),
      tooltip: { pointFormat: '<b>{point.y}</b> registro(s) ({point.percentage:.1f}%)' },
      plotOptions: { pie: { innerSize: '55%', borderRadius: 6, borderWidth: 2, allowPointSelect: true, cursor: 'pointer', dataLabels: { enabled: true, format: '{point.name}: {point.y}', style: { ...style, textOutline: 'none' } } } },
      series: [{ type: 'pie', name: title, data: data.map(([name, y], index) => ({ name, y, color: this.chartColors()[index % this.chartColors().length] })) }],
    }));
  }

  private chartTheme(): { dark: boolean; style: Highcharts.CSSObject; gridColor: string } {
    const dark = document.documentElement.dataset['bsTheme'] === 'dark';
    return {
      dark,
      style: { color: dark ? '#f8f9fa' : '#212529', fontWeight: '400' },
      gridColor: dark ? '#495057' : '#dee2e6',
    };
  }

  private chartColors(): string[] { return ['#0d6efd', '#20c997', '#ffc107', '#dc3545', '#6f42c1', '#0dcaf0']; }

  private chartExporting(dark: boolean): Highcharts.ExportingOptions {
    const foreground = dark ? '#f8f9fa' : '#212529';
    return { enabled: true, buttons: { contextButton: { theme: { fill: 'transparent', stroke: dark ? '#6c757d' : '#adb5bd', style: { color: foreground } } } } };
  }

  private chartNavigation(dark: boolean): Highcharts.NavigationOptions {
    const foreground = dark ? '#f8f9fa' : '#212529';
    return { menuStyle: { background: dark ? '#212529' : '#ffffff', border: `1px solid ${dark ? '#495057' : '#ced4da'}`, color: foreground }, menuItemStyle: { color: foreground, fontWeight: '400' }, menuItemHoverStyle: { background: dark ? '#343a40' : '#e9ecef', color: foreground } };
  }

  private countByChamber(status: string): [string, number][] {
    return this.countRows(this.rows(this.owners()).filter((row) => String(row['desc_estado_matricula'] ?? '').trim().toLocaleUpperCase() === status), 'nombre_camara');
  }

  private countByField(field: string): [string, number][] { return this.countRows(this.rows(this.owners()), field); }

  private countRows(rows: RuesRow[], field: string): [string, number][] {
    const counts = new Map<string, number>();
    rows.forEach((row) => {
      const value = this.value(row[field]);
      counts.set(value, (counts.get(value) ?? 0) + 1);
    });
    return [...counts.entries()].sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0]));
  }

  private destroyOwnerCharts(): void {
    this.ownerCharts.forEach((chart) => chart.destroy());
    this.ownerCharts.clear();
  }

  private destroyOwnerChart(containerId: string): void {
    this.ownerCharts.get(containerId)?.destroy();
    this.ownerCharts.delete(containerId);
  }

  private ownerExportData(): { headers: string[]; records: string[][] } {
    const fields = this.ownerFields();
    return {
      headers: fields.map((field) => this.ownerFieldLabel(field)),
      records: this.rows(this.owners()).map((row) => fields.map((field) => this.value(row[field]))),
    };
  }

  private resultExportData(): { headers: string[]; records: string[][] } {
    const fields = this.fields(this.result());
    return {
      headers: fields.map((field) => this.label(field)),
      records: this.rows(this.result()).map((row) => fields.map((field) => this.value(row[field]))),
    };
  }

  private downloadOwners(blob: Blob, extension: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${crypto.randomUUID()}.${extension}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
