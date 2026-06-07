import { Role } from '../../../../../infra/generated/prisma/index.js';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  escolaId: string;
  educadorId?: string | null;
}
