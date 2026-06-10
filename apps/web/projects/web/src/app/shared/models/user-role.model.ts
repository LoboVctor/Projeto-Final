/**
 * Roles disponíveis na aplicação — devem refletir exatamente
 * os valores do enum Role do schema Prisma no backend.
 *
 * CR-14: corrigido EDUCADOR → PROFESSOR e RESPONSAVEL removido
 * (roles válidos no backend são COORDENADOR e PROFESSOR).
 */
export type UserRole =
  | 'COORDENADOR'
  | 'PROFESSOR';
