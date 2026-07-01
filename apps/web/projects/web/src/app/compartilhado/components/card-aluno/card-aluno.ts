import { Component, input, output , ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-card-aluno',
  imports: [],
  templateUrl: './card-aluno.html',
  styleUrl: './card-aluno.css',
  changeDetection: ChangeDetectionStrategy.OnPush })
export class CardAlunoComponent {
  nome = input.required<string>();
  foto = input<string | null>();
  diagnostico = input.required<string>();

  matricula = input.required<number>();
  idade = input.required<number | undefined>();

  corTag = input<string>('bg-blue-100 text-blue-700');

  abrirPerfil = output<void>();
}
