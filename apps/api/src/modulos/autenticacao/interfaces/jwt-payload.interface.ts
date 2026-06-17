import { Role } from '@prisma-client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  escolaId: string;
  educadorId?: string | null;
}
