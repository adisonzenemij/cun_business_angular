import { Component, OnDestroy, effect, inject, signal } from '@angular/core';
import Highcharts from 'highcharts/esm/highcharts';
import 'highcharts/esm/modules/exporting';
import 'highcharts/esm/modules/export-data';
import { forkJoin } from 'rxjs';
import {
  Answer,
  FtA5acf579,
  FtD2e6ded6,
  FtD5fb87de,
  FtD76a0e67,
  Question,
  Survey,
  Value,
} from '../../../services/backend/python/fast/fast-resources';
import { Theme } from '../../../services/core/theme';

interface QuestionReport {
  question: Question;
  values: Value[];
  counts: number[];
  total: number;
}

@Component({
  imports: [],
  selector: 'app-wg-report',
  styleUrl: './wg-report.css',
  templateUrl: './wg-report.html',
})
export class WgReport implements OnDestroy {
  private readonly surveysApi = inject(FtD5fb87de);
  private readonly questionsApi = inject(FtD2e6ded6);
  private readonly valuesApi = inject(FtD76a0e67);
  private readonly answersApi = inject(FtA5acf579);
  private readonly theme = inject(Theme);
  private charts: Highcharts.Chart[] = [];
  private chartRenderTimer?: ReturnType<typeof setTimeout>;
  private chartRenderVersion = 0;

  readonly loading = signal(true);
  readonly error = signal('');
  readonly surveys = signal<Survey[]>([]);
  readonly questions = signal<Question[]>([]);
  readonly values = signal<Value[]>([]);
  readonly answers = signal<Answer[]>([]);
  readonly selectedSurvey = signal<Survey | null>(null);

  constructor() {
    effect(() => {
      this.theme.mode();
      if (this.selectedSurvey()) this.scheduleCharts();
    });
    this.load();
  }

  get reports(): QuestionReport[] {
    const survey = this.selectedSurvey();
    if (!survey) return [];

    return this.questions()
      .filter((question) => question.pm_4d802b91 === survey.id_universal)
      .sort((a, b) => a.fd_order - b.fd_order)
      .map((question) => {
        const values = this.values()
          .filter((value) => value.pm_0acc84ae === question.id_universal)
          .sort((a, b) => (a.fd_order ?? 0) - (b.fd_order ?? 0));
        const counts = values.map(
          (value) =>
            this.answers().filter((answer) => answer.pm_9a582ff6 === value.id_universal).length,
        );
        return { question, values, counts, total: counts.reduce((total, count) => total + count, 0) };
      });
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({
      surveys: this.surveysApi.list(),
      questions: this.questionsApi.list(),
      values: this.valuesApi.list(),
      answers: this.answersApi.list(),
    }).subscribe({
      next: ({ surveys, questions, values, answers }) => {
        this.surveys.set(surveys.sort((a, b) => a.fd_name.localeCompare(b.fd_name)));
        this.questions.set(questions);
        this.values.set(values);
        this.answers.set(answers);
        const selected = this.selectedSurvey();
        this.selectedSurvey.set(
          selected ? surveys.find((survey) => survey.id_universal === selected.id_universal) ?? null : null,
        );
        this.loading.set(false);
        this.scheduleCharts();
      },
      error: () => {
        this.error.set('No fue posible cargar los datos para los reportes.');
        this.loading.set(false);
      },
    });
  }

  selectSurvey(survey: Survey): void {
    if (this.selectedSurvey()?.id_universal === survey.id_universal) {
      this.selectedSurvey.set(null);
      this.cancelChartRender();
      this.destroyCharts();
      return;
    }
    this.selectedSurvey.set(survey);
    this.scheduleCharts();
  }

  trackQuestion(_: number, report: QuestionReport): string {
    return report.question.id_universal;
  }

  ngOnDestroy(): void {
    this.cancelChartRender();
    this.destroyCharts();
  }

