import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PostService } from './post.service';
import { Post } from '../../schemas/Post.model';
import { ActiveUserGuard, AuthGuard, OptionalAuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/auth-user.decorator';
import { AddCommentInput, CreatePostInput } from '../../libs/dto/post.dto';

@Resolver()
export class PostResolver {
  constructor(private readonly postService: PostService) {}

  @UseGuards(ActiveUserGuard)
  @Mutation(() => Post)
  async createPost(
    @AuthUser('_id') authorId: string,
    @Args('input') input: CreatePostInput,
  ): Promise<Post> {
    return this.postService.createPost(authorId, input);
  }

  @UseGuards(OptionalAuthGuard)
  @Query(() => [Post])
  async getPosts(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
  ): Promise<Post[]> {
    return this.postService.getPosts(page, limit);
  }

  @UseGuards(OptionalAuthGuard)
  @Query(() => Post)
  async getPostById(@Args('postId') postId: string): Promise<Post> {
    return this.postService.getPostById(postId);
  }

  @UseGuards(ActiveUserGuard)
  @Mutation(() => Post)
  async toggleLikePost(
    @AuthUser('_id') userId: string,
    @Args('postId') postId: string,
  ): Promise<Post> {
    return this.postService.toggleLikePost(userId, postId);
  }

  @UseGuards(ActiveUserGuard)
  @Mutation(() => Post)
  async addComment(
    @AuthUser('_id') userId: string,
    @Args('input') input: AddCommentInput,
  ): Promise<Post> {
    return this.postService.addComment(userId, input);
  }
}
