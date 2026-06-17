import { Component, Output, EventEmitter, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-cadastro-layout',
  templateUrl: './cadastro-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush })
export class CadastroLayoutComponent {
  readonly titulo = input<string>('');
  readonly subtitulo = input<string>('');
  readonly textSubmit = input<string>('Salvar');
  readonly formInvalid = input<boolean>(true);
  
  @Output() submitClicked = new EventEmitter<void>();
}
