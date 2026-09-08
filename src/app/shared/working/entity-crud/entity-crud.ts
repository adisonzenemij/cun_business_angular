import { Component, ElementRef, OnDestroy, OnInit, ViewChild, input, signal } from '@angular/core';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { FastApi } from '../../../services/backend/python/fast/fast-api';
import DataTable from 'datatables.net-bs5';

export interface CrudField { name: string; label: string; type?: 'text' | 'number' | 'password'; required?: boolean; }
export interface CrudConfig { title: string; resource: string; fields: CrudField[]; operations: { select?: boolean; insert?: boolean; update?: boolean; delete?: boolean; }; }

@Component({ selector: 'app-entity-crud', imports: [ReactiveFormsModule], templateUrl: './entity-crud.html', styleUrl: './entity-crud.css' })
export class EntityCrud implements OnInit, OnDestroy {
  readonly config = input.required<CrudConfig>(); readonly rows = signal<Record<string, unknown>[]>([]); readonly loading = signal(false); readonly message = signal('');
  readonly form: UntypedFormGroup = new UntypedFormBuilder().group({ id_universal: [''] });
  @ViewChild('dataTable') private readonly table?: ElementRef<HTMLTableElement>;
  private dataTable?: { destroy(remove?: boolean): unknown };
  constructor(private readonly api: FastApi) {}
  ngOnInit(): void { for (const field of this.config().fields) this.form.addControl(field.name, new UntypedFormBuilder().control('', field.required ? Validators.required : [])); if (this.config().operations.select) this.load(); }
  load(): void { this.loading.set(true); this.destroyDataTable(); this.api.list<Record<string, unknown>>(this.config().resource).subscribe({ next: (rows) => { this.rows.set(rows); this.loading.set(false); setTimeout(() => this.initializeDataTable()); }, error: () => { this.message.set('No fue posible consultar los registros.'); this.loading.set(false); } }); }
  submit(operation: 'insert' | 'update'): void { if (this.form.invalid) { this.form.markAllAsTouched(); return; } const raw = this.form.getRawValue() as Record<string, string>; const { id_universal, ...payload } = raw; if (operation === 'update' && !id_universal) { this.message.set('Indica el ID universal para actualizar.'); return; } this.loading.set(true); const request = operation === 'insert' ? this.api.create(this.config().resource, payload) : this.api.update(this.config().resource, id_universal, payload); request.subscribe({ next: () => this.completed('Operación realizada.'), error: () => this.failed() }); }
  remove(): void { const id = this.form.controls['id_universal'].value; if (!id) { this.message.set('Indica el ID universal para eliminar.'); return; } if (!confirm('¿Eliminar este registro?')) return; this.loading.set(true); this.api.delete(this.config().resource, id).subscribe({ next: () => this.completed('Registro eliminado.'), error: () => this.failed() }); }
  select(row: Record<string, unknown>): void { this.form.patchValue(row); }
  ngOnDestroy(): void { this.destroyDataTable(); }
  private initializeDataTable(): void { if (!this.table || this.dataTable) return; this.dataTable = new DataTable(this.table.nativeElement, { language: { emptyTable: 'No hay registros', search: 'Buscar:', lengthMenu: 'Mostrar _MENU_ registros', info: 'Mostrando _START_ a _END_ de _TOTAL_', paginate: { next: 'Siguiente', previous: 'Anterior' } } }); }
  private destroyDataTable(): void { this.dataTable?.destroy(); this.dataTable = undefined; }
  private completed(message: string): void { this.message.set(message); this.loading.set(false); if (this.config().operations.select) this.load(); }
  private failed(): void { this.message.set('La operación no pudo completarse. Revisa los datos y permisos.'); this.loading.set(false); }
}
