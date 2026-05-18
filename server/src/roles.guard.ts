import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Se nenhuma anotação de Role for encontrada, permite o acesso por padrão (opt-in)
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    // O payload do JWT decodificado pelo JwtAuthGuard deve fornecer o perfil 'role'
    if (!user || !user.role) {
      throw new ForbiddenException('Acesso negado: Perfil de acesso não identificado ou inválido.');
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException('Acesso negado: Seu cargo não possui permissões suficientes para realizar esta ação.');
    }

    return true;
  }
}
