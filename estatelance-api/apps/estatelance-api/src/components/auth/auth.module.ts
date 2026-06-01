import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './google.strategy';
import { JWT_TOKEN_EXPIRY } from '../../libs/config';
import { User, UserSchema } from '../../schemas/User.model';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'fallback-secret-change-in-production',
        signOptions: { expiresIn: JWT_TOKEN_EXPIRY },
      }),
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [AuthService, GoogleStrategy],
  exports: [AuthService, JwtModule, MongooseModule],
})
export class AuthModule {}
