import { Role } from '@prisma-client';
import { Request } from 'express';

/** Forma do usuário autenticado injetada em `req.user` pelo JwtStrategy. */
export interface UsuarioAutenticado {
  id: string;
  email: string;
  role: Role;
  educadorId: string | null;
  responsavelId: string | null;
  escolaId?: string;
}

export interface RequestComUsuario extends Request {
  user: UsuarioAutenticado;
}
