import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './libs/interceptor/logging.interceptor';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function startServer() {
  const app = await NestFactory.create(AppModule);

  // WebSocket adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  // CORS — development: all origins, production: only own domain
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : true; // dev: allow all

  app.enableCors({
    origin:      allowedOrigins,
    credentials: true,
    methods:     ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Validate all incoming request data automatically
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false }));

  // Log every request and response time
  app.useGlobalInterceptors(new LoggingInterceptor());

  const port = process.env.PORT || 3007;
  await app.listen(port);

  const env = process.env.NODE_ENV ?? 'development';
  console.log(`🚀 EstateLance API [${env}] running on port ${port}`);
}

startServer();
