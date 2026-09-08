import { Component, inject, signal } from '@angular/core';
import { FtD5fb87de, Survey } from '../../../services/backend/python/fast/fast-resources';

@Component({
  selector: 'app-survey-form',
  imports: [],
  templateUrl: './survey-form.html',
  styleUrl: './survey-form.css',
})
export class SurveyForm {
  private readonly surveysApi = inject(FtD5fb87de);
  readonly surveys = signal<Survey[]>([]);
  readonly message = signal('Cargando encuestas…');
  constructor() {
    this.surveysApi.list().subscribe({
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
}
