import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FAST_API_URL, FastApi } from './fast-api';

export interface CorsOrigin {
  id_universal: string;
  fd_service: string;
}
export interface User {
  id_universal: string;
  fd_login: string;
}
export interface Anonymous {
  id_universal: string;
  fd_random: string;
  pm_4d802b91: string | null;
  fd_reservation_key: string | null;
}
export interface Scope {
  id_universal: string;
  fd_setting: string;
}
export interface Type {
  id_universal: string;
  fd_format: string;
}
export interface Survey {
  id_universal: string;
  fd_count: number;
  fd_name: string;
  fd_query: number;
  fd_since: string;
  fd_until: string;
  pm_8e417bb2: string;
  fd_available_slots?: number;
}
export interface Question {
  id_universal: string;
  fd_ask: string;
  fd_order: number;
  fd_required: boolean;
  fd_format?: string;
  pm_0d3dc00e: string;
  pm_4d802b91: string;
}
export interface Value {
  id_universal: string;
  fd_option: string;
  fd_order?: number;
  pm_0acc84ae: string;
}
export interface Answer {
  id_universal: string;
  fd_repply: string;
  pm_9a582ff6: string;
  pm_1a4a8cd7: string;
}

class Resource<T extends { id_universal: string }> {
  protected readonly api = inject(FastApi);
  constructor(private readonly path: string) {}
  list(): Observable<T[]> {
    return this.api.list<T>(this.path);
  }
  page(offset = 0, limit = 25) {
    return this.api.page<T>(this.path, offset, limit);
  }
  create(payload: Omit<T, 'id_universal'>): Observable<T> {
    return this.api.create(this.path, payload);
  }
  update(id: string, payload: Partial<Omit<T, 'id_universal'>>): Observable<T> {
    return this.api.update(this.path, id, payload);
  }
  delete(id: string): Observable<void> {
    return this.api.delete(this.path, id);
  }
}

@Injectable({ providedIn: 'root' })
export class FtE144c860 extends Resource<CorsOrigin> {
  constructor() {
    super('cors-origins');
  }
}
@Injectable({ providedIn: 'root' })
export class FtB64883b6 extends Resource<User> {
  constructor() {
    super('users');
  }
}
@Injectable({ providedIn: 'root' })
export class FtE5520e1e extends Resource<Anonymous> {
  constructor() {
    super('anonymous');
  }

  release(id: string, fd_reservation_key: string): Observable<void> {
    return this.api.http.post<void>(`${FAST_API_URL}/anonymous/${id}/release`, {
      fd_reservation_key,
    });
  }

  renew(id: string, fd_reservation_key: string): Observable<Anonymous> {
    return this.api.http.post<Anonymous>(`${FAST_API_URL}/anonymous/${id}/renew`, {
      fd_reservation_key,
    });
  }
  reserve(payload: Omit<Anonymous, 'id_universal'>): Observable<Anonymous> {
    return this.api.http.post<Anonymous>(`${FAST_API_URL}/public/anonymous`, payload);
  }
}
@Injectable({ providedIn: 'root' })
export class FtA6aedeb5 extends Resource<Scope> {
  constructor() {
    super('scopes');
  }
}
@Injectable({ providedIn: 'root' })
export class FtA3b378b4 extends Resource<Type> {
  constructor() {
    super('types');
  }
}
@Injectable({ providedIn: 'root' })
export class FtD5fb87de extends Resource<Survey> {
  constructor() {
    super('surveys');
  }

  listAvailable(): Observable<Survey[]> {
    return this.api.http.get<Survey[]>(`${FAST_API_URL}/public/surveys/available`);
  }
  details(surveyId: string): Observable<{ questions: Question[]; values: Value[] }> {
    return this.api.http.get<{ questions: Question[]; values: Value[] }>(
      `${FAST_API_URL}/public/surveys/${surveyId}/details`,
    );
  }
  resume(surveyId: string, reservationKey: string): Observable<{ survey: Survey; reservation: Anonymous }> {
    return this.api.http.get<{ survey: Survey; reservation: Anonymous }>(
      `${FAST_API_URL}/public/surveys/resume/${surveyId}?reservation_key=${encodeURIComponent(reservationKey)}`,
    );
  }
}
@Injectable({ providedIn: 'root' })
export class FtD2e6ded6 extends Resource<Question> {
  constructor() {
    super('questions');
  }
}
@Injectable({ providedIn: 'root' })
export class FtD76a0e67 extends Resource<Value> {
  constructor() {
    super('values');
  }
}
@Injectable({ providedIn: 'root' })
export class FtA5acf579 extends Resource<Answer> {
  constructor() {
    super('answers');
  }
  createPublic(payload: Omit<Answer, 'id_universal'>): Observable<Answer> {
    return this.api.http.post<Answer>(`${FAST_API_URL}/public/answers`, payload);
  }
}
