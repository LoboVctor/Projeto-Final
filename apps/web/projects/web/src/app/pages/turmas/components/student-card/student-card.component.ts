import { Component, Input } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { EstudanteResumo } from '../../../../core/services/turmas.service';
import { ShortNamePipe, DiagLabelPipe } from '../../../../shared/pipes/student.pipes';

@Component({
  selector: 'app-student-card',
  standalone: true,
  imports: [NgFor, NgIf, ShortNamePipe, DiagLabelPipe],
  template: `
    <div class="student-card">
      <div class="card-matricula">{{ estudante.matricula }}</div>

      <div class="card-avatar">
        <img
          *ngIf="estudante.foto; else defaultAvatar"
          [src]="estudante.foto"
          [alt]="estudante.nomeCompleto"
          class="avatar-img"
        />
        <ng-template #defaultAvatar>
          <div class="avatar-placeholder">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
          </div>
        </ng-template>
      </div>

      <div class="card-info">
        <span class="card-nome">{{ estudante.nomeCompleto | shortName }}</span>
        <div class="card-tags">
          <ng-container *ngFor="let d of estudante.diagnosticos; let i = index">
            <span *ngIf="i < 2" class="tag-diagnostico">
              {{ d.diagnostico.tipo | diagLabel }}
            </span>
          </ng-container>
          <span *ngIf="!estudante.diagnosticos.length" class="tag-sem-diagnostico">—</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .student-card {
      position: relative;
      background: #f3f5f8;
      border-radius: 8px;
      padding: 12px 10px 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: box-shadow 0.15s ease, transform 0.15s ease;
      border: 1.5px solid transparent;
    }
    .student-card:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      transform: translateY(-2px);
      border-color: #d0d7de;
    }

    .card-matricula {
      position: absolute;
      top: 8px;
      right: 10px;
      font-size: 11px;
      font-weight: 600;
      color: #8c95a0;
    }

    .card-avatar {
      width: 80px;
      height: 80px;
      border-radius: 6px;
      overflow: hidden;
      background: #dce1e8;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .avatar-img { width: 100%; height: 100%; object-fit: cover; }
    .avatar-placeholder {
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      color: #8c95a0;
    }
    .avatar-placeholder svg { width: 44px; height: 44px; }

    .card-info { width: 100%; text-align: center; }
    .card-nome {
      display: block;
      font-size: 13.5px;
      font-weight: 600;
      color: #1f2328;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-tags { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; }
    .tag-diagnostico {
      font-size: 10.5px;
      font-weight: 600;
      color: #3c5f94;
      background: #e8f0fb;
      border-radius: 4px;
      padding: 1px 6px;
    }
    .tag-sem-diagnostico { font-size: 11px; color: #aaa; }
  `],
})
export class StudentCardComponent {
  @Input({ required: true }) estudante!: EstudanteResumo;
}
