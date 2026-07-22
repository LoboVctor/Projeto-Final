import { Role } from '@prisma-client';

export interface IJwtPayload {
  sub: string;
  email: string;
  role: Role;
  escolaId: string;
  educadorId?: string | null;
}
