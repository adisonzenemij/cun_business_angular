import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FAST_API_URL, FastApi } from '../../../services/backend/python/fast/fast-api';

interface Society { id_universal: string; fd_company: string; fd_document: string; }
type RuesRow = Record<string, unknown>;
interface RuesResponse { rows?: RuesRow[]; records?: number; codigo_error?: string; mensaje_error?: string; }
interface RuesReference { codigo_camara: string; matricula: string; }

@Component({
  imports: [FormsModule],
  selector: 'app-wg-rues',
  styleUrl: './wg-rues.css',
  templateUrl: './wg-rues.html',
})
export class WgRues {
  private readonly api = inject(FastApi);
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

  constructor() { this.loadSocieties(); }

  loadSocieties(): void {
    this.loading.set(true);
    this.api.list<Society>('companies').subscribe({
      next: (societies) => { this.societies.set(societies.sort((first, second) => first.fd_company.localeCompare(second.fd_company))); this.loading.set(false); },
      error: () => { this.error.set('No fue posible cargar las empresas.'); this.loading.set(false); },
    });
  }

  changeSociety(value: string): void {
    this.selectedId.set(value); this.result.set(null); this.owners.set(null); this.selectedOwner.set(null); this.error.set(''); this.ownersError.set('');
  }

  consult(): void {
    const societyId = this.selectedId();
    if (!societyId) return;
    this.consulting.set(true); this.error.set(''); this.result.set(null); this.owners.set(null); this.selectedOwner.set(null);
    this.api.http.post<RuesResponse>(`${FAST_API_URL}/companies/${societyId}/rues`, {}).subscribe({
      next: (response) => { if (response.codigo_error && response.codigo_error !== '0000') this.error.set(response.mensaje_error || 'RUES no pudo completar la consulta.'); this.result.set(response); this.consulting.set(false); },
      error: (response) => { this.error.set(response.error?.detail ?? 'No fue posible consultar RUES.'); this.consulting.set(false); },
    });
  }

  consultOwners(row: RuesRow): void {
    const societyId = this.selectedId(); const reference = this.ownerReference(row);
    if (!societyId || !reference) return;
    this.ownersLoading.set(true); this.ownersError.set(''); this.owners.set(null); this.selectedOwner.set(row);
    this.api.http.post<RuesResponse>(`${FAST_API_URL}/companies/${societyId}/rues/owners`, reference).subscribe({
      next: (response) => { if (response.codigo_error && response.codigo_error !== '0000') this.ownersError.set(response.mensaje_error || 'RUES no pudo consultar los propietarios.'); this.owners.set(response); this.ownersLoading.set(false); },
      error: (response) => { this.ownersError.set(response.error?.detail ?? 'No fue posible consultar propietarios y establecimientos.'); this.ownersLoading.set(false); },
    });
  }

  rows(response: RuesResponse | null): RuesRow[] { return response?.rows ?? []; }
  fields(response: RuesResponse | null): string[] { return [...new Set(this.rows(response).flatMap((row) => Object.keys(row).filter((field) => field !== 'enlace')))]; }
  label(field: string): string { return field.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, (letter) => letter.toUpperCase()); }
  value(value: unknown): string { return value === null || value === undefined || value === '' ? '—' : String(value); }
  ownerTitle(): string { return this.value(this.selectedOwner()?.['razon_social'] ?? this.selectedOwner()?.['sigla'] ?? this.selectedOwner()?.['identificacion']); }
  canConsultOwners(row: RuesRow): boolean { return this.ownerReference(row) !== null; }

  private ownerReference(row: RuesRow): RuesReference | null {
    const match = /ConsultarDetalleRM\(['"]?(\d+)['"]?\)/i.exec(String(row['enlace'] ?? ''));
    return match && match[1].length > 2 ? { codigo_camara: match[1].slice(0, 2), matricula: match[1].slice(2) } : null;
  }
}
