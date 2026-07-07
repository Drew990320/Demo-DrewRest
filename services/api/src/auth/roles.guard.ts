import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) {
      return true;
    }
    const req = context.switchToHttp().getRequest<{ user?: { rol?: { nombre: string } } }>();
    const nombre = req.user?.rol?.nombre;
    if (!nombre) {
      throw new ForbiddenException('No tienes permiso para esta acción');
    }
    const allowed =
      roles.includes(nombre) ||
      (nombre === 'superadmin' && roles.includes('admin'));
    if (!allowed) {
      throw new ForbiddenException('No tienes permiso para esta acción');
    }
    return true;
  }
}