  private scheduleCharts(attempt = 0): void {
    const version = ++this.chartRenderVersion;
    if (this.chartRenderTimer) clearTimeout(this.chartRenderTimer);
    this.chartRenderTimer = setTimeout(() => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (version !== this.chartRenderVersion) return;
        const reports = this.reports;
        const ready = reports.every((report) => {
          const bar = document.getElementById(`report-bar-${report.question.id_universal}`);
          const pie = document.getElementById(`report-pie-${report.question.id_universal}`);
          return !!bar && !!pie && bar.clientWidth > 0 && pie.clientWidth > 0;
        });
        if (!ready && attempt < 8) {
          this.scheduleCharts(attempt + 1);
          return;
        }
        this.renderCharts(reports);
      }));
    }, attempt ? 75 : 0);
  }

  private chartExporting(dark: boolean): Highcharts.ExportingOptions {
    const foreground = dark ? '#f8f9fa' : '#212529';
    return {
      enabled: true,
      buttons: {
        contextButton: {
          menuItems: ['viewFullscreen', 'printChart', 'separator', 'downloadPNG', 'downloadJPEG', 'downloadSVG', 'downloadPDF', 'separator', 'downloadCSV', 'downloadXLS', 'viewData'],
          theme: { fill: 'transparent', stroke: dark ? '#6c757d' : '#adb5bd', style: { color: foreground } },
        },
      },
    };
  }

  private chartNavigation(dark: boolean): Highcharts.NavigationOptions {
    const foreground = dark ? '#f8f9fa' : '#212529';
    return {
      menuStyle: { background: dark ? '#212529' : '#ffffff', border: `1px solid ${dark ? '#495057' : '#ced4da'}`, color: foreground },
      menuItemStyle: { color: foreground, fontWeight: '400' },
      menuItemHoverStyle: { background: dark ? '#343a40' : '#e9ecef', color: foreground },
    };
  }

  private renderCharts(reports: QuestionReport[]): void {
    this.destroyCharts();
    const isDarkTheme = document.documentElement.dataset['bsTheme'] === 'dark';
    const textColor = isDarkTheme ? '#f8f9fa' : '#212529';
    const normalText: Highcharts.CSSObject = { color: textColor, fontWeight: '400' };
    for (const report of reports) {
      const categories = report.values.map((value) => value.fd_option);
      const colors = ['#0d6efd', '#20c997', '#ffc107', '#dc3545', '#6f42c1', '#0dcaf0', '#fd7e14'];
      const common: Highcharts.Options = {
        chart: { backgroundColor: 'transparent' },
        colors,
        credits: { enabled: false },
        exporting: this.chartExporting(isDarkTheme),
        navigation: this.chartNavigation(isDarkTheme),
        title: { text: undefined },
        legend: { itemStyle: normalText, itemHoverStyle: normalText },
        accessibility: { enabled: false },
      };

      this.charts.push(
        Highcharts.chart(`report-bar-${report.question.id_universal}`, {
          ...common,
          chart: { ...common.chart, type: 'column' },
          xAxis: { categories, crosshair: true, labels: { style: normalText } },
          yAxis: {
            allowDecimals: false,
            min: 0,
            labels: { style: normalText },
            title: { text: 'Respuestas', style: normalText },
          },
          tooltip: { pointFormat: '<b>{point.y}</b> respuestas' },
          series: [{ type: 'column', name: 'Respuestas', data: report.counts }],
        }),
      );
      this.charts.push(
        Highcharts.chart(`report-pie-${report.question.id_universal}`, {
          ...common,
          chart: { ...common.chart, type: 'pie' },
          tooltip: { pointFormat: '<b>{point.y}</b> respuestas ({point.percentage:.1f}%)' },
          plotOptions: {
            pie: {
              allowPointSelect: true,
              cursor: 'pointer',
              dataLabels: { enabled: true, format: '{point.name}: {point.y}', style: { ...normalText, textOutline: 'none' } },
            },
          },
          series: [
            {
              type: 'pie',
              name: 'Respuestas',
              data: report.values.map((value, index) => ({ name: value.fd_option, y: report.counts[index] })),
            },
          ],
        }),
      );
    }
    setTimeout(() => this.charts.forEach((chart) => chart.reflow()));
  }

  private destroyCharts(): void {
    this.charts.forEach((chart) => chart.destroy());
    this.charts = [];
  }

  private cancelChartRender(): void {
    this.chartRenderVersion++;
    if (this.chartRenderTimer) clearTimeout(this.chartRenderTimer);
    this.chartRenderTimer = undefined;
  }
}
