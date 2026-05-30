import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { AuthGuard } from '../auth/auth.guard';

@Resolver()
export class AiResolver {
  constructor(private readonly aiService: AiService) {}

  // Requires login — prevents abuse by anonymous users
  @UseGuards(AuthGuard)
  @Mutation(() => String)
  async aiAssist(
    @Args('action') action: string,
    @Args('context') context: string,
  ): Promise<string> {
    return this.aiService.assist(action, context);
  }
}
