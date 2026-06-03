import { Controller, Get, Query, Req, Res, UseGuards, Post, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { UserService } from '../user/user.service';
import { TelegramBotService } from '../telegram-bot/telegram-bot.service';

// state → mobileToken xaritalash (passport state bilan aralashmasligi uchun alohida prefix)
const mobileMap = new Map<string, string>(); // state → mob token

@Controller('auth')
export class GoogleController {
  constructor(
    private readonly userService: UserService,
    private readonly botService:  TelegramBotService,
  ) {}

  // ─── Step 1 (Web): Passport orqali Google login ───────────────────────────
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {}

  // ─── Step 1 (Mobile): Manual Google URL ───────────────────────────────────
  // App shu endpoint ga mob token yuboradi, Google OAuth URL qaytaradi
  @Get('google/mobile-url')
  mobileUrl(@Query('mob') mob: string, @Res() res: Response) {
    if (!mob) return res.status(400).json({ error: 'mob required' });

    const state = `m_${mob}`; // "m_" prefiksi bilan — callbackda mobile ekanini bilamiz
    mobileMap.set(state, mob);

    // 5 daqiqadan keyin tozalash
    setTimeout(() => mobileMap.delete(state), 5 * 60 * 1000);

    const clientId    = process.env.GOOGLE_CLIENT_ID ?? '';
    const callbackUrl = encodeURIComponent(
      process.env.GOOGLE_CALLBACK_URL ?? 'https://api.bufu.uz/auth/google/callback'
    );
    const scope       = encodeURIComponent('email profile');
    const url = `https://accounts.google.com/o/oauth2/v2/auth`
      + `?client_id=${clientId}`
      + `&redirect_uri=${callbackUrl}`
      + `&response_type=code`
      + `&scope=${scope}`
      + `&state=${state}`
      + `&access_type=online`
      + `&prompt=select_account`;

    return res.json({ url });
  }

  // ─── Step 2: Google callback ───────────────────────────────────────────────
  @Get('google/callback')
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const state = (req.query.state as string) ?? '';
    const code  = (req.query.code  as string) ?? '';
    const error = (req.query.error as string) ?? '';

    const frontendUrl = process.env.FRONTEND_URL ?? 'https://bufu.uz';
    const isMobile    = state.startsWith('m_');

    if (error || !code) {
      if (isMobile) return res.redirect('bufu://google-auth-done?error=cancelled');
      return res.redirect(`${frontendUrl}/account?error=google_failed`);
    }

    try {
      // Code → token exchange
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id:     process.env.GOOGLE_CLIENT_ID     ?? '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
          redirect_uri:  process.env.GOOGLE_CALLBACK_URL  ?? 'https://api.bufu.uz/auth/google/callback',
          grant_type:    'authorization_code',
        }),
      });
      const tokenData = await tokenRes.json() as any;

      if (!tokenData.access_token) {
        throw new Error('No access token from Google');
      }

      // User info
      const userRes  = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenData.access_token}`
      );
      const userInfo = await userRes.json() as any;

      const googleUser = {
        googleId:     userInfo.id            ?? '',
        email:        userInfo.email         ?? '',
        firstName:    userInfo.given_name    ?? '',
        lastName:     userInfo.family_name   ?? '',
        displayName:  userInfo.name          ?? '',
        profileImage: userInfo.picture       ?? '',
      };

      if (isMobile) {
        // Mobile: token ni tasdiqlash — polling orqali JWT qaytaradi
        const mobToken = mobileMap.get(state) ?? state.replace('m_', '');
        mobileMap.delete(state);
        this.botService.confirmGoogleToken(mobToken, googleUser);
        // expo-web-browser ni yopish uchun bufu:// scheme
        return res.redirect('bufu://google-auth-done');
      } else {
        // Web: JWT yaratib frontend ga yuborish
        const user = await this.userService.findOrCreateGoogleUser(googleUser);
        return res.redirect(
          `${frontendUrl}/auth/google/callback?token=${user.accessToken}&needsOnboarding=${user.needsOnboarding ?? false}`
        );
      }
    } catch (e: any) {
      console.error('[Google OAuth error]', e.message);
      if (isMobile) return res.redirect('bufu://google-auth-done?error=failed');
      return res.redirect(`${frontendUrl}/account?error=google_failed`);
    }
  }
}
