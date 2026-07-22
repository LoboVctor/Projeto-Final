export type VarianteConfirmacao = 'danger' | 'warning' | 'default';

export interface ConfirmacaoConfig {
  titulo: string;
  mensagem: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  variante?: VarianteConfirmacao;
}

export interface ConfirmacaoEstado {
  titulo: string;
  mensagem: string;
  textoConfirmar: string;
  textoCancelar: string;
  variante: VarianteConfirmacao;
}
