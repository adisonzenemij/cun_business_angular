import { Component, OnDestroy, inject, signal } from '@angular/core';
import {
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthSession } from '../../../services/core/auth-session';
import { FastApi } from '../../../services/backend/python/fast/fast-api';
import {
  FtA5acf579,
  FtD2e6ded6,
  FtD5fb87de,
  FtD76a0e67,
  FtE5520e1e,
  Anonymous,
  Question,
  Survey,
  Value,
} from '../../../services/backend/python/fast/fast-resources';

@Component({
  selector: 'app-survey-form',
  imports: [ReactiveFormsModule],
  templateUrl: './survey-form.html',
  styleUrl: './survey-form.css',
})
export class SurveyForm implements OnDestroy {
  private readonly surveysApi = inject(FtD5fb87de);
  private readonly questionsApi = inject(FtD2e6ded6);
  private readonly valuesApi = inject(FtD76a0e67);
  private readonly anonymousApi = inject(FtE5520e1e);
  private readonly answersApi = inject(FtA5acf579);
  private readonly api = inject(FastApi);
  private readonly authSession = inject(AuthSession);
  private readonly formBuilder = inject(UntypedFormBuilder);
  readonly surveys = signal<Survey[]>([]);
  readonly questions = signal<Question[]>([]);
  readonly values = signal<Value[]>([]);
  readonly selectedSurvey = signal<Survey | null>(null);
  readonly reservation = signal<Anonymous | null>(null);
  readonly loadingDetails = signal(false);
  readonly submitting = signal(false);
  readonly autoFillVisible = signal(false);
  readonly autoFillConfigurationVisible = signal(false);
  readonly autoFilling = signal(false);
  readonly autoFillMemoryMaxMb = signal(0);
  readonly autoFillAllowedValues = signal<Record<string, string[]>>({});
  readonly answerForm: UntypedFormGroup = this.formBuilder.group({});
  readonly autoFillForm: UntypedFormGroup = this.formBuilder.group({
    responses: [1, [Validators.required, Validators.min(1)]],
    bots: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
    memory_value: [512, [Validators.required, Validators.min(1)]],
    memory_unit: ['MB', Validators.required],
  });
  readonly message = signal('Cargando encuestas…');
  private reservationRenewal?: ReturnType<typeof setInterval>;
  private attemptedReservationRestore = false;
  constructor() {
    this.loadAvailableSurveys();
  }

  ngOnDestroy(): void {
    // Conserva la reserva de esta pestaña para poder reanudarla tras recargar.
    this.stopReservationRenewal();
  }

  selectSurvey(survey: Survey): void {
    if (this.selectedSurvey()?.id_universal === survey.id_universal) return;
    this.releaseReservation(true);
    this.autoFillVisible.set(false);
    this.autoFillConfigurationVisible.set(false);
    this.selectedSurvey.set(survey);
    this.questions.set([]);
    this.values.set([]);
    this.answerForm.reset();
    for (const controlName of Object.keys(this.answerForm.controls))
      this.answerForm.removeControl(controlName);
    this.loadingDetails.set(true);
    const fd_reservation_key = this.reservationKey(survey.id_universal);
    this.anonymousApi
      .reserve({
        fd_random: '',
        pm_4d802b91: survey.id_universal,
        fd_reservation_key,
      })
      .subscribe({
        next: (reservation) => {
          this.reservation.set(reservation);
          this.selectedSurvey.set({
            ...survey,
            fd_available_slots: Math.max(0, this.availableSlots(survey) - 1),
          });
          this.message.set('');
          this.startReservationRenewal();
          this.loadSurveyDetails(survey);
        },
        error: () => {
          this.selectedSurvey.set(null);
          this.loadingDetails.set(false);
          this.message.set('Esta encuesta ya no está disponible o alcanzó su límite.');
          this.loadAvailableSurveys();
        },
      });
  }

  canAutoFill(): boolean {
    return this.authSession.isAuthenticated();
  }

  availableSlots(survey: Survey): number {
    return Math.max(0, survey.fd_available_slots ?? survey.fd_count);
  }

