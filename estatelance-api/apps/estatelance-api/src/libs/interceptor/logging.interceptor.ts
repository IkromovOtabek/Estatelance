import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

// This interceptor logs every GraphQL request with its execution time
// It helps us spot slow queries and debug issues in production
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('API');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();

    if (context.getType<string>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      const operationName = gqlContext.getInfo()?.fieldName ?? 'Unknown';

      return next.handle().pipe(
        tap(() => {
          const duration = Date.now() - startTime;
          this.logger.log(`[${operationName}] completed in ${duration}ms`);
        }),
      );
    }

    return next.handle();
  }
}
