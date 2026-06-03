import { Controller, Get, Query, Req, Res, UseGuards, Post, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { UserService } from '../user/user.service';
import { TelegramBotService } from '../telegram-bot/telegram-bot.service';

// Mobile token → mob_token mapping (state orqali uzatish murakkab bo'lgani uchun)
// Google callback da state ni olib, shu map dan mobile token ni topamiz
const pendingMobileStates = new Map<string, string>(); // state → mobileToken

@Controller('auth')
export class GoogleController {
  constructor(
    private readonly userService: UserService,
    private readonly botService:  TelegramBotService,
  ) {}

  // ─── Step 1: Google ga yo'naltirish ────────────────────────────────────────
  // ?mob=MOBILE_TOKEN — mobile ilovadan keladi
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin(@Query('mob') mob: string, @Req() req: any) {
    // Passport bu method tanasini ishlatmaydi — UseGuards to'g'ridan-to'g'ri redirect qiladi
    // Lekin req.query.mob ni google.strategy.ts da o'qiymiz
  }

  // ─── Step 2: Google callback ────────────────────────────────────────────────
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const googleUser = req.user as any;
    if (!googleUser) {
      return res.redirect(`${process.env.FRONTEND_URL ?? 'https://bufu.uz'}/account?error=google_failed`);
    }

    // state param dan mobile token ni olamiz
    const state       = (req.query.state as string) ?? '';
    const mobileToken = pendingMobileStates.get(state) ?? '';
    if (mobileToken) pendingMobileStates.delete(state);

    const isMobile = Boolean(mobileToken);

    try {
      if (isMobile) {
        this.botService.confirmGoogleToken(mobileToken, googleUser);
        // bufu:// ga redirect → expo-web-browser oynasi yopiladi
        return res.redirect('bufu://google-auth-done');
      } else {
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
  }

  // ─── Mobile: mob token ni state ga bog'lash ───────────────────────────────
  // App bu endpoint ga mob=TOKEN yuboradi, Google URL ni oladi
  @Get('google/mobile-init')
  mobileInit(@Query('mob') mob: string, @Res() res: Response) {
    if (!mob) return res.status(400).json({ error: 'mob required' });

    // Random state yaratamiz
    const state = Math.random().toString(36).slice(2) + Date.now().toString(36);
    pendingMobileStates.set(state, mob);

    const clientId    = process.env.GOOGLE_CLIENT_ID;
    const callbackUrl = encodeURIComponent(process.env.GOOGLE_CALLBACK_URL ?? 'https://api.bufu.uz/auth/google/callback');
    const googleUrl   = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${callbackUrl}&response_type=code&scope=email%20profile&state=${state}&access_type=offline`;

    return res.json({ url: googleUrl });
  }

  // ─── Mobile: Google access_token → JWT (fallback) ────────────────────────
  @Post('google/mobile')
  async googleMobileLogin(@Body() body: { accessToken: string }): Promise<any> {
    if (!body?.accessToken) return { error: 'accessToken required' };
    try {
      const r    = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${body.accessToken}`);
      const info = await r.json() as any;
      if (!info?.id) return { error: 'Invalid Google token' };

      const user = await this.userService.findOrCreateGoogleUser({
        googleId: info.id, email: info.email ?? '',
        firstName: info.given_name ?? '', lastName: info.family_name ?? '',
        displayName: info.name ?? '', profileImage: info.picture ?? '',
      });
      return {
        _id: String(user._id), username: user.username,
        fullName: user.fullName ?? '', userType: user.userType,
        userStatus: user.userStatus, profileImage: user.profileImage ?? '',
        accessToken: user.accessToken, needsOnboarding: user.needsOnboarding ?? false,
      };
    } catch (e: any) {
      return { error: e?.message ?? 'Google login failed' };
    }
  }
}
