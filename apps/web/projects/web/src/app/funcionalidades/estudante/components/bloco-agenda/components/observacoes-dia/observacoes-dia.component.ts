import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-observacoes-dia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './observacoes-dia.component.html',
  styleUrls: ['./observacoes-dia.component.css']
})
export class ObservacoesDiaComponent implements OnInit, OnChanges {
  @Input() observacoes: string = '';
  @Output() salvarAnotacao = new EventEmitter<string>();

  private readonly cdr = inject(ChangeDetectorRef);

  textoEditado: string = '';
  modoEdicao: boolean = false;

  ngOnInit(): void {
    this.textoEditado = this.observacoes;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['observacoes']) {
      const novoValor = changes['observacoes'].currentValue ?? '';
      this.textoEditado = novoValor;
      this.modoEdicao = false; // fecha o modo edição caso o input mude de fora
      this.cdr.markForCheck();
    }
  }

  ativarEdicao(): void {
    this.textoEditado = this.observacoes;
    this.modoEdicao = true;
    this.cdr.markForCheck();
  }

  cancelarEdicao(): void {
    this.textoEditado = this.observacoes;
    this.modoEdicao = false;
    this.cdr.markForCheck();
  }

  salvar(): void {
    this.modoEdicao = false;
    this.salvarAnotacao.emit(this.textoEditado);
    this.cdr.markForCheck();
  }
}
