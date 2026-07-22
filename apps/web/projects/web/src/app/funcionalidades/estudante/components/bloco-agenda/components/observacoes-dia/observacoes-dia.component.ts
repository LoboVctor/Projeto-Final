import {
  Component,
  OnInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  input,
  output,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-observacoes-dia',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './observacoes-dia.component.html',
  styleUrls: ['./observacoes-dia.component.css']
})
export class ObservacoesDiaComponent implements OnInit, OnChanges {
  readonly observacoes = input<string>('');
  readonly salvarAnotacao = output<string>();

  textoEditado = signal('');
  modoEdicao = signal(false);

  ngOnInit(): void {
    this.textoEditado.set(this.observacoes());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['observacoes']) {
      const novoValor = changes['observacoes'].currentValue ?? '';
      this.textoEditado.set(novoValor);
      this.modoEdicao.set(false); // fecha o modo edição caso o input mude de fora
    }
  }

  ativarEdicao(): void {
    this.textoEditado.set(this.observacoes());
    this.modoEdicao.set(true);
  }

  cancelarEdicao(): void {
    this.textoEditado.set(this.observacoes());
    this.modoEdicao.set(false);
  }

  salvar(): void {
    this.modoEdicao.set(false);
    this.salvarAnotacao.emit(this.textoEditado());
  }
}
