import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FAST_API_URL, FastApi } from '../../../services/backend/python/fast/fast-api';

interface Society {
  id_universal: string;
  fd_company: string;
  fd_document: string;
}

interface SearchHit {
  _id: string;
  _source: Record<string, unknown>;
}

interface SearchResult {
  hits?: { hits?: SearchHit[] };
}

type DetailKey = 'financieros' | 'situacion_financiera' | 'resultado_integral';
type Consultation = {
  vista_360: SearchResult;
} & Record<DetailKey, Record<string, SearchResult>>;

interface DetailCard {
  key: DetailKey;
  label: string;
}

interface ValueRow {
  field: string;
  value: string;
}

@Component({
  imports: [FormsModule],
  selector: 'app-wg-society',
  styleUrl: './wg-society.css',
  templateUrl: './wg-society.html',
})
export class WgSociety {
  private readonly api = inject(FastApi);
  readonly societies = signal<Society[]>([]);
  readonly selectedId = signal('');
  readonly loading = signal(true);
  readonly consulting = signal(false);
  readonly error = signal('');
  readonly consultation = signal<Consultation | null>(null);
  readonly activeCutoffs = signal<Record<DetailKey, string>>({
    financieros: '',
    situacion_financiera: '',
    resultado_integral: '',
  });
  readonly detailCards: DetailCard[] = [
    { key: 'financieros', label: 'Financieros' },
    { key: 'situacion_financiera', label: 'Situación financiera' },
    { key: 'resultado_integral', label: 'Resultado integral' },
  ];

  constructor() {
    this.loadSocieties();
  }

  loadSocieties(): void {
    this.loading.set(true);
    this.api.list<Society>('societies').subscribe({
      next: (societies) => {
        this.societies.set(societies.sort((a, b) => a.fd_company.localeCompare(b.fd_company)));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No fue posible cargar las sociedades.');
        this.loading.set(false);
      },
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
      error: (error) => {
        this.error.set(error.error?.detail ?? 'No fue posible consultar la sociedad.');
        this.consulting.set(false);
      },
    });
  }

  changeSociety(value: string): void {
    this.selectedId.set(value);
    this.consultation.set(null);
    this.error.set('');
  }

  vistaRecords(): SearchHit[] {
    return this.consultation()?.vista_360.hits?.hits ?? [];
  }

  vistaFields(): string[] {
    return [...new Set(this.vistaRecords().flatMap((record) => Object.keys(record._source)))];
  }

  cutoffs(key: DetailKey): string[] {
    return this.cutoffsFrom(this.consultation()?.[key] ?? {});
  }

  selectCutoff(key: DetailKey, cutoff: string): void {
    this.activeCutoffs.update((current) => ({ ...current, [key]: cutoff }));
  }

  detailRows(key: DetailKey): ValueRow[] {
    const cutoff = this.activeCutoffs()[key];
    const source = this.consultation()?.[key]?.[cutoff]?.hits?.hits?.[0]?._source;
    return source ? this.flatten(source) : [];
  }

  private cutoffsFrom(results: Record<string, SearchResult>): string[] {
    return Object.keys(results).sort((first, second) => second.localeCompare(first));
  }

  private flatten(value: unknown, prefix = ''): ValueRow[] {
    if (value === null || value === undefined) return [{ field: prefix, value: '—' }];
    if (typeof value !== 'object') return [{ field: prefix, value: String(value) }];
    if (Array.isArray(value)) {
      return value.length ? value.flatMap((item, index) => this.flatten(item, `${prefix}[${index}]`)) : [{ field: prefix, value: '—' }];
    }
    return Object.entries(value as Record<string, unknown>).flatMap(([field, item]) =>
      this.flatten(item, prefix ? `${prefix}.${field}` : field),
    );
  }
}
