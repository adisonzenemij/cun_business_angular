import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export const FAST_API_URL = `${environment.apiUrl}/api`;
export interface Page<T> {
  offset: number;
  limit: number;
  total: number;
  items: T[];
}
export interface AutoFillResult {
  requested: number;
  completed: number;
  failed: number;
  bots: number;
  memory_mb_per_bot: number;
  failures: string[];
}
export interface AutoFillCapacity {
  available_mb: number;
  reserved_mb: number;
  max_memory_per_bot_mb: number;
}

@Injectable({ providedIn: 'root' })
export class FastApi {
  readonly http = inject(HttpClient);
  list<T>(resource: string): Observable<T[]> {
    return this.http.get<T[]>(`${FAST_API_URL}/${resource}/`);
  }
  page<T>(resource: string, offset = 0, limit = 25): Observable<Page<T>> {
    return this.http.get<Page<T>>(`${FAST_API_URL}/${resource}/page`, {
      params: { offset, limit },
    });
  }
  create<T, R>(resource: string, payload: T): Observable<R> {
    return this.http.post<R>(`${FAST_API_URL}/${resource}/`, payload);
  }
  update<T, R>(resource: string, id: string, payload: T): Observable<R> {
    return this.http.put<R>(`${FAST_API_URL}/${resource}/${id}`, payload);
  }
  delete(resource: string, id: string): Observable<void> {
    return this.http.delete<void>(`${FAST_API_URL}/${resource}/${id}`);
  }
  clear(resource: string): Observable<{ deleted: number; preserved: number }> {
    return this.http.delete<{ deleted: number; preserved: number }>(
      `${FAST_API_URL}/${resource}/clear`,
    );
  }
  autoFill(
    surveyId: string,
    payload: { responses: number; bots: number; memory_value: number; memory_unit: 'MB' | 'GB' },
  ): Observable<AutoFillResult> {
    return this.http.post<AutoFillResult>(`${FAST_API_URL}/surveys/${surveyId}/autofill`, payload);
  }
  autoFillCapacity(bots: number): Observable<AutoFillCapacity> {
    return this.http.get<AutoFillCapacity>(`${FAST_API_URL}/surveys/autofill-capacity`, {
      params: { bots },
    });
  }
}
