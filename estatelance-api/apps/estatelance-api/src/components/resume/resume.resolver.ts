import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ResumeService } from './resume.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/auth-user.decorator';
import { GenerateResumeInput, Resume } from '../../libs/dto/resume.dto';

@Resolver()
export class ResumeResolver {
  constructor(private readonly resumeService: ResumeService) {}

  // AI yordamida frilanser profilidan professional resume yaratish.
  @UseGuards(AuthGuard)
  @Mutation(() => Resume)
  async generateResume(
    @AuthUser('_id') userId: string,
    @Args('input') input: GenerateResumeInput,
  ): Promise<Resume> {
    return this.resumeService.generateResume(userId, input);
  }
}
