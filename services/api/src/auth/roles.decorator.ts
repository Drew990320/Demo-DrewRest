import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/** Restringe el endpoint a uno o más nombres de rol (`rol.nombre` en BD). */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
