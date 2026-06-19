import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { EstudantesService } from '../../../compartilhado/services/estudantes.service';

@Component({
  selector: 'app-dashboard-responsavel',
  standalone: true,
  imports: [],
  templateUrl: './dashboard-responsavel.html',
  styleUrl: './dashboard-responsavel.css',
  changeDetection: ChangeDetectionStrategy.OnPush 
})
export class DashboardResponsavel {
  estudantesService = inject(EstudantesService);
}