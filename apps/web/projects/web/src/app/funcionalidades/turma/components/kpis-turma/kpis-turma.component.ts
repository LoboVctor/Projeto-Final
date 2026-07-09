import { Component, input, effect, ElementRef, ViewChild, OnDestroy, inject, signal } from '@angular/core';
import { DecimalPipe, NgClass } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { TurmasService } from '../../../../nucleo/services/turmas.service';

Chart.register(...registerables);

@Component({
  selector: 'app-kpis-turma',
  standalone: true,
  imports: [DecimalPipe, NgClass],
  templateUrl: './kpis-turma.component.html',
  styleUrls: ['./kpis-turma.component.css']
})
export class KpisTurmaComponent implements OnDestroy {
  readonly turmaId = input.required<string>();
  
  private readonly turmasService = inject(TurmasService);
  
  dashboardData = signal<any>(null);
  periodo = signal<string>('semana');

  @ViewChild('mediaGaugeCanvas') mediaGaugeCanvas!: ElementRef<HTMLCanvasElement>;
  private mediaChart: Chart | null = null;

  categoriasList = [
    { key: 'Alimentacao', title: 'Alimentação', color: 'text-elo-roxo-principal', bgIcon: 'bg-purple-50', svgPath: 'M12 2C8.43 2 5.23 3.54 3.01 6L12 22l8.99-16C18.78 3.55 15.57 2 12 2zM7 7c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm5 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z' },
    { key: 'Banheiro', title: 'Banheiro', color: 'text-elo-roxo-principal', bgIcon: 'bg-purple-50', svgPath: 'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm1.5 13H14v-1.5h-2V15H9v-2.5h3v-1.5h2.5V15z' },
    { key: 'Autonomia', title: 'Autonomia', color: 'text-elo-roxo-principal', bgIcon: 'bg-purple-50', svgPath: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
    { key: 'Comportamento', title: 'Comportamento', color: 'text-elo-roxo-principal', bgIcon: 'bg-purple-50', svgPath: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM8.5 8c.83 0 1.5.67 1.5 1.5S9.33 11 8.5 11 7 10.33 7 9.5 7.67 8 8.5 8zM12 18c-2.28 0-4.22-1.66-5-4h10c-.78 2.34-2.72 4-5 4zm3.5-7c-.83 0-1.5-.67-1.5-1.5S14.67 8 15.5 8s1.5.67 1.5 1.5S16.33 11 15.5 11z' },
    { key: 'Interacao', title: 'Interação Social', color: 'text-elo-roxo-principal', bgIcon: 'bg-purple-50', svgPath: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
    { key: 'Foco', title: 'Foco nas Atividades', color: 'text-elo-roxo-principal', bgIcon: 'bg-purple-50', svgPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm4-8c0 2.21-1.79 4-4 4s-4-1.79-4-4 1.79-4 4-4 4 1.79 4 4zm-4-2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z' }
  ];

  constructor() {
    effect(() => {
      const id = this.turmaId();
      const per = this.periodo();
      if (id) this.carregarDashboard(id, per);
    });
  }

  onPeriodoChange(event: Event) {
    const novoPeriodo = (event.target as HTMLSelectElement).value;
    this.periodo.set(novoPeriodo);
  }

  private carregarDashboard(id: string, periodo: string) {
    this.dashboardData.set(null); 
    this.turmasService.obterKpisTurma(id, periodo).subscribe(data => {
      this.dashboardData.set(data);
      setTimeout(() => this.renderizarGauge(data.mediaGeral.valor), 50);
    });
  }

  ngOnDestroy(): void {
    if (this.mediaChart) this.mediaChart.destroy();
  }

  private renderizarGauge(valor: number): void {
    if (this.mediaChart) this.mediaChart.destroy();
    if (!this.mediaGaugeCanvas) return;
    
    const ctx = this.mediaGaugeCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    this.mediaChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [valor, 5 - valor],
          backgroundColor: ['#f97316', '#ffedd5'],
          borderWidth: 0,
          circumference: 180,
          rotation: 270
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '80%',
        plugins: { tooltip: { enabled: false }, legend: { display: false } }
      }
    });
  }
}