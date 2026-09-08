import { Component, OnDestroy, inject, signal } from '@angular/core';
import {
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { forkJoin } from 'rxjs';
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
  private readonly formBuilder = inject(UntypedFormBuilder);
  readonly surveys = signal<Survey[]>([]);
  readonly questions = signal<Question[]>([]);
  readonly values = signal<Value[]>([]);
  readonly selectedSurvey = signal<Survey | null>(null);
  readonly reservation = signal<Anonymous | null>(null);
  readonly loadingDetails = signal(false);
  readonly submitting = signal(false);
  readonly answerForm: UntypedFormGroup = this.formBuilder.group({});
  readonly message = signal('Cargando encuestas…');
  private reservationRenewal?: ReturnType<typeof setInterval>;
  constructor() {
    this.surveysApi.listAvailable().subscribe({
      next: (surveys) => {
        this.surveys.set(surveys);
        this.message.set(
          surveys.length
            ? 'Selecciona una encuesta para comenzar.'
            : 'No hay encuestas disponibles.',
        );
      },
      error: () =>
        this.message.set('La consulta pública de encuestas aún no está habilitada en el backend.'),
    });
  }

  ngOnDestroy(): void {
    this.releaseReservation();
  }

  selectSurvey(survey: Survey): void {
    if (this.selectedSurvey()?.id_universal === survey.id_universal) return;
    this.releaseReservation();
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

  private releaseReservation(): void {
    const reservation = this.reservation();
    this.stopReservationRenewal();
    if (!reservation?.fd_reservation_key) return;
    this.reservation.set(null);
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
      next: (surveys) => this.surveys.set(surveys),
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
