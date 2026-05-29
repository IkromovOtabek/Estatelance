import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

// Use this decorator to inject the authenticated user into a resolver method parameter.
// Example:
//   @Query(() => User)
//   async getMyProfile(@AuthUser() user: any): Promise<User> { ... }
//
// If a specific field is needed:
//   async doSomething(@AuthUser('_id') userId: string): Promise<...> { ... }
export const AuthUser = createParamDecorator(
  (fieldName: string | undefined, context: ExecutionContext) => {
    const gqlContext = GqlExecutionContext.create(context);
    const user = gqlContext.getContext().req.user;

    return fieldName ? user?.[fieldName] : user;
  },
);
