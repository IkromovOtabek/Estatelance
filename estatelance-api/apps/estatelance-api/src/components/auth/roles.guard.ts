import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { UserType } from '../../libs/enums/common.enums';
import { ROLES_KEY } from './roles.decorator';

// This guard checks that the logged-in user has the required role.
// Use together with @Roles(UserType.ADMIN) decorator.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Get the required roles set by the @Roles() decorator
    const requiredRoles = this.reflector.getAllAndOverride<UserType[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow everyone
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const gqlContext = GqlExecutionContext.create(context);
    const { req } = gqlContext.getContext();

    const authHeader: string = req.headers['authorization'] ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) return false;

    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const user = this.jwtService.verify(token, { secret });
      req.user = user;
      return requiredRoles.includes(user.userType);
    } catch {
      return false;
    }
  }
}
