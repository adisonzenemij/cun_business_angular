import {
  AfterViewInit,
  ChangeDetectorRef,
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
import { forkJoin, map } from 'rxjs';

export interface CrudField {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'password' | 'date';
  required?: boolean;
  showInTable?: boolean;
  relation?: { resource: string; displayField: string; orderBy?: string };
}
export interface CrudConfig {
  title: string;
  resource: string;
  fields: CrudField[];
  operations: { select?: boolean; insert?: boolean; update?: boolean; delete?: boolean };
  passwordChange?: boolean;
  valuesManager?: boolean;
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
  readonly tableVersion = signal(0);
  readonly relationOptions = signal<Record<string, Record<string, unknown>[]>>({});
  readonly selectedRecord = signal<Record<string, unknown> | null>(null);
  readonly loading = signal(false);
  readonly message = signal('');
  readonly editing = signal(false);
  readonly showFormModal = signal(false);
  readonly showPasswordModal = signal(false);
  readonly showValuesModal = signal(false);
  readonly surveyQuestions = signal<Record<string, unknown>[]>([]);
  readonly surveyValues = signal<Record<string, unknown>[]>([]);
  readonly valuesTableVersion = signal(0);
  readonly valueForm: UntypedFormGroup = new UntypedFormBuilder().group({
    fd_option: ['', Validators.required],
    fd_order: ['', Validators.required],
    pm_0acc84ae: ['', Validators.required],
  });
  readonly form: UntypedFormGroup = new UntypedFormBuilder().group({ id_universal: [''] });
  readonly passwordForm: UntypedFormGroup = new UntypedFormBuilder().group({
    fd_passd: ['', Validators.required],
    confirmation: ['', Validators.required],
  });
  @ViewChild('dataTable') private readonly table?: ElementRef<HTMLTableElement>;
  @ViewChild('valuesTable') private readonly valuesTable?: ElementRef<HTMLTableElement>;
  private dataTable?: { destroy(remove?: boolean): unknown };
  private valuesDataTable?: { destroy(remove?: boolean): unknown };
  private requestVersion = 0;
  constructor(
    private readonly api: FastApi,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {}
  ngOnInit(): void {
    for (const field of this.config().fields)
      this.form.addControl(
        field.name,
        new UntypedFormBuilder().control('', field.required ? Validators.required : []),
      );
    this.load();
  }
  ngAfterViewInit(): void {
    if (!this.config().operations.select) this.initializeDataTable();
  }
  load(): void {
    const requestVersion = ++this.requestVersion;
    this.loading.set(true);
    this.destroyDataTable();
    this.rows.set([]);
    if (this.table) this.changeDetectorRef.detectChanges();
    this.api.list<Record<string, unknown>>(this.config().resource).subscribe({
      next: (rows) => {
        this.rows.set(Array.isArray(rows) ? rows : []);
        this.selectedRecord.set(null);
        this.loadTableRelations(requestVersion);
      },
      error: () => {
        if (requestVersion !== this.requestVersion) return;
        this.message.set('No fue posible consultar los registros.');
        this.finishTableLoad(requestVersion);
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
  openValues(): void {
    const selected = this.selectedRecord();
    const surveyId = (this.config().resource === 'surveys'
      ? selected?.['id_universal']
      : selected?.['pm_4d802b91']) as string | undefined;
    if (!surveyId) return;
    this.showValuesModal.set(true);
    this.loadSurveyValues(surveyId, this.config().resource === 'questions' ? String(selected?.['id_universal']) : undefined);
  }
  closeValuesModal(): void {
    this.destroyValuesDataTable();
    this.showValuesModal.set(false);
  }
  moveValue(value: Record<string, unknown>, direction: -1 | 1): void {
    const questionId = value['pm_0acc84ae'];
    const ordered = this.surveyValues()
      .filter((item) => item['pm_0acc84ae'] === questionId)
      .sort((first, second) => Number(first['fd_order']) - Number(second['fd_order']));
    const currentIndex = ordered.findIndex((item) => item['id_universal'] === value['id_universal']);
    const target = ordered[currentIndex + direction];
    if (!target) return;
    const currentOrder = value['fd_order'];
    this.loading.set(true);
    forkJoin([
      this.api.update('values', String(value['id_universal']), { fd_order: target['fd_order'] }),
      this.api.update('values', String(target['id_universal']), { fd_order: currentOrder }),
    ]).subscribe({
      next: () => {
        const surveyId = this.selectedRecord()?.['id_universal'] as string;
        this.loadSurveyValues(surveyId);
        this.completed('Orden de valores actualizado.');
      },
      error: () => this.failed(),
    });
  }
  createValue(): void {
    if (this.valueForm.invalid) { this.valueForm.markAllAsTouched(); return; }
    this.loading.set(true);
    this.api.create('values', this.valueForm.getRawValue()).subscribe({
      next: () => {
        const selected = this.selectedRecord();
        const surveyId = (this.config().resource === 'surveys' ? selected?.['id_universal'] : selected?.['pm_4d802b91']) as string;
        this.valueForm.patchValue({ fd_option: '', fd_order: this.nextValueOrder(), pm_0acc84ae: this.config().resource === 'questions' ? selected?.['id_universal'] : '' });
        this.loadSurveyValues(surveyId, this.config().resource === 'questions' ? String(selected?.['id_universal']) : undefined);
        this.completed('Valor creado.');
      },
      error: () => this.failed(),
    });
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
  displayValue(row: Record<string, unknown>, field: CrudField): unknown {
    const value = row[field.name];
    if (!field.relation) return value;
    const related = this.relationOptions()[field.name]?.find(
      (option) => option['id_universal'] === value,
    );
    return related?.[field.relation.displayField] ?? value;
  }
  tableFields(): CrudField[] {
    return this.config().fields.filter((field) => field.showInTable !== false);
  }
  questionLabel(questionId: unknown): string {
    const question = this.surveyQuestions().find(
      (item) => item['id_universal'] === questionId,
    );
    return question ? `${question['fd_order']}. ${question['fd_ask']}` : String(questionId ?? '');
  }
  relationOptionLabel(field: CrudField, option: Record<string, unknown>): string {
    const displayValue = String(option[field.relation?.displayField ?? ''] ?? '');
    const orderBy = field.relation?.orderBy;
    return orderBy ? `${option[orderBy]}. ${displayValue}` : displayValue;
  }
  ngOnDestroy(): void {
    this.destroyDataTable();
    this.destroyValuesDataTable();
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
  private loadSurveyValues(surveyId: string, questionId?: string): void {
    this.destroyValuesDataTable();
    forkJoin({
      questions: this.api.list<Record<string, unknown>>('questions'),
      values: this.api.list<Record<string, unknown>>('values'),
    }).subscribe({
      next: ({ questions, values }) => {
        const surveyQuestions = questions
          .filter((question) => question['pm_4d802b91'] === surveyId)
          .sort((first, second) => Number(first['fd_order']) - Number(second['fd_order']));
        const questionIds = new Set((questionId ? surveyQuestions.filter((question) => question['id_universal'] === questionId) : surveyQuestions).map((question) => question['id_universal']));
        this.surveyQuestions.set(surveyQuestions);
        this.surveyValues.set(
          values
            .filter((value) => questionIds.has(value['pm_0acc84ae']))
            .sort((first, second) => Number(first['fd_order']) - Number(second['fd_order'])),
        );
        this.valuesTableVersion.update((version) => version + 1);
        this.changeDetectorRef.detectChanges();
        this.initializeValuesDataTable();
        this.valueForm.patchValue({ fd_option: '', pm_0acc84ae: questionId ?? '' });
        this.valueForm.patchValue({ fd_order: this.nextValueOrder() });
      },
      error: () => this.message.set('No fue posible consultar los valores de la encuesta.'),
    });
  }
  private initializeValuesDataTable(): void {
    if (!this.valuesTable || this.valuesDataTable) return;
    this.valuesDataTable = new DataTable(this.valuesTable.nativeElement, {
      language: { emptyTable: 'No hay valores', search: 'Buscar:', lengthMenu: 'Mostrar _MENU_ registros', info: 'Mostrando _START_ a _END_ de _TOTAL_', paginate: { next: 'Siguiente', previous: 'Anterior' } },
    });
  }
  private destroyValuesDataTable(): void {
    this.valuesDataTable?.destroy();
    this.valuesDataTable = undefined;
  }
  nextValueOrder(): number {
    const questionId = this.valueForm.get('pm_0acc84ae')?.value;
    return this.surveyValues().filter((value) => value['pm_0acc84ae'] === questionId).reduce(
      (highest, value) => Math.max(highest, Number(value['fd_order']) || 0), 0,
    ) + 1;
  }
  private loadRelationOptions(): void {
    for (const field of this.config().fields) {
      if (!field.relation || this.relationOptions()[field.name]) continue;
      this.api.list<Record<string, unknown>>(field.relation.resource).subscribe({
        next: (options) =>
          this.relationOptions.update((current) => ({
            ...current,
            [field.name]: this.sortRelationOptions(field, options),
          })),
        error: () => this.message.set(`No fue posible cargar las opciones de ${field.label}.`),
      });
    }
  }
  private loadTableRelations(requestVersion: number): void {
    const relationFields = this.config().fields.filter((field) => field.relation);
    if (!relationFields.length) {
      this.finishTableLoad(requestVersion);
      return;
    }
    forkJoin(
      relationFields.map((field) =>
        this.api
          .list<Record<string, unknown>>(field.relation!.resource)
          .pipe(map((options) => ({ field: field.name, options }))),
      ),
    ).subscribe({
      next: (relations) => {
        this.relationOptions.update((current) => ({
          ...current,
          ...Object.fromEntries(
            relations.map(({ field, options }) => [
              field,
              this.sortRelationOptions(
                relationFields.find((relationField) => relationField.name === field)!,
                options,
              ),
            ]),
          ),
        }));
        this.finishTableLoad(requestVersion);
      },
      error: () => this.finishTableLoad(requestVersion),
    });
  }
  private finishTableLoad(requestVersion: number): void {
    if (requestVersion !== this.requestVersion) return;
    this.loading.set(false);
    this.tableVersion.update((version) => version + 1);
    if (this.table) this.changeDetectorRef.detectChanges();
    setTimeout(() => {
      if (requestVersion === this.requestVersion) this.initializeDataTable();
    });
  }
  private sortRelationOptions(
    field: CrudField,
    options: Record<string, unknown>[],
  ): Record<string, unknown>[] {
    const orderBy = field.relation?.orderBy;
    if (!orderBy) return options;
    return [...options].sort((first, second) => Number(first[orderBy]) - Number(second[orderBy]));
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
    this.load();
  }
  private failed(): void {
    this.message.set('La operación no pudo completarse. Revisa los datos y permisos.');
    this.loading.set(false);
  }
}
