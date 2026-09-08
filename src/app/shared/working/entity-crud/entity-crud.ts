import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  input,
  signal,
} from '@angular/core';
import {
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { FastApi } from '../../../services/backend/python/fast/fast-api';
import DataTable from 'datatables.net-bs5';
import Swal from 'sweetalert2';

export interface CrudField {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'password' | 'date';
  required?: boolean;
  relation?: { resource: string; displayField: string };
}
export interface CrudConfig {
  title: string;
  resource: string;
  fields: CrudField[];
  operations: { select?: boolean; insert?: boolean; update?: boolean; delete?: boolean };
  passwordChange?: boolean;
}

@Component({
  selector: 'app-entity-crud',
  imports: [ReactiveFormsModule],
  templateUrl: './entity-crud.html',
  styleUrl: './entity-crud.css',
})
export class EntityCrud implements OnInit, AfterViewInit, OnDestroy {
  readonly config = input.required<CrudConfig>();
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly relationOptions = signal<Record<string, Record<string, unknown>[]>>({});
  readonly selectedRecord = signal<Record<string, unknown> | null>(null);
  readonly loading = signal(false);
  readonly message = signal('');
  readonly editing = signal(false);
  readonly showFormModal = signal(false);
  readonly showPasswordModal = signal(false);
  readonly form: UntypedFormGroup = new UntypedFormBuilder().group({ id_universal: [''] });
  readonly passwordForm: UntypedFormGroup = new UntypedFormBuilder().group({
    fd_passd: ['', Validators.required],
    confirmation: ['', Validators.required],
  });
  @ViewChild('dataTable') private readonly table?: ElementRef<HTMLTableElement>;
  private dataTable?: { destroy(remove?: boolean): unknown };
  constructor(private readonly api: FastApi) {}
  ngOnInit(): void {
    for (const field of this.config().fields)
      this.form.addControl(
        field.name,
        new UntypedFormBuilder().control('', field.required ? Validators.required : []),
      );
    if (this.config().operations.select) this.load();
  }
  ngAfterViewInit(): void {
    if (!this.config().operations.select) this.initializeDataTable();
  }
  load(): void {
    this.loading.set(true);
    this.destroyDataTable();
    this.api.list<Record<string, unknown>>(this.config().resource).subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.selectedRecord.set(null);
        this.loading.set(false);
        setTimeout(() => this.initializeDataTable());
      },
      error: () => {
        this.message.set('No fue posible consultar los registros.');
        this.loading.set(false);
      },
    });
  }
  openCreate(): void {
    this.editing.set(false);
    this.form.reset({ id_universal: '' });
    this.loadRelationOptions();
    this.showFormModal.set(true);
  }
  openEdit(): void {
    if (!this.selectedRecord()) return;
    this.editing.set(true);
    this.loadRelationOptions();
    this.showFormModal.set(true);
  }
  closeFormModal(): void {
    this.showFormModal.set(false);
  }
  openPassword(): void {
    if (!this.selectedRecord()) return;
    this.passwordForm.reset();
    this.showPasswordModal.set(true);
  }
  closePasswordModal(): void {
    this.showPasswordModal.set(false);
  }
  submitPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { fd_passd, confirmation } = this.passwordForm.getRawValue() as Record<string, string>;
    if (fd_passd !== confirmation) {
      this.message.set('La contraseña y su confirmación no coinciden.');
      return;
    }
    const id = this.selectedRecord()?.['id_universal'] as string | undefined;
    if (!id) return;
    this.loading.set(true);
    this.api.update(this.config().resource, id, { fd_passd }).subscribe({
      next: () => {
        this.closePasswordModal();
        this.completed('Contraseña actualizada.');
      },
      error: () => this.failed(),
    });
  }
  submit(operation: 'insert' | 'update'): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue() as Record<string, string>;
    const { id_universal, ...payload } = raw;
    if (operation === 'update' && this.config().passwordChange) delete payload['fd_passd'];
    if (operation === 'update' && !id_universal) {
      this.message.set('Indica el ID universal para actualizar.');
      return;
    }
    this.loading.set(true);
    const request =
      operation === 'insert'
        ? this.api.create(this.config().resource, payload)
        : this.api.update(this.config().resource, id_universal, payload);
    request.subscribe({
      next: () =>
        this.completed(operation === 'insert' ? 'Registro creado' : 'Registro actualizado'),
      error: () => this.failed(),
    });
  }
  remove(): void {
    if (!this.selectedRecord()) {
      this.message.set('Selecciona un registro para eliminar.');
      return;
    }
    const id = this.form.controls['id_universal'].value;
    if (!id) {
      this.message.set('Indica el ID universal para eliminar.');
      return;
    }
    if (!confirm('¿Eliminar este registro?')) return;
    this.loading.set(true);
    this.api
      .delete(this.config().resource, id)
      .subscribe({ next: () => this.completed('Registro eliminado'), error: () => this.failed() });
  }
  toggleSelection(row: Record<string, unknown>): void {
    if (this.selectedRecord()?.['id_universal'] === row['id_universal']) {
      this.selectedRecord.set(null);
      this.form.reset({ id_universal: '' });
      return;
    }
    this.form.patchValue(row);
    this.selectedRecord.set(row);
  }
  ngOnDestroy(): void {
    this.destroyDataTable();
  }
  private initializeDataTable(): void {
    if (!this.table || this.dataTable) return;
    this.dataTable = new DataTable(this.table.nativeElement, {
      language: {
        emptyTable: 'No hay registros',
        search: 'Buscar:',
        lengthMenu: 'Mostrar _MENU_ registros',
        info: 'Mostrando _START_ a _END_ de _TOTAL_',
        paginate: { next: 'Siguiente', previous: 'Anterior' },
      },
    });
  }
  private loadRelationOptions(): void {
    for (const field of this.config().fields) {
      if (!field.relation || this.relationOptions()[field.name]) continue;
      this.api.list<Record<string, unknown>>(field.relation.resource).subscribe({
        next: (options) =>
          this.relationOptions.update((current) => ({ ...current, [field.name]: options })),
        error: () => this.message.set(`No fue posible cargar las opciones de ${field.label}.`),
      });
    }
  }
  private destroyDataTable(): void {
    this.dataTable?.destroy();
    this.dataTable = undefined;
  }
  private completed(message: string): void {
    this.closeFormModal();
    this.closePasswordModal();
    this.selectedRecord.set(null);
    this.message.set('');
    this.loading.set(false);
    void Swal.fire({
      icon: 'success',
      title: message,
      text: 'La operación se completó correctamente.',
      confirmButtonText: 'Aceptar',
    });
    if (this.config().operations.select) this.load();
  }
  private failed(): void {
    this.message.set('La operación no pudo completarse. Revisa los datos y permisos.');
    this.loading.set(false);
  }
}