  toggleAutoFill(): void {
    const survey = this.selectedSurvey();
    if (!survey || this.autoFilling()) return;
    this.autoFillForm.enable();
    this.autoFillForm.reset({ responses: 1, bots: 1, memory_value: 512, memory_unit: 'MB' });
    this.autoFillAllowedValues.set({});
    this.autoFillConfigurationVisible.set(false);
    this.autoFillForm.get('responses')?.setValidators([
      Validators.required,
      Validators.min(1),
      Validators.max(this.availableSlots(survey)),
    ]);
    this.autoFillForm.get('responses')?.updateValueAndValidity();
    this.autoFillVisible.update((visible) => !visible);
    if (this.autoFillVisible()) this.refreshAutoFillMemoryCapacity();
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

  isAutoFillValueAllowed(questionId: string, valueId: string): boolean {
    return this.autoFillAllowedValues()[questionId]?.includes(valueId) ?? false;
  }

  openAutoFillConfiguration(): void {
    if (!this.autoFilling()) this.autoFillConfigurationVisible.set(true);
  }

  closeAutoFillConfiguration(): void {
    this.autoFillConfigurationVisible.set(false);
  }

  toggleAutoFillValue(questionId: string, valueId: string, checked: boolean): void {
    this.autoFillAllowedValues.update((current) => {
      const next = { ...current };
      const values = new Set(next[questionId] ?? []);
      if (checked) values.add(valueId);
      else values.delete(valueId);
      if (values.size) next[questionId] = [...values];
      else delete next[questionId];
      return next;
    });
  }

  runAutoFill(): void {
    if (!this.canAutoFill()) return;
    const survey = this.selectedSurvey();
    if (!survey) return;
    if (!this.validateAutoFillResponses(survey)) return;
    if (this.autoFillForm.invalid) {
      this.autoFillForm.markAllAsTouched();
      return;
    }
    const values = this.autoFillForm.getRawValue() as {
      responses: number; bots: number; memory_value: number; memory_unit: 'MB' | 'GB';
    };
    this.autoFilling.set(true);
    this.autoFillForm.disable();
    this.api.autoFill(survey.id_universal, {
      responses: Number(values.responses),
      bots: Number(values.bots),
      memory_value: Number(values.memory_value),
      memory_unit: values.memory_unit,
      allowed_values: this.autoFillAllowedValues(),
    }).subscribe({
      next: (result) => {
        this.autoFilling.set(false);
        this.autoFillVisible.set(false);
        // Actualiza de inmediato el contador mostrado; la recarga posterior lo
        // confirma con el valor real del servidor.
        this.selectedSurvey.update((current) =>
          current?.id_universal === survey.id_universal
            ? {
                ...current,
                fd_available_slots: Math.max(0, this.availableSlots(current) - result.completed),
              }
            : current,
        );
        void Swal.fire({
          icon: result.failed ? 'warning' : 'success',
          title: result.failed ? 'Autocompletado parcial' : 'Encuesta autocompletada',
          html: `Completadas: ${result.completed} de ${result.requested}. Bots: ${result.bots}.<br>Memoria por bot: ${result.memory_mb_per_bot} MB.${result.failures.length ? `<br><br>${result.failures.join('<br>')}` : ''}`,
          confirmButtonText: 'Aceptar',
        });
        this.loadAvailableSurveys();
      },
      error: (error: { status?: number; error?: { detail?: string } }) => {
        this.autoFilling.set(false);
        this.autoFillForm.enable();
        this.loadAvailableSurveys();
        const detail = error.error?.detail;
        void Swal.fire({
          icon: error.status === 422 ? 'warning' : 'error',
          title: error.status === 422 ? 'Cupos actualizados' : 'No fue posible autocompletar la encuesta',
          text: detail ?? 'No fue posible autocompletar la encuesta.',
          confirmButtonText: 'Aceptar',
        });
      },
    });
  }

  validateAutoFillResponses(survey = this.selectedSurvey()): boolean {
    if (!survey) return false;
    const requested = Number(this.autoFillForm.get('responses')?.value) || 0;
    const available = this.availableSlots(survey);
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

  private loadSurveyDetails(survey: Survey): void {
    this.surveysApi.details(survey.id_universal).subscribe({
      next: ({ questions, values }) => {
        const surveyQuestions = questions
          .filter((question) => question.pm_4d802b91 === survey.id_universal)
          .sort((first, second) => first.fd_order - second.fd_order);
        for (const question of surveyQuestions) {
          this.answerForm.addControl(
            question.id_universal,
            this.formBuilder.control('', question.fd_required ? Validators.required : []),
          );
        }
        this.questions.set(surveyQuestions);
        this.values.set(values);
        this.loadingDetails.set(false);
      },
      error: () => {
        this.message.set('No fue posible cargar las preguntas de esta encuesta.');
        this.loadingDetails.set(false);
      },
    });
  }

  private releaseReservation(clearStoredKey = false): void {
    const reservation = this.reservation();
    this.stopReservationRenewal();
    if (!reservation?.fd_reservation_key) return;
    this.reservation.set(null);
    if (clearStoredKey && reservation.pm_4d802b91) {
      sessionStorage.removeItem(`survey-reservation-${reservation.pm_4d802b91}`);
    }
    this.anonymousApi.release(reservation.id_universal, reservation.fd_reservation_key).subscribe({
      error: () => undefined,
    });
  }

  private reservationKey(surveyId: string): string {
    const storageKey = `survey-reservation-${surveyId}`;
    const stored = sessionStorage.getItem(storageKey);
    if (stored) return stored;
    const key = crypto.randomUUID();
    sessionStorage.setItem(storageKey, key);
    return key;
  }

  private startReservationRenewal(): void {
    this.stopReservationRenewal();
    this.reservationRenewal = setInterval(() => {
      const reservation = this.reservation();
      if (!reservation?.fd_reservation_key) return;
      this.anonymousApi.renew(reservation.id_universal, reservation.fd_reservation_key).subscribe({
        next: (renewed) => this.reservation.set(renewed),
        error: () => this.stopReservationRenewal(),
      });
    }, 5 * 60 * 1000);
  }

  private stopReservationRenewal(): void {
    if (this.reservationRenewal) clearInterval(this.reservationRenewal);
    this.reservationRenewal = undefined;
  }

  private loadAvailableSurveys(): void {
    this.surveysApi.listAvailable().subscribe({
      next: (surveys) => {
        const selected = this.selectedSurvey();
        const refreshed = selected && surveys.find((survey) => survey.id_universal === selected.id_universal);
        this.surveys.set(refreshed || !selected ? surveys : [selected, ...surveys]);
        // Si aún hay cupos, usa el conteo recién calculado por el backend. Si
        // llegó a cero, conserva el valor local actualizado para mostrarlo.
        if (refreshed) this.selectedSurvey.set(refreshed);
        if (!selected) {
          this.message.set(surveys.length ? 'Selecciona una encuesta para comenzar.' : 'No hay encuestas disponibles.');
          this.restoreSavedReservation();
        }
      },
      error: () => this.message.set('La consulta pública de encuestas aún no está habilitada en el backend.'),
    });
  }

  private restoreSavedReservation(): void {
    if (this.attemptedReservationRestore || this.selectedSurvey()) return;
    this.attemptedReservationRestore = true;
    const storageKey = Array.from({ length: sessionStorage.length }, (_, index) => sessionStorage.key(index))
      .find((key): key is string => key?.startsWith('survey-reservation-') ?? false);
    if (!storageKey) return;
    const surveyId = storageKey.substring('survey-reservation-'.length);
    const reservationKey = sessionStorage.getItem(storageKey);
    if (!surveyId || !reservationKey) return;
    this.surveysApi.resume(surveyId, reservationKey).subscribe({
      next: ({ survey, reservation }) => {
        this.surveys.update((surveys) =>
          surveys.some((item) => item.id_universal === survey.id_universal) ? surveys : [survey, ...surveys],
        );
        this.selectedSurvey.set(survey);
        this.reservation.set(reservation);
        this.message.set('');
        this.loadingDetails.set(true);
        this.startReservationRenewal();
        this.loadSurveyDetails(survey);
      },
      error: () => sessionStorage.removeItem(storageKey),
    });
  }

  private closeSurvey(): void {
    this.answerForm.reset();
    for (const controlName of Object.keys(this.answerForm.controls)) {
      this.answerForm.removeControl(controlName);
    }
    this.questions.set([]);
    this.values.set([]);
    this.selectedSurvey.set(null);
  }

  valuesFor(question: Question): Value[] {
    return this.values().filter((value) => value.pm_0acc84ae === question.id_universal);
  }

  isScale(question: Question): boolean {
    return question.fd_format === 'Escala';
  }

  submit(): void {
    const reservation = this.reservation();
    if (!this.selectedSurvey() || !reservation || this.answerForm.invalid) {
      this.answerForm.markAllAsTouched();
      return;
    }
    const selectedValues = this.questions()
      .map((question) => this.answerForm.controls[question.id_universal]?.value as string)
      .filter(Boolean);
    this.submitting.set(true);
    forkJoin(
      selectedValues.map((valueId) => {
        const value = this.values().find((item) => item.id_universal === valueId);
        return this.answersApi.createPublic({
          fd_repply: value?.fd_option ?? '',
          pm_9a582ff6: valueId,
          pm_1a4a8cd7: reservation.id_universal,
        });
      }),
    )
      .subscribe({
        next: () => {
          this.stopReservationRenewal();
          this.reservation.set(null);
          sessionStorage.removeItem(
            `survey-reservation-${this.selectedSurvey()!.id_universal}`,
          );
          this.closeSurvey();
          this.message.set('Tus respuestas fueron enviadas correctamente.');
          this.submitting.set(false);
          this.loadAvailableSurveys();
        },
        error: () => {
          this.message.set('No fue posible enviar las respuestas. Inténtalo nuevamente.');
          this.submitting.set(false);
        },
      });
  }
}
