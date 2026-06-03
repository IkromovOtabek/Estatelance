import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';

@Controller('telegram')
export class TelegramBotController {
  constructor(private readonly botService: TelegramBotService) {}

  // Telegram bu endpointga update yuboradi
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Body() update: any): Promise<{ ok: boolean }> {
    await this.botService.handleUpdate(update);
    return { ok: true };
  }
}
