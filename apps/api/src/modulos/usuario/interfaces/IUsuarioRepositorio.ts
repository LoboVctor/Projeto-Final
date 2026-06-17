import { Usuario, Role } from '@prisma-client';

export interface CriarUsuarioDados {
  email: string;
  senhaHash: string;
  role: Role;
  educadorId: string | null;
  responsavelId: string | null;
}

export interface IUsuarioRepositorio {
  buscarPorEmail(email: string): Promise<Usuario | null>;
  criar(dados: CriarUsuarioDados): Promise<Usuario>;
}
