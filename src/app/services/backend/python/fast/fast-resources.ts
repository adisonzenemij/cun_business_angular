import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { FAST_API_URL, FastApi } from './fast-api';

export interface CorsOrigin {
  id_universal: string;
  fd_service: string;
}
export interface User {
  id_universal: string;
  fd_login: string;
  tg_9a7bbe6f?: string | null;
}
export interface JwtPermit { id_universal: string; fd_name: string; }
export interface TableModule { id_universal: string; fd_client: string; fd_prefix: string; fd_product: string; }
export interface TableResource { id_universal: string; fd_client: string; fd_entity: string; fd_name: string; sd_select: string; sd_insert: string; sd_update: string; sd_delete: string; ms_8b6bd18a: string; }
export interface RoleData { id_universal: string; fd_name: string; }
export interface RoleAccess { id_universal: string; fd_name: string; }
export interface RolePermit { id_universal: string; ms_2e794a8f: string; tg_2f997592: string; tg_9a7bbe6f: string; }
export interface RoleModule { id_universal: string; ms_8b6bd18a: string; tg_2f997592: string; tg_9a7bbe6f: string; }
export interface NavigationModule extends TableModule { resources: (TableResource & { route: string; icon: string })[]; }
interface CurrentPermission { client: string; access: string; }
interface CurrentModulePermission { module_id: string; access: string; }
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

const navigation = new Map<string, { route: string; icon: string }>([
  ['d8d07776', { route: 'd8d07776', icon: 'bi-key' }], ['e144c860', { route: 'e144c860', icon: 'bi-globe' }], ['a7b95fe8', { route: 'a7b95fe8', icon: 'bi-list-ul' }], ['a1fecd50', { route: 'a1fecd50', icon: 'bi-collection' }], ['e9cb64fd', { route: 'e9cb64fd', icon: 'bi-diagram-3' }], ['b602ef28', { route: 'b602ef28', icon: 'bi-person-badge' }], ['d02ee146', { route: 'd02ee146', icon: 'bi-shield-check' }], ['b52d40d1', { route: 'b52d40d1', icon: 'bi-grid-3x3-gap' }], ['a8dc1924', { route: 'a8dc1924', icon: 'bi-person-lock' }], ['b64883b6', { route: 'b64883b6', icon: 'bi-people' }], ['d35a393b', { route: 'd35a393b', icon: 'bi-hdd-network' }], ['8ebaa791', { route: '8ebaa791', icon: 'bi-diagram-3' }], ['a1cc27fb', { route: 'a1cc27fb', icon: 'bi-buildings' }], ['e5520e1e', { route: 'e5520e1e', icon: 'bi-person' }], ['a6aedeb5', { route: 'a6aedeb5', icon: 'bi-shield-check' }], ['a3b378b4', { route: 'a3b378b4', icon: 'bi-ui-checks' }], ['d5fb87de', { route: 'd5fb87de', icon: 'bi-clipboard-data' }], ['d2e6ded6', { route: 'd2e6ded6', icon: 'bi-question-circle' }], ['d76a0e67', { route: 'd76a0e67', icon: 'bi-list-check' }], ['a5acf579', { route: 'a5acf579', icon: 'bi-chat-left-text' }],
]);

@Injectable({ providedIn: 'root' })
export class MetadataCatalog {
  private readonly api = inject(FastApi);
  readonly modules = signal<NavigationModule[]>([]);
  readonly allowedClients = signal<Set<string>>(new Set());
  readonly allowedModuleIds = signal<Set<string>>(new Set());
  load(): void {
    this.api.http.get<{ permissions: CurrentPermission[]; module_permissions: CurrentModulePermission[] }>(`${FAST_API_URL}/auth/permissions`).subscribe((permissionResult) => {
      this.allowedClients.set(new Set(permissionResult.permissions.filter((item) => item.access === 'Permitido').map((item) => item.client)));
      this.allowedModuleIds.set(new Set(
        (permissionResult.module_permissions ?? [])
          .filter((item) => item.access === 'Permitido')
          .map((item) => item.module_id),
      ));
      this.api.http.get<TableModule[]>(`${FAST_API_URL}/table-modules/`).subscribe((modules) => {
      this.api.http.get<TableResource[]>(`${FAST_API_URL}/table-resources/`).subscribe((resources) => {
        this.modules.set(
          modules
            .map((module) => {
              const moduleResources = resources
                .filter((resource) => resource.ms_8b6bd18a === module.id_universal)
                .map((resource) => ({ ...resource, ...(navigation.get(resource.fd_client) ?? { route: '', icon: 'bi-circle' }) }))
                .filter((resource) => !!resource.route && this.allowedClients().has(resource.fd_client))
                .sort((left, right) => left.fd_name.localeCompare(right.fd_name, 'es'));
              return { ...module, resources: moduleResources };
            })
            .filter((module) => this.allowedModuleIds().has(module.id_universal))
            .sort((left, right) => left.fd_product.localeCompare(right.fd_product, 'es')),
        );
      });
    });
    });
  }
}

@Injectable({ providedIn: 'root' })
export class FtE144c860 extends Resource<CorsOrigin> {
  constructor() {
    super('cors-origins');
  }
}
@Injectable({ providedIn: 'root' }) export class FtD8d07776 extends Resource<JwtPermit> { constructor() { super('jwt-permits'); } }
@Injectable({ providedIn: 'root' }) export class FtA1fecd50 extends Resource<TableModule> { constructor() { super('table-modules'); } }
@Injectable({ providedIn: 'root' }) export class FtE9cb64fd extends Resource<TableResource> { constructor() { super('table-resources'); } }
@Injectable({ providedIn: 'root' }) export class FtB602ef28 extends Resource<RoleData> { constructor() { super('role-data'); } }
@Injectable({ providedIn: 'root' }) export class FtD02ee146 extends Resource<RoleAccess> { constructor() { super('role-access'); } }
@Injectable({ providedIn: 'root' }) export class FtA8dc1924 extends Resource<RolePermit> { constructor() { super('role-permits'); } }
@Injectable({ providedIn: 'root' }) export class FtB52d40d1 extends Resource<RoleModule> { constructor() { super('role-modules'); } }
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
