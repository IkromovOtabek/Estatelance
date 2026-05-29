import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { SALT_ROUNDS, TELEGRAM_AUTH_MAX_AGE_SECONDS } from '../../libs/config';

// Raw Telegram data sent by the login widget.
// id is string because Telegram user IDs can exceed 32-bit Int range.
export interface TelegramAuthData {
  id: string;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  // Hash a plain text password before saving to database
  async hashPassword(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, SALT_ROUNDS);
  }

  // Check if a plain text password matches the stored hash
  async isPasswordCorrect(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Create a JWT token that the frontend will store and send with future requests
  async createToken(user: any): Promise<string> {
    const payload = {
      _id: user._id,
      username: user.username,
      userType: user.userType,
      userStatus: user.userStatus,
      profileImage: user.profileImage ?? '',
      fullName: user.fullName ?? '',
      needsOnboarding: user.needsOnboarding ?? false,
    };
    return this.jwtService.sign(payload);
  }

  // Decode a JWT token to get the user info stored inside it
  decodeToken(token: string): any {
    return this.jwtService.decode(token);
  }

  // ─── Telegram Authentication ───────────────────────────────────────────────
  // Verify that the data from Telegram's login widget is genuine.
  // Telegram signs the data using our bot token — we verify the signature here.
  // Docs: https://core.telegram.org/widgets/login#checking-authorization
  verifyTelegramAuth(data: TelegramAuthData): boolean {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      throw new UnauthorizedException('Telegram bot is not configured on the server');
    }

    // Step 1: Check that the auth data is not too old (prevent replay attacks)
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const ageInSeconds = currentTimestamp - data.auth_date;
    if (ageInSeconds > TELEGRAM_AUTH_MAX_AGE_SECONDS) {
      throw new UnauthorizedException('Telegram auth data has expired. Please try again.');
    }

    // Step 2: Build the data_check_string
    const dataToCheck = Object.keys(data)
      .filter((key) => key !== 'hash' && data[key] !== undefined && data[key] !== null && data[key] !== '')
      .sort()
      .map((key) => `${key}=${data[key]}`)
      .join('\n');

    // Step 3: Create the secret key = SHA256 of the bot token
    const secretKey = crypto.createHash('sha256').update(botToken).digest();

    // Step 4: Create HMAC-SHA256 of dataToCheck using the secret key
    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataToCheck)
      .digest('hex');

    // Step 5: Compare computed hash with the hash Telegram sent
    if (computedHash !== data.hash) {
      throw new UnauthorizedException('Invalid Telegram authentication data');
    }

    return true;
  }
}
