import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { GqlContextType } from '@nestjs/graphql';

/**
 * Barcha xatolarni markazlashtirilgan tarzda log qiladi.
 * - GraphQL: xatoni log qilib, original holida qaytaradi —
 *   shunda app.module dagi formatError o'z ishini davom ettiradi
 *   (o'zbekcha xato xabarlari buzilmaydi).
 * - HTTP (controller): toza JSON javob qaytaradi.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof Error ? exception.message : String(exception);

    // 5xx — to'liq stack bilan, 4xx — qisqa
    if (status >= 500) {
      this.logger.error(
        message,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`${status} — ${message}`);
    }

    const type = host.getType<GqlContextType>();
    if (type === 'graphql') {
      // Apollo formatError o'zi formatlaydi
      return exception;
    }

    // REST javobi
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    if (response && typeof response.status === 'function') {
      response.status(status).json({
        statusCode: status,
        message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
