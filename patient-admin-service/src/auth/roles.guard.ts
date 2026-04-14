import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const userRoles = user?.['https://ezclinic.com/roles'] || [];

    const hasRole = () => requiredRoles.some((role) => userRoles.includes(role));
    
    if (user && userRoles && hasRole()) {
       return true;
    }
    
    console.error(`[RolesGuard] Forbidden! Required roles: ${requiredRoles}`);
    console.error(`[RolesGuard] JWT Payload received:`, user);
    
    throw new ForbiddenException('Insufficient permissions');
  }
}
