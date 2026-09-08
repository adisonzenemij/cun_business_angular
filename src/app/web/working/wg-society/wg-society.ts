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

type TabKey = 'vista_360' | 'financieros' | 'situacion_financiera' | 'resultado_integral';
type Consultation = Record<TabKey, SearchResult>;

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
  readonly activeTab = signal<TabKey>('vista_360');
  readonly tabs: { key: TabKey; label: string }[] = [
    { key: 'vista_360', label: 'Vista 360' },
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
        this.activeTab.set('vista_360');
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

  records(tab: TabKey): SearchHit[] {
    return this.consultation()?.[tab]?.hits?.hits ?? [];
  }

  fields(tab: TabKey): string[] {
    return [...new Set(this.records(tab).flatMap((record) => Object.keys(record._source)))];
  }
}
