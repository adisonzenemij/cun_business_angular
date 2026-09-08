import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export const FAST_API_URL = 'http://127.0.0.1:8000/api/v1';
export interface Page<T> { offset: number; limit: number; total: number; items: T[]; }

@Injectable({ providedIn: 'root' })
export class FastApi {
  readonly http = inject(HttpClient);
  list<T>(resource: string): Observable<T[]> { return this.http.get<T[]>(`${FAST_API_URL}/${resource}/`); }
  page<T>(resource: string, offset = 0, limit = 25): Observable<Page<T>> {
    return this.http.get<Page<T>>(`${FAST_API_URL}/${resource}/page`, { params: { offset, limit } });
  }
  create<T, R>(resource: string, payload: T): Observable<R> { return this.http.post<R>(`${FAST_API_URL}/${resource}/`, payload); }
  update<T, R>(resource: string, id: string, payload: T): Observable<R> { return this.http.put<R>(`${FAST_API_URL}/${resource}/${id}`, payload); }
  delete(resource: string, id: string): Observable<void> { return this.http.delete<void>(`${FAST_API_URL}/${resource}/${id}`); }
}
