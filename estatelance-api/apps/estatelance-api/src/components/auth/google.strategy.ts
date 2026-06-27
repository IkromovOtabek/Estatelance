import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  process.env.GOOGLE_CALLBACK_URL,
      scope:        ['email', 'profile'],
      // state: true OLIB TASHLANDI — u express-session talab qiladi (sessiya yo'q → 500 xato).
      // Callback Passport guard'siz qo'lda code→token almashadi, shuning uchun state kerak emas.
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;
    done(null, {
      googleId:     id,
      email:        emails?.[0]?.value  ?? '',
      firstName:    name?.givenName     ?? '',
      lastName:     name?.familyName    ?? '',
      profileImage: photos?.[0]?.value  ?? '',
      displayName:  profile.displayName ?? '',
    });
  }
}
