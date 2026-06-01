import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { UserService } from '../user/user.service';

@Controller('auth')
export class GoogleController {
  constructor(private readonly userService: UserService) {}

  // Step 1: redirect to Google login page
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // Passport redirects to Google automatically
  }

  // Step 2: Google redirects back here with user profile
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const googleUser = req.user as any;

    try {
      const user = await this.userService.findOrCreateGoogleUser(googleUser);
      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/google/callback?token=${user.accessToken}&needsOnboarding=${user.needsOnboarding ?? false}`);
    } catch (err) {
      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/google/callback?error=auth_failed`);
    }
  }
}
