import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

/**
 * Monitoring / uptime (UptimeRobot, pm2, nginx healthcheck) uchun.
 * GET /health -> 200 { status, db, uptime }
 */
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  check() {
    // mongoose readyState: 0=disconnected 1=connected 2=connecting 3=disconnecting
    const dbConnected = this.connection.readyState === 1;
    return {
      status: dbConnected ? 'ok' : 'degraded',
      db: dbConnected ? 'connected' : 'disconnected',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
