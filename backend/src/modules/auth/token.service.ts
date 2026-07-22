import jwt, { type SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import type { JwtPayload, AuthTokens } from '@magazin/shared';
import { env } from '../../config/env';

/**
 * JWT токендерди түзүү жана текшерүү
 */
export class TokenService {
  /** Access токен түзүү (кыска мөөнөттүү) */
  static generateAccessToken(payload: JwtPayload): string {
    const options: SignOptions = { expiresIn: env.jwt.accessExpiresIn as SignOptions['expiresIn'] };
    return jwt.sign(payload, env.jwt.accessSecret, options);
  }

  /** Refresh токен түзүү (узак мөөнөттүү, базада сакталат) */
  static generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /** Access токенди текшерүү */
  static verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, env.jwt.accessSecret) as JwtPayload;
  }

  /** Refresh токендин мөөнөтүн эсептөө */
  static getRefreshTokenExpiry(): Date {
    const days = parseInt(env.jwt.refreshExpiresIn.replace('d', ''), 10) || 7;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    return expiry;
  }

  /** Эки токенди бирге түзүү */
  static generateTokenPair(payload: JwtPayload): AuthTokens {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(),
    };
  }
}
