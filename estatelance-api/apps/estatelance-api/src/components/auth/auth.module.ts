import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { JWT_TOKEN_EXPIRY } from '../../libs/config';
import { User, UserSchema } from '../../schemas/User.model';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'fallback-secret-change-in-production',
        signOptions: { expiresIn: JWT_TOKEN_EXPIRY },
      }),
    }),
    // User model needed by ActiveUserGuard to check live spam status from DB
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [AuthService],
  exports: [AuthService, JwtModule, MongooseModule],
})
export class AuthModule {}
