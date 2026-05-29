import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MessageService } from './message.service';
import { Message } from '../../schemas/Message.model';
import { ActiveUserGuard, AuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/auth-user.decorator';
import { SendMessageInput } from '../../libs/dto/message.dto';

@Resolver()
export class MessageResolver {
  constructor(private readonly messageService: MessageService) {}

  @UseGuards(ActiveUserGuard)
  @Mutation(() => Message)
  async sendMessage(
    @AuthUser('_id') senderId: string,
    @Args('input') input: SendMessageInput,
  ): Promise<Message> {
    return this.messageService.sendMessage(senderId, input);
  }

  @UseGuards(AuthGuard)
  @Query(() => [Message])
  async getConversation(
    @AuthUser('_id') userId: string,
    @Args('otherUserId') otherUserId: string,
  ): Promise<Message[]> {
    return this.messageService.getConversation(userId, otherUserId);
  }

  @UseGuards(AuthGuard)
  @Query(() => [Message])
  async getMyConversations(@AuthUser('_id') userId: string): Promise<Message[]> {
    return this.messageService.getMyConversations(userId);
  }

  @UseGuards(ActiveUserGuard)
  @Mutation(() => Boolean)
  async markMessagesAsRead(
    @AuthUser('_id') userId: string,
    @Args('otherUserId') otherUserId: string,
  ): Promise<boolean> {
    return this.messageService.markMessagesAsRead(userId, otherUserId);
  }

  @UseGuards(AuthGuard)
  @Query(() => Int)
  async getUnreadMessageCount(@AuthUser('_id') userId: string): Promise<number> {
    return this.messageService.getUnreadMessageCount(userId);
  }
}
