import { Component, OnInit, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FastApi } from '../../../services/backend/python/fast/fast-api';

export interface CrudField { name: string; label: string; type?: 'text' | 'number' | 'password'; required?: boolean; }
export interface CrudConfig { title: string; resource: string; fields: CrudField[]; operations: { select?: boolean; insert?: boolean; update?: boolean; delete?: boolean; }; }

@Component({ selector: 'app-entity-crud', imports: [ReactiveFormsModule], templateUrl: './entity-crud.html', styleUrl: './entity-crud.css' })
export class EntityCrud implements OnInit {
  readonly config = input.required<CrudConfig>(); readonly rows = signal<Record<string, unknown>[]>([]); readonly loading = signal(false); readonly message = signal('');
  readonly form = new FormBuilder().group({ id_universal: [''] });
  constructor(private readonly api: FastApi) {}
  ngOnInit(): void { for (const field of this.config().fields) this.form.addControl(field.name, new FormBuilder().control('', field.required ? Validators.required : [])); if (this.config().operations.select) this.load(); }
  load(): void { this.loading.set(true); this.api.list<Record<string, unknown>>(this.config().resource).subscribe({ next: (rows) => { this.rows.set(rows); this.loading.set(false); }, error: () => { this.message.set('No fue posible consultar los registros.'); this.loading.set(false); } }); }
  submit(operation: 'insert' | 'update'): void { if (this.form.invalid) { this.form.markAllAsTouched(); return; } const raw = this.form.getRawValue() as Record<string, string>; const { id_universal, ...payload } = raw; if (operation === 'update' && !id_universal) { this.message.set('Indica el ID universal para actualizar.'); return; } this.loading.set(true); const request = operation === 'insert' ? this.api.create(this.config().resource, payload) : this.api.update(this.config().resource, id_universal, payload); request.subscribe({ next: () => this.completed('Operación realizada.'), error: () => this.failed() }); }
  remove(): void { const id = this.form.controls.id_universal.value; if (!id) { this.message.set('Indica el ID universal para eliminar.'); return; } if (!confirm('¿Eliminar este registro?')) return; this.loading.set(true); this.api.delete(this.config().resource, id).subscribe({ next: () => this.completed('Registro eliminado.'), error: () => this.failed() }); }
  select(row: Record<string, unknown>): void { this.form.patchValue(row); }
  private completed(message: string): void { this.message.set(message); this.loading.set(false); if (this.config().operations.select) this.load(); }
  private failed(): void { this.message.set('La operación no pudo completarse. Revisa los datos y permisos.'); this.loading.set(false); }
}
