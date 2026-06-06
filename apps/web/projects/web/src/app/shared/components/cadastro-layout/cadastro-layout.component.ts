import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-cadastro-layout',
  standalone: true,
  templateUrl: './cadastro-layout.component.html',
})
export class CadastroLayoutComponent {
  @Input() titulo: string = '';
  @Input() subtitulo: string = '';
  @Input() textSubmit: string = 'Salvar';
  @Input() formInvalid: boolean = true;
  
  @Output() submitClicked = new EventEmitter<void>();
}
