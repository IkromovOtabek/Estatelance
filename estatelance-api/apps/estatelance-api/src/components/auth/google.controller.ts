import { Controller, Get, Post, Body, Query, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import * as passport from 'passport';
import { UserService } from '../user/user.service';
import { TelegramBotService } from '../telegram-bot/telegram-bot.service';

@Controller('auth')
export class GoogleController {
  constructor(
    private readonly userService: UserService,
    private readonly botService:  TelegramBotService,
  ) {}

  // ─── Step 1: Google ga yo'naltirish ────────────────────────────────────────
  @Get('google')
  googleLogin(
    @Query('mob') mob: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // mob parametri bo'lsa — mobile, bo'lmasa — web
    const state = mob ? `mob_${mob}` : 'web';

    (passport.authenticate('google', {
      scope: ['email', 'profile'],
      state,
      session: false,
    }) as any)(req, res);
  }

  // ─── Step 2: Google callback ────────────────────────────────────────────────
  @Get('google/callback')
  googleCallback(@Req() req: Request, @Res() res: Response) {
    (passport.authenticate('google', {
      session: false,
      failureRedirect: `${process.env.FRONTEND_URL ?? 'https://bufu.uz'}/account?error=google_failed`,
    }, async (err: any, googleUser: any) => {
      if (err || !googleUser) {
        return res.redirect(`${process.env.FRONTEND_URL ?? 'https://bufu.uz'}/account?error=google_failed`);
      }

      // state parametridan mobile tokenni olamiz
      const state       = (req.query.state as string) ?? '';
      const isMobile    = state.startsWith('mob_');
      const mobileToken = isMobile ? state.replace('mob_', '') : '';

      try {
        if (isMobile && mobileToken) {
          // Mobile: tokenni tasdiqlaymiz, app polling orqali oladi
          this.botService.confirmGoogleToken(mobileToken, googleUser);

          // expo-web-browser avtomatik yopilishi uchun bufu:// ga redirect
          return res.redirect('bufu://google-auth-done');
        } else {
          // Web: JWT bilan frontend ga yo'naltirish
          const user        = await this.userService.findOrCreateGoogleUser(googleUser);
          const frontendUrl = process.env.FRONTEND_URL ?? 'https://bufu.uz';
          return res.redirect(
            `${frontendUrl}/auth/google/callback?token=${user.accessToken}&needsOnboarding=${user.needsOnboarding ?? false}`,
          );
        }
      } catch {
        const frontendUrl = process.env.FRONTEND_URL ?? 'https://bufu.uz';
        return res.redirect(`${frontendUrl}/account?error=google_failed`);
      }
    }) as any)(req, res);
  }

  // ─── Mobile: Google access_token qabul qilish ────────────────────────────
  // expo-auth-session Google token ni bu yerga yuboradi
  @Post('google/mobile')
  async googleMobileLogin(@Body() body: { accessToken: string }): Promise<any> {
    if (!body?.accessToken) {
      return { error: 'accessToken required' };
    }

    try {
      // Google API dan foydalanuvchi ma'lumotini olamiz
      const res  = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${body.accessToken}`
      );
      const info = await res.json() as any;

      if (!info?.id) return { error: 'Invalid Google token' };

      const googleUser = {
        googleId:     info.id,
        email:        info.email        ?? '',
        firstName:    info.given_name   ?? '',
        lastName:     info.family_name  ?? '',
        displayName:  info.name         ?? '',
        profileImage: info.picture      ?? '',
      };

      const user = await this.userService.findOrCreateGoogleUser(googleUser);
      return {
        _id:             String(user._id),
        username:        user.username,
        fullName:        user.fullName        ?? '',
        userType:        user.userType,
        userStatus:      user.userStatus,
        profileImage:    user.profileImage    ?? '',
        accessToken:     user.accessToken,
        needsOnboarding: user.needsOnboarding ?? false,
      };
    } catch (e: any) {
      return { error: e?.message ?? 'Google login failed' };
    }
  }
}
