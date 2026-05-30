import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../schemas/User.model';
import { UserStatus } from '../../libs/enums/common.enums';

// ─── AuthGuard ────────────────────────────────────────────────────────────────
// Validates JWT only. Used for authenticated QUERIES (read-only).
// Spammed users can still read data.
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const { req } = GqlExecutionContext.create(context).getContext();
    const token = this.extractToken(req);
    if (!token) return false;

    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      req.user = this.jwtService.verify(token, { secret });
      return true;
    } catch {
      return false;
    }
  }

  protected extractToken(req: any): string | null {
    const auth: string = req.headers['authorization'] ?? '';
    return auth.startsWith('Bearer ') ? auth.slice(7) : null;
  }
}

// ─── ActiveUserGuard ──────────────────────────────────────────────────────────
// Validates JWT + checks DB for current spam status.
// Used for all MUTATIONS so spammed users can't perform actions.
// Throws ForbiddenException with format: "SPAM_RESTRICTED|<reason>"
// so the frontend can parse the reason and show it to the user.
@Injectable()
export class ActiveUserGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { req } = GqlExecutionContext.create(context).getContext();
    const auth: string = req.headers['authorization'] ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return false;

    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      req.user = this.jwtService.verify(token, { secret });
    } catch {
      return false;
    }

    // DB lookup — get the LIVE status (JWT may be stale if admin spammed after login)
    const user = await this.userModel
      .findById(req.user._id)
      .select('userStatus spamReason')
      .lean();

    if (!user) return false;

    if (user.userStatus === UserStatus.SPAM) {
      const reason = (user as any).spamReason ?? '';
      // Pipe-delimited so frontend can split: 'SPAM_RESTRICTED|sabab matni'
      throw new ForbiddenException(`SPAM_RESTRICTED|${reason}`);
    }

    return true;
  }
}

// ─── OptionalAuthGuard ────────────────────────────────────────────────────────
// Allows unauthenticated requests. req.user is null if not logged in.
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const { req } = GqlExecutionContext.create(context).getContext();
    const auth: string = req.headers['authorization'] ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

    if (token) {
      try {
        const secret = this.configService.get<string>('JWT_SECRET');
        req.user = this.jwtService.verify(token, { secret });
      } catch {
        req.user = null;
      }
    }
    return true;
  }
}
