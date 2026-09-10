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
import { catchError, forkJoin, map, of } from 'rxjs';

export interface CrudField {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'password' | 'date' | 'boolean';
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
  questionsManager?: boolean;
  valuesManager?: boolean;
  autoComplete?: boolean;
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
  readonly selectedRecords = signal<Record<string, unknown>[]>([]);
  readonly loading = signal(false);
  readonly message = signal('');
  readonly editing = signal(false);
  readonly showFormModal = signal(false);
  readonly showPasswordModal = signal(false);
  readonly showQuestionsModal = signal(false);
  readonly showValuesModal = signal(false);
  readonly showAutoFillModal = signal(false);
  readonly showAutoFillConfigurationModal = signal(false);
  readonly autoFillAvailableSlots = signal(0);
  readonly autoFillMemoryMaxMb = signal(0);
  readonly autoFillQuestions = signal<Record<string, unknown>[]>([]);
  readonly autoFillValues = signal<Record<string, unknown>[]>([]);
  readonly autoFillAllowedValues = signal<Record<string, string[]>>({});
  readonly surveyQuestions = signal<Record<string, unknown>[]>([]);
  readonly managedQuestions = signal<Record<string, unknown>[]>([]);
  readonly questionTypes = signal<Record<string, unknown>[]>([]);
  readonly selectedManagedQuestions = signal<Record<string, unknown>[]>([]);
  readonly editingManagedQuestion = signal<Record<string, unknown> | null>(null);
  readonly questionsTableVersion = signal(0);
  readonly surveyValues = signal<Record<string, unknown>[]>([]);
  readonly selectedValues = signal<Record<string, unknown>[]>([]);
  readonly editingValue = signal<Record<string, unknown> | null>(null);
  readonly valuesTableVersion = signal(0);
  readonly valueForm: UntypedFormGroup = new UntypedFormBuilder().group({
    fd_option: ['', Validators.required],
    fd_order: ['', Validators.required],
    pm_0acc84ae: ['', Validators.required],
  });
  readonly questionForm: UntypedFormGroup = new UntypedFormBuilder().group({
    fd_ask: ['', Validators.required],
    fd_order: [1, [Validators.required, Validators.min(1)]],
    fd_required: [false],
    pm_0d3dc00e: ['', Validators.required],
  });
  readonly form: UntypedFormGroup = new UntypedFormBuilder().group({ id_universal: [''] });
  readonly passwordForm: UntypedFormGroup = new UntypedFormBuilder().group({
    fd_passd: ['', Validators.required],
    confirmation: ['', Validators.required],
  });
  readonly autoFillForm: UntypedFormGroup = new UntypedFormBuilder().group({
    responses: [1, [Validators.required, Validators.min(1)]],
    bots: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
    memory_value: [512, [Validators.required, Validators.min(1)]],
    memory_unit: ['MB', Validators.required],
  });
  @ViewChild('dataTable') private readonly table?: ElementRef<HTMLTableElement>;
  @ViewChild('valuesTable') private readonly valuesTable?: ElementRef<HTMLTableElement>;
  @ViewChild('questionsTable') private readonly questionsTable?: ElementRef<HTMLTableElement>;
  private dataTable?: { destroy(remove?: boolean): unknown };
  private valuesDataTable?: { destroy(remove?: boolean): unknown };
  private questionsDataTable?: { destroy(remove?: boolean): unknown };
  private requestVersion = 0;
  constructor(
    private readonly api: FastApi,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {}
  ngOnInit(): void {
    for (const field of this.config().fields)
      this.form.addControl(
        field.name,
        new UntypedFormBuilder().control(
          field.type === 'boolean' ? false : '',
          field.required ? Validators.required : [],
        ),
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
        this.selectedRecords.set([]);
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
    this.form.get('id_universal')?.enable();
    const defaults: Record<string, unknown> = { id_universal: '' };
    for (const field of this.config().fields) {
      defaults[field.name] = field.type === 'boolean' ? false : '';
    }
    this.form.reset(defaults);
    this.loadRelationOptions();
    this.showFormModal.set(true);
  }
  openEdit(): void {
    if (!this.requireSingleSelection('editar')) return;
    this.editing.set(true);
    this.form.get('id_universal')?.disable();
    this.loadRelationOptions();
    this.showFormModal.set(true);
  }
  closeFormModal(): void {
    this.showFormModal.set(false);
    this.clearSelection();
  }
  openPassword(): void {
    if (!this.requireSingleSelection('cambiar la contraseña de')) return;
    this.passwordForm.reset();
    this.showPasswordModal.set(true);
  }
  openValues(): void {
    const selected = this.requireSingleSelection('gestionar los valores de');
    if (!selected) return;
    const surveyId = (this.config().resource === 'surveys'
      ? selected?.['id_universal']
      : selected?.['pm_4d802b91']) as string | undefined;
    if (!surveyId) return;
    this.showValuesModal.set(true);
    this.loadSurveyValues(surveyId, this.config().resource === 'questions' ? String(selected?.['id_universal']) : undefined);
  }
  openQuestions(): void {
    const survey = this.requireSingleSelection('gestionar las preguntas de');
    if (!survey) return;
    const surveyId = String(survey['id_universal']);
    this.destroyQuestionsDataTable();
    this.selectedManagedQuestions.set([]);
    this.editingManagedQuestion.set(null);
    this.showQuestionsModal.set(true);
    this.questionForm.reset({ fd_ask: '', fd_order: 1, fd_required: false, pm_0d3dc00e: '' });
    forkJoin({
      questions: this.api.list<Record<string, unknown>>('questions'),
      types: this.api.list<Record<string, unknown>>('types'),
    }).subscribe({
      next: ({ questions, types }) => {
        const managedQuestions = questions
          .filter((question) => question['pm_4d802b91'] === surveyId)
          .sort((first, second) => Number(first['fd_order']) - Number(second['fd_order']));
        this.managedQuestions.set(managedQuestions);
        this.questionTypes.set(types);
        this.questionForm.patchValue({ fd_order: this.nextManagedQuestionOrder() });
        this.questionsTableVersion.update((version) => version + 1);
        this.changeDetectorRef.detectChanges();
        this.initializeQuestionsDataTable();
      },
      error: () => this.failed(),
    });
  }
  closeQuestionsModal(): void {
    this.destroyQuestionsDataTable();
    this.showQuestionsModal.set(false);
    this.managedQuestions.set([]);
    this.questionTypes.set([]);
    this.selectedManagedQuestions.set([]);
    this.editingManagedQuestion.set(null);
    this.questionForm.reset();
    this.clearSelection();
  }
  saveQuestion(): void {
    const survey = this.requireSingleSelection('agregar una pregunta a');
    if (!survey || this.questionForm.invalid) {
      this.questionForm.markAllAsTouched();
      return;
    }
    const values = this.questionForm.getRawValue();
    this.loading.set(true);
    this.questionForm.disable();
    const editing = this.editingManagedQuestion();
    const payload = {
      fd_ask: values.fd_ask,
      fd_order: Number(values.fd_order),
      fd_required: Boolean(values.fd_required),
      pm_0d3dc00e: values.pm_0d3dc00e,
      pm_4d802b91: String(survey['id_universal']),
    };
    const request = editing
      ? this.api.update('questions', String(editing['id_universal']), payload)
      : this.api.create('questions', payload);
    request.subscribe({
      next: () => {
        const totalQuestions = editing ? this.managedQuestions().length : this.managedQuestions().length + 1;
        this.api.update('surveys', String(survey['id_universal']), { fd_query: totalQuestions }).subscribe({
          next: () => {
            this.loading.set(false);
            this.questionForm.enable();
            this.editingManagedQuestion.set(null);
            this.selectedManagedQuestions.set([]);
            const updatedSurvey = { ...survey, fd_query: totalQuestions };
            this.selectedRecord.set(updatedSurvey);
            this.selectedRecords.set([updatedSurvey]);
            this.rows.update((rows) => rows.map((row) =>
              row['id_universal'] === survey['id_universal'] ? updatedSurvey : row,
            ));
            this.questionForm.reset({
              fd_ask: '', fd_order: this.nextManagedQuestionOrder(), fd_required: false, pm_0d3dc00e: '',
            });
            this.refreshManagedQuestions();
            void Swal.fire({ icon: 'success', title: editing ? 'Pregunta actualizada' : 'Pregunta agregada', confirmButtonText: 'Aceptar' });
          },
          error: () => {
            this.questionForm.enable();
            this.failed();
          },
        });
      },
      error: () => {
        this.questionForm.enable();
        this.failed();
      },
    });
  }
  private nextManagedQuestionOrder(): number {
    return Math.max(0, ...this.managedQuestions().map((question) => Number(question['fd_order']) || 0)) + 1;
  }
  toggleManagedQuestionSelection(question: Record<string, unknown>): void {
    const selected = this.selectedManagedQuestions();
    this.selectedManagedQuestions.set(
      selected.some((item) => item['id_universal'] === question['id_universal'])
        ? selected.filter((item) => item['id_universal'] !== question['id_universal'])
        : [...selected, question],
    );
  }
  isManagedQuestionSelected(question: Record<string, unknown>): boolean {
    return this.selectedManagedQuestions().some((item) => item['id_universal'] === question['id_universal']);
  }
  managedQuestionTypeLabel(typeId: unknown): string {
    return String(this.questionTypes().find((type) => type['id_universal'] === typeId)?.['fd_format'] ?? '—');
  }
  moveManagedQuestion(question: Record<string, unknown>, direction: -1 | 1): void {
    const ordered = [...this.managedQuestions()]
      .sort((first, second) => Number(first['fd_order']) - Number(second['fd_order']));
    const currentIndex = ordered.findIndex((item) => item['id_universal'] === question['id_universal']);
    const target = ordered[currentIndex + direction];
    if (!target) return;
    this.loading.set(true);
    forkJoin([
      this.api.update('questions', String(question['id_universal']), { fd_order: target['fd_order'] }),
      this.api.update('questions', String(target['id_universal']), { fd_order: question['fd_order'] }),
    ]).subscribe({
      next: () => {
        this.loading.set(false);
        this.refreshManagedQuestions();
      },
      error: () => this.failed(),
    });
  }
  openManagedQuestionEdit(): void {
    const selected = this.selectedManagedQuestions();
    if (selected.length !== 1) {
      void Swal.fire({
        icon: 'info', title: 'Selección requerida',
        text: selected.length ? 'Solo se puede editar una pregunta a la vez.' : 'Selecciona una pregunta para editar.',
        confirmButtonText: 'Aceptar',
      });
      return;
    }
    this.editingManagedQuestion.set(selected[0]);
    this.questionForm.patchValue(selected[0]);
  }
  cancelManagedQuestionEdit(): void {
    this.editingManagedQuestion.set(null);
    this.selectedManagedQuestions.set([]);
    this.questionForm.reset({
      fd_ask: '', fd_order: this.nextManagedQuestionOrder(), fd_required: false, pm_0d3dc00e: '',
    });
  }
  removeManagedQuestions(): void {
    const selected = this.selectedManagedQuestions();
    if (!selected.length) return;
    void Swal.fire({
      title: `¿Eliminar ${selected.length} pregunta${selected.length === 1 ? '' : 's'}?`,
      text: 'Solo se eliminarán las preguntas que no estén siendo utilizadas por valores o respuestas.',
      icon: 'warning', showCancelButton: true, confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.loading.set(true);
      forkJoin(selected.map((question) => this.api.delete('questions', String(question['id_universal'])).pipe(
        map(() => ({ error: undefined as unknown })),
        catchError((error) => of({ error: error as unknown })),
      ))).subscribe({
        next: (outcomes) => {
          const failed = outcomes.filter((outcome) => outcome.error !== undefined);
          const deleted = selected.length - failed.length;
          const survey = this.selectedRecord();
          if (!survey || !deleted) {
            this.loading.set(false);
            this.selectedManagedQuestions.set([]);
            this.refreshManagedQuestions();
            if (failed.length) this.showBatchDeleteResult(0, failed.map(({ error }) => error));
            return;
          }
          const totalQuestions = Math.max(0, this.managedQuestions().length - deleted);
          this.api.update('surveys', String(survey['id_universal']), { fd_query: totalQuestions }).subscribe({
            next: () => {
              this.loading.set(false);
              const updatedSurvey = { ...survey, fd_query: totalQuestions };
              this.selectedRecord.set(updatedSurvey);
              this.selectedRecords.set([updatedSurvey]);
              this.rows.update((rows) => rows.map((row) =>
                row['id_universal'] === survey['id_universal'] ? updatedSurvey : row,
              ));
              this.selectedManagedQuestions.set([]);
              this.editingManagedQuestion.set(null);
              this.refreshManagedQuestions();
              if (failed.length) this.showBatchDeleteResult(deleted, failed.map(({ error }) => error));
              else void Swal.fire({ icon: 'success', title: 'Preguntas eliminadas', confirmButtonText: 'Aceptar' });
            },
            error: () => this.failed(),
          });
        },
      });
    });
  }
  private refreshManagedQuestions(): void {
    const surveyId = this.selectedRecord()?.['id_universal'];
    if (!surveyId) return;
    this.loadManagedQuestions(String(surveyId));
  }
  private loadManagedQuestions(surveyId: string): void {
    this.destroyQuestionsDataTable();
    this.api.list<Record<string, unknown>>('questions').subscribe({
      next: (questions) => {
        this.managedQuestions.set(
          questions
            .filter((question) => question['pm_4d802b91'] === surveyId)
            .sort((first, second) => Number(first['fd_order']) - Number(second['fd_order'])),
        );
        if (!this.editingManagedQuestion()) {
          this.questionForm.patchValue({ fd_order: this.nextManagedQuestionOrder() });
        }
        this.questionsTableVersion.update((version) => version + 1);
        this.changeDetectorRef.detectChanges();
        this.initializeQuestionsDataTable();
      },
      error: () => this.message.set('No fue posible consultar las preguntas de la encuesta.'),
    });
  }
  closeValuesModal(): void {
    this.destroyValuesDataTable();
    this.selectedValues.set([]);
    this.editingValue.set(null);
    this.showValuesModal.set(false);
    this.clearSelection();
  }
  openAutoFill(): void {
    const survey = this.requireSingleSelection('autocompletar');
    if (!survey) return;
    this.autoFillForm.enable();
    this.autoFillForm.reset({ responses: 1, bots: 1, memory_value: 512, memory_unit: 'MB' });
    this.autoFillAvailableSlots.set(0);
    this.autoFillMemoryMaxMb.set(0);
    this.autoFillQuestions.set([]);
    this.autoFillValues.set([]);
    this.autoFillAllowedValues.set({});
    this.showAutoFillConfigurationModal.set(false);
    this.setAutoFillResponseLimit(0);
    this.showAutoFillModal.set(true);
    this.refreshAutoFillMemoryCapacity();
    forkJoin({
      surveys: this.api.list<Record<string, unknown>>('surveys/available'),
      questions: this.api.list<Record<string, unknown>>('questions'),
      values: this.api.list<Record<string, unknown>>('values'),
    }).subscribe({
      next: ({ surveys, questions, values }) => {
        const current = surveys.find((item) => item['id_universal'] === survey['id_universal']);
        const availableSlots = Math.max(0, Number(current?.['fd_available_slots']) || 0);
        this.autoFillAvailableSlots.set(availableSlots);
        this.setAutoFillResponseLimit(availableSlots);
        const surveyQuestions = questions
          .filter((question) => question['pm_4d802b91'] === survey['id_universal'])
          .sort((first, second) => Number(first['fd_order']) - Number(second['fd_order']));
        const questionIds = new Set(surveyQuestions.map((question) => String(question['id_universal'])));
        this.autoFillQuestions.set(surveyQuestions);
        this.autoFillValues.set(
          values
            .filter((value) => questionIds.has(String(value['pm_0acc84ae'])))
            .sort((first, second) => Number(first['fd_order']) - Number(second['fd_order'])),
        );
      },
      error: () => this.failed(),
    });
  }
  private setAutoFillResponseLimit(limit: number): void {
    this.autoFillForm.get('responses')?.setValidators([
      Validators.required,
      Validators.min(1),
      Validators.max(limit),
    ]);
    this.autoFillForm.get('responses')?.updateValueAndValidity();
  }
  closeAutoFill(): void {
    this.showAutoFillConfigurationModal.set(false);
    this.showAutoFillModal.set(false);
    this.autoFillAvailableSlots.set(0);
    this.autoFillMemoryMaxMb.set(0);
    this.autoFillQuestions.set([]);
    this.autoFillValues.set([]);
    this.autoFillAllowedValues.set({});
    this.autoFillForm.enable();
    this.autoFillForm.reset({ responses: 1, bots: 1, memory_value: 512, memory_unit: 'MB' });
  }
  refreshAutoFillMemoryCapacity(): void {
    const bots = Math.min(10, Math.max(1, Number(this.autoFillForm.get('bots')?.value) || 1));
    this.api.autoFillCapacity(bots).subscribe({
      next: (capacity) => {
        this.autoFillMemoryMaxMb.set(capacity.max_memory_per_bot_mb);
        this.clampAutoFillMemory();
      },
      error: () => this.autoFillMemoryMaxMb.set(0),
    });
  }
  onAutoFillMemoryUnitChange(): void {
    this.clampAutoFillMemory();
  }
  clampAutoFillMemory(): void {
    const maximumMb = this.autoFillMemoryMaxMb();
    if (!maximumMb) return;
    if (this.autoFillForm.get('memory_unit')?.value === 'GB' && maximumMb < 1024) {
      this.autoFillForm.patchValue({ memory_unit: 'MB' });
    }
    const maximum = this.autoFillMemoryMaximum();
    const value = Math.max(1, Number(this.autoFillForm.get('memory_value')?.value) || 1);
    if (value > maximum) this.autoFillForm.patchValue({ memory_value: maximum });
    this.autoFillForm.get('memory_value')?.setValidators([
      Validators.required,
      Validators.min(1),
      Validators.max(maximum),
    ]);
    this.autoFillForm.get('memory_value')?.updateValueAndValidity();
  }
  autoFillMemoryMaximum(): number {
    const maximumMb = this.autoFillMemoryMaxMb();
    if (!maximumMb) return 1;
    return this.autoFillForm.get('memory_unit')?.value === 'GB'
      ? Math.max(1, Math.floor(maximumMb / 1024))
      : maximumMb;
  }
  autoFillMemoryUnit(): 'MB' | 'GB' {
    return this.autoFillForm.get('memory_unit')?.value === 'GB' ? 'GB' : 'MB';
  }
  autoFillValuesFor(questionId: unknown): Record<string, unknown>[] {
    return this.autoFillValues().filter((value) => value['pm_0acc84ae'] === questionId);
  }
  isAutoFillValueAllowed(questionId: unknown, valueId: unknown): boolean {
    return this.autoFillAllowedValues()[String(questionId)]?.includes(String(valueId)) ?? false;
  }
  toggleAutoFillValue(questionId: unknown, valueId: unknown, checked: boolean): void {
    const key = String(questionId);
    const option = String(valueId);
    this.autoFillAllowedValues.update((current) => {
      const next = { ...current };
      const values = new Set(next[key] ?? []);
      if (checked) values.add(option);
      else values.delete(option);
      if (values.size) next[key] = [...values];
      else delete next[key];
      return next;
    });
  }
  openAutoFillConfiguration(): void {
    if (!this.loading()) this.showAutoFillConfigurationModal.set(true);
  }
  closeAutoFillConfiguration(): void {
    this.showAutoFillConfigurationModal.set(false);
  }
  runAutoFill(): void {
    const survey = this.requireSingleSelection('autocompletar');
    if (!survey) return;
    if (!this.validateAutoFillResponses()) return;
    if (this.autoFillForm.invalid) {
      this.autoFillForm.markAllAsTouched();
      return;
    }
    const values = this.autoFillForm.getRawValue() as {
      responses: number; bots: number; memory_value: number; memory_unit: 'MB' | 'GB';
    };
    this.loading.set(true);
    this.autoFillForm.disable();
    this.api.autoFill(String(survey['id_universal']), {
      responses: Number(values.responses),
      bots: Number(values.bots),
      memory_value: Number(values.memory_value),
      memory_unit: values.memory_unit,
      allowed_values: this.autoFillAllowedValues(),
    }).subscribe({
      next: (result) => {
        this.loading.set(false);
        this.closeAutoFill();
        this.clearSelection();
        void Swal.fire({
          icon: result.failed ? 'warning' : 'success',
          title: result.failed ? 'Autocompletado parcial' : 'Encuesta autocompletada',
          html: `Completadas: ${result.completed} de ${result.requested}. Bots: ${result.bots}.<br>Memoria por bot: ${result.memory_mb_per_bot} MB.${result.failures.length ? `<br><br>${result.failures.join('<br>')}` : ''}`,
          confirmButtonText: 'Aceptar',
        });
        this.load();
      },
      error: (error: { status?: number; error?: { detail?: string } }) => {
        this.autoFillForm.enable();
        if (error.status === 422) {
          this.loading.set(false);
          this.openAutoFill();
          void Swal.fire({
            icon: 'warning',
            title: 'Cupos actualizados',
            text: error.error?.detail ?? 'La cantidad de cupos disponibles cambió.',
            confirmButtonText: 'Aceptar',
          });
          return;
        }
        this.failed();
      },
    });
  }
  validateAutoFillResponses(): boolean {
    const requested = Number(this.autoFillForm.get('responses')?.value) || 0;
    const available = this.autoFillAvailableSlots();
    if (requested <= available) return true;
    this.autoFillForm.get('responses')?.setErrors({ max: true });
    void Swal.fire({
      icon: 'warning',
      title: 'Cantidad no disponible',
      text: `Solicitaste ${requested} encuestas, pero solo quedan ${available} cupos disponibles.`,
      confirmButtonText: 'Aceptar',
    });
    return false;
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
        const selected = this.selectedRecord();
        const surveyId = (this.config().resource === 'surveys'
          ? selected?.['id_universal']
          : selected?.['pm_4d802b91']) as string;
        const questionId = this.config().resource === 'questions'
          ? String(selected?.['id_universal'])
          : undefined;
        this.loading.set(false);
        this.loadSurveyValues(surveyId, questionId);
      },
      error: () => this.failed(),
    });
  }
  createValue(): void {
    if (this.valueForm.invalid) { this.valueForm.markAllAsTouched(); return; }
    this.loading.set(true);
    this.api.create('values', this.valueForm.getRawValue()).subscribe({
      next: () => this.finishValueOperation('Valor creado.'),
      error: () => this.failed(),
    });
  }
  saveValue(): void {
    const editing = this.editingValue();
    if (!editing) {
      this.createValue();
      return;
    }
    if (this.valueForm.invalid) { this.valueForm.markAllAsTouched(); return; }
    this.loading.set(true);
    this.api.update('values', String(editing['id_universal']), this.valueForm.getRawValue()).subscribe({
      next: () => this.finishValueOperation('Valor actualizado.'),
      error: () => this.failed(),
    });
  }
  openValueEdit(): void {
    const selected = this.selectedValues();
    if (selected.length !== 1) {
      const message = selected.length
        ? 'Solo se puede editar un valor seleccionado a la vez.'
        : 'Selecciona un valor para editar.';
      void Swal.fire({ icon: 'info', title: 'Selección requerida', text: message, confirmButtonText: 'Aceptar' });
      return;
    }
    this.editingValue.set(selected[0]);
    this.valueForm.patchValue(selected[0]);
  }
  cancelValueEdit(): void {
    this.editingValue.set(null);
    this.selectedValues.set([]);
    this.resetValueForm();
  }
  toggleValueSelection(value: Record<string, unknown>): void {
    const id = value['id_universal'];
    const selected = this.selectedValues();
    this.selectedValues.set(
      selected.some((item) => item['id_universal'] === id)
        ? selected.filter((item) => item['id_universal'] !== id)
        : [...selected, value],
    );
  }
  isValueSelected(value: Record<string, unknown>): boolean {
    return this.selectedValues().some((item) => item['id_universal'] === value['id_universal']);
  }
  removeValues(): void {
    const selected = this.selectedValues();
    if (!selected.length) return;
    void Swal.fire({
      title: `¿Eliminar ${selected.length} valor${selected.length === 1 ? '' : 'es'}?`,
      text: 'Se eliminarán los valores seleccionados que no estén siendo utilizados.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.loading.set(true);
      forkJoin(selected.map((value) => {
        const id = String(value['id_universal']);
        return this.api.delete('values', id).pipe(
          map(() => ({ id, error: undefined as unknown })),
          catchError((error) => of({ id, error: error as unknown })),
        );
      })).subscribe({
        next: (outcomes) => {
          const failed = outcomes.filter((outcome) => outcome.error !== undefined);
          if (!failed.length) {
            this.finishValueOperation(`${selected.length} valor${selected.length === 1 ? '' : 'es'} eliminado${selected.length === 1 ? '' : 's'}.`);
            return;
          }
          this.loading.set(false);
          this.selectedValues.set([]);
          this.editingValue.set(null);
          this.refreshValues();
          this.showBatchDeleteResult(selected.length - failed.length, failed.map(({ error }) => error));
        },
      });
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
    const selected = this.selectedRecords();
    if (!selected.length) {
      this.message.set('Selecciona un registro para eliminar.');
      return;
    }
    void Swal.fire({
      title: `¿Eliminar ${selected.length} registro${selected.length === 1 ? '' : 's'}?`,
      text: `Esta acción eliminará los registros seleccionados de ${this.config().title}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }
      this.loading.set(true);
      forkJoin(
        selected.map((row) => {
          const id = String(row['id_universal']);
          return this.api.delete(this.config().resource, id).pipe(
            map(() => ({ id, error: undefined as unknown })),
            catchError((error) => of({ id, error: error as unknown })),
          );
        }),
      ).subscribe({
        next: (outcomes) => {
          const failed = outcomes.filter((outcome) => outcome.error !== undefined);
          if (!failed.length) {
            this.completed(`${selected.length} registro${selected.length === 1 ? '' : 's'} eliminado${selected.length === 1 ? '' : 's'}`);
            return;
          }
          this.loading.set(false);
          this.selectedRecord.set(null);
          this.selectedRecords.set([]);
          this.showBatchDeleteResult(selected.length - failed.length, failed.map(({ error }) => error));
          this.load();
        },
      });
    });
  }
  clear(): void {
    void Swal.fire({
      title: '¿Vaciar módulo?',
      text: `Se eliminarán los registros de ${this.config().title} que no estén siendo utilizados. Los registros relacionados se conservarán.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Vaciar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.loading.set(true);
      this.api.clear(this.config().resource).subscribe({
        next: ({ deleted, preserved }) => {
          this.selectedRecord.set(null);
          this.selectedRecords.set([]);
          this.message.set('');
          this.loading.set(false);
          void Swal.fire({
            icon: deleted ? 'success' : 'info',
            title: deleted ? 'Módulo vaciado' : 'No hay registros para eliminar',
            text: `Eliminados: ${deleted}. Conservados por estar en uso: ${preserved}.`,
            confirmButtonText: 'Aceptar',
          });
          this.load();
        },
        error: () => this.failed(),
      });
    });
  }
  toggleSelection(row: Record<string, unknown>): void {
    const id = row['id_universal'];
    const selected = this.selectedRecords();
    const isSelected = selected.some((item) => item['id_universal'] === id);
    const next = isSelected
      ? selected.filter((item) => item['id_universal'] !== id)
      : [...selected, row];
    this.selectedRecords.set(next);
    const singleRecord = next.length === 1 ? next[0] : null;
    this.selectedRecord.set(singleRecord);
    if (singleRecord) this.form.patchValue(singleRecord);
    else this.form.reset({ id_universal: '' });
  }
  isSelected(row: Record<string, unknown>): boolean {
    return this.selectedRecords().some(
      (item) => item['id_universal'] === row['id_universal'],
    );
  }
  private clearSelection(): void {
    this.selectedRecord.set(null);
    this.selectedRecords.set([]);
    this.form.get('id_universal')?.enable();
    this.form.reset({ id_universal: '' });
  }
  displayValue(row: Record<string, unknown>, field: CrudField): unknown {
    const value = row[field.name];
    if (field.type === 'boolean') return value ? 'Sí' : 'No';
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
  managingQuestionValues(): boolean {
    return this.config().resource === 'questions';
  }
  selectedQuestionDescription(): string {
    const selected = this.selectedRecord();
    return selected ? `${selected['fd_order']}. ${selected['fd_ask']}` : '';
  }
  relationOptionLabel(field: CrudField, option: Record<string, unknown>): string {
    const displayValue = String(option[field.relation?.displayField ?? ''] ?? '');
    const orderBy = field.relation?.orderBy;
    return orderBy ? `${option[orderBy]}. ${displayValue}` : displayValue;
  }
  ngOnDestroy(): void {
    this.destroyDataTable();
    this.destroyValuesDataTable();
    this.destroyQuestionsDataTable();
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
    this.selectedValues.set([]);
    this.editingValue.set(null);
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
  private initializeQuestionsDataTable(): void {
    if (!this.questionsTable || this.questionsDataTable) return;
    this.questionsDataTable = new DataTable(this.questionsTable.nativeElement, {
      language: { emptyTable: 'No hay preguntas', search: 'Buscar:', lengthMenu: 'Mostrar _MENU_ registros', info: 'Mostrando _START_ a _END_ de _TOTAL_', paginate: { next: 'Siguiente', previous: 'Anterior' } },
    });
  }
  private destroyQuestionsDataTable(): void {
    this.questionsDataTable?.destroy();
    this.questionsDataTable = undefined;
  }
  private refreshValues(): void {
    const selected = this.selectedRecord();
    const surveyId = (this.config().resource === 'surveys'
      ? selected?.['id_universal']
      : selected?.['pm_4d802b91']) as string | undefined;
    if (!surveyId) return;
    this.loadSurveyValues(
      surveyId,
      this.config().resource === 'questions' ? String(selected?.['id_universal']) : undefined,
    );
  }
  private resetValueForm(): void {
    const selected = this.selectedRecord();
    this.valueForm.reset({
      fd_option: '',
      fd_order: this.nextValueOrder(),
      pm_0acc84ae: this.config().resource === 'questions' ? selected?.['id_universal'] : '',
    });
  }
  private finishValueOperation(message: string): void {
    this.loading.set(false);
    this.selectedValues.set([]);
    this.editingValue.set(null);
    this.resetValueForm();
    this.refreshValues();
    void Swal.fire({
      icon: 'success',
      title: message,
      confirmButtonText: 'Aceptar',
    });
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
    this.selectedRecords.set([]);
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
  private handleDeleteError(error: unknown): void {
    const detail = (error as {
      error?: { detail?: { message?: unknown; modules?: unknown } };
    }).error?.detail;
    const modules = Array.isArray(detail?.modules)
      ? detail.modules.filter(
        (module): module is { module: string; records: number } =>
          typeof module === 'object' && module !== null
          && typeof (module as { module?: unknown }).module === 'string'
          && typeof (module as { records?: unknown }).records === 'number',
      )
      : [];

    if (!modules.length) {
      this.failed();
      return;
    }

    this.loading.set(false);
    this.message.set('');
    const usage = modules
      .map(({ module, records }) => `${module}: ${records} registro${records === 1 ? '' : 's'}`)
      .join('\n');
    void Swal.fire({
      icon: 'info',
      title: 'No se puede eliminar el registro',
      text: `${String(detail?.message ?? 'El registro está siendo utilizado.')}\n\nDebes quitar la asociación antes de eliminarlo.\n\nMódulos donde se utiliza:\n${usage}`,
      confirmButtonText: 'Aceptar',
    });
  }
  private requireSingleSelection(action: string): Record<string, unknown> | null {
    const selected = this.selectedRecords();
    if (selected.length === 1) return selected[0];
    const message = selected.length
      ? `Solo se puede ${action} un registro seleccionado a la vez.`
      : `Selecciona un registro para ${action}.`;
    this.message.set(message);
    void Swal.fire({ icon: 'info', title: 'Selección requerida', text: message, confirmButtonText: 'Aceptar' });
    return null;
  }
  private showBatchDeleteResult(deleted: number, errors: unknown[]): void {
    const relatedModules = errors.flatMap((error) => {
      const detail = (error as {
        error?: { detail?: { modules?: unknown } };
      }).error?.detail;
      return Array.isArray(detail?.modules)
        ? detail.modules.filter(
          (module): module is { module: string; records: number } =>
            typeof module === 'object' && module !== null
            && typeof (module as { module?: unknown }).module === 'string'
            && typeof (module as { records?: unknown }).records === 'number',
        )
        : [];
    });
    const usage = relatedModules.length
      ? `\n\nMódulos que bloquean la eliminación:\n${relatedModules.map(({ module, records }) => `${module}: ${records} registro${records === 1 ? '' : 's'}`).join('\n')}`
      : '';
    void Swal.fire({
      icon: deleted ? 'warning' : 'info',
      title: deleted ? 'Eliminación parcial' : 'No se pudieron eliminar los registros',
      text: `Eliminados: ${deleted}. No eliminados: ${errors.length}.${usage}\n\nQuita las asociaciones de los registros bloqueados antes de intentarlo nuevamente.`,
      confirmButtonText: 'Aceptar',
    });
  }
  private failed(): void {
    this.message.set('La operación no pudo completarse. Revisa los datos y permisos.');
    this.loading.set(false);
  }
}
