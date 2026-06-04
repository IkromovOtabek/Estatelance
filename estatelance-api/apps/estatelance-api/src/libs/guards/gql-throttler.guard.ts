import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * ThrottlerGuard'ning GraphQL'ni qo'llab-quvvatlaydigan varianti.
 * - GraphQL so'rovlarda req/res ni GraphQL context'idan oladi.
 * - REST (controller) so'rovlarda standart HTTP context'dan oladi.
 * - WebSocket / RPC kabi kontekstlarda throttling'ni o'tkazib yuboradi
 *   (chat gateway buzilmasligi uchun).
 */
@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const type = context.getType<GqlContextType>();
    if (type !== 'http' && type !== 'graphql') {
      return true;
    }
    return super.canActivate(context);
  }

  getRequestResponse(context: ExecutionContext) {
    if (context.getType<GqlContextType>() === 'graphql') {
      const ctx = GqlExecutionContext.create(context).getContext();
      return { req: ctx.req, res: ctx.res };
    }
    return super.getRequestResponse(context);
  }
}
