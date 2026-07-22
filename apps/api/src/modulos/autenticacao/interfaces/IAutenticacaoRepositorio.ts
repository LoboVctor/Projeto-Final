import { Usuario } from '@prisma-client';

export interface IAutenticacaoRepositorio {
  buscarUsuarioPorId(id: string): Promise<Usuario | null>;
  atualizarSenha(usuarioId: string, senhaHash: string): Promise<void>;
  concluirPrimeiroAcesso(usuarioId: string, senhaHash: string): Promise<void>;
}
