import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FastApi, FAST_API_URL } from './fast-api';

export interface LoginRequest { fd_login: string; fd_passd: string; }
export interface LoginResponse { access_token: string; token_type: 'bearer'; }

@Injectable({ providedIn: 'root' })
export class FastAuth {
  private readonly api = inject(FastApi);
  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.api.http.post<LoginResponse>(`${FAST_API_URL}/auth/login`, payload);
  }
}
