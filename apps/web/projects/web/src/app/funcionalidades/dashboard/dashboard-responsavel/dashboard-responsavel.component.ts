import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { EstudantesService } from '../../../compartilhado/services/estudantes.service';

@Component({
  selector: 'app-dashboard-responsavel',
  standalone: true,
  imports: [],
  templateUrl: './dashboard-responsavel.component.html',
  styleUrl: './dashboard-responsavel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush 
})
export class DashboardResponsavelComponent {
  estudantesService = inject(EstudantesService);
}