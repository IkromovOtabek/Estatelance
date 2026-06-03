import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { UserService } from '../user/user.service';
import { TelegramBotService } from '../telegram-bot/telegram-bot.service';

@Controller('auth')
export class GoogleController {
  constructor(
    private readonly userService: UserService,
    private readonly botService:  TelegramBotService,
  ) {}

  // Step 1: redirect to Google — mobile_token bilan
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {}

  // Step 2: Google callback
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const googleUser = req.user as any;

    // state param orqali mobile_token ni olamiz
    const mobileToken = (req.query.state as string) || '';
    const isMobile    = mobileToken.startsWith('mob_');

    try {
      if (isMobile) {
        // Mobile: token ni tasdiqlaymiz — app polling orqali oladi
        const tok = mobileToken.replace('mob_', '');
        this.botService.confirmGoogleToken(tok, googleUser);
        res.send(`
          <html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#1e1356;color:white">
            <h2>✅ Muvaffaqiyatli!</h2>
            <p>BuFu ilovaga qaytib kiring</p>
            <script>window.close();</script>
          </body></html>
        `);
      } else {
        // Web: eski oqim
        const user = await this.userService.findOrCreateGoogleUser(googleUser);
        const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3001';
        res.redirect(`${frontendUrl}/auth/google/callback?token=${user.accessToken}&needsOnboarding=${user.needsOnboarding ?? false}`);
      }
    } catch {
      if (isMobile) {
        res.send('<html><body style="text-align:center;padding:40px"><h2>❌ Xatolik</h2><p>Ilovadan qayta urinib ko\'ring</p></body></html>');
      } else {
        const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3001';
        res.redirect(`${frontendUrl}/auth/google/callback?error=auth_failed`);
      }
    }
  }
}
