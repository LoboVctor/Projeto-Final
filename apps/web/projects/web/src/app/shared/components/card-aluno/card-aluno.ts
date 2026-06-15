import { Component, input, output } from'@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card-aluno',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-aluno.html'
})
export class CardAlunoComponent {
  nome = input.required<string>();
  foto = input<string | null>();
  diagnostico = input.required<string>();

  matricula = input.required<number>();
  idade = input.required<number | undefined>();
  
  corTag = input<string>('bg-blue-100 text-blue-700'); 

  abrirPerfil = output<void>(); 

}