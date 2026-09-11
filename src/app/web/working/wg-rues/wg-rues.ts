import { Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FAST_API_URL, FastApi } from '../../../services/backend/python/fast/fast-api';
import DataTable from 'datatables.net-bs5';
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
    this.selectedId.set(value); this.result.set(null); this.destroyOwnersDataTable(); this.owners.set(null); this.selectedOwner.set(null); this.error.set(''); this.ownersError.set('');
  }

  consult(): void {
    const societyId = this.selectedId();
    if (!societyId) return;
    this.consulting.set(true); this.error.set(''); this.result.set(null); this.destroyOwnersDataTable(); this.owners.set(null); this.selectedOwner.set(null);
    this.api.http.post<RuesResponse>(`${FAST_API_URL}/companies/${societyId}/rues`, {}).subscribe({
      next: (response) => { if (response.codigo_error && response.codigo_error !== '0000') this.error.set(response.mensaje_error || 'RUES no pudo completar la consulta.'); this.result.set(response); this.consulting.set(false); },
      error: (response) => { this.error.set(response.error?.detail ?? 'No fue posible consultar RUES.'); this.consulting.set(false); },
    });
  }

  consultOwners(row: RuesRow): void {
    const societyId = this.selectedId(); const reference = this.ownerReference(row);
    if (!societyId || !reference) return;
    this.ownersLoading.set(true); this.ownersError.set(''); this.destroyOwnersDataTable(); this.owners.set(null); this.selectedOwner.set(row);
    this.api.http.post<RuesResponse>(`${FAST_API_URL}/companies/${societyId}/rues/owners`, reference).subscribe({
      next: (response) => { if (response.codigo_error && response.codigo_error !== '0000') this.ownersError.set(response.mensaje_error || 'RUES no pudo consultar los propietarios.'); this.owners.set(response); this.ownersLoading.set(false); setTimeout(() => this.initializeOwnersDataTable()); },
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
    XLSX.writeFile(workbook, 'rues-propietarios.xlsx', { compression: true });
  }

  private ownerReference(row: RuesRow): RuesReference | null {
    const match = /ConsultarDetalleRM\(['"]?(\d+)['"]?\)/i.exec(String(row['enlace'] ?? ''));
    if (!match || match[1].length < 3) return null;

    // RUES codifica el enlace como cámara invertida + matrícula, compartiendo
    // el segundo dígito de la cámara como primer dígito de la matrícula.
    // Ej.: 40000004627 -> cámara 04, matrícula 0000004627.
    const encoded = match[1];
    return { codigo_camara: `${encoded[1]}${encoded[0]}`, matricula: encoded.slice(1) };
  }

  ngOnDestroy(): void { this.destroyOwnersDataTable(); }

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

  private ownerExportData(): { headers: string[]; records: string[][] } {
    const fields = this.ownerFields();
    return {
      headers: fields.map((field) => this.ownerFieldLabel(field)),
      records: this.rows(this.owners()).map((row) => fields.map((field) => this.value(row[field]))),
    };
  }

  private downloadOwners(blob: Blob, extension: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `rues-propietarios.${extension}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
