import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';

@Component({
  selector: 'app-cadastro-layout',
  templateUrl: './cadastro-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CadastroLayoutComponent {

  readonly nomeEntidade = input<string>('');
  readonly modoEdicao = input<boolean>(false);
  readonly titulo = input<string>('');
  readonly subtitulo = input<string>('');
  readonly textSubmit = input<string>('Salvar');
  readonly formInvalid = input<boolean>(true);

  readonly tituloResolvido = computed(() => {
    const entidade = this.nomeEntidade();
    if (entidade) {
      return this.modoEdicao() ? `Editar ${entidade}` : `Novo ${entidade}`;
    }
    return this.titulo();
  });

  readonly submitClicked = output<void>();
}
