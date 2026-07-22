import crypto from 'crypto';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import type {
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from './auth.schema';
import type { AuthTokens, UserProfile } from '@magazin/shared';
import { UserRole, getPermissionsForRole } from '@magazin/shared';

const RESET_TOKEN_EXPIRY_HOURS = 1;

/**
 * Аутентификация бизнес-логикасы
 */
export class AuthService {
  /** Кирүү */
  static async login(input: LoginInput): Promise<{ user: UserProfile; tokens: AuthTokens }> {
    const email = input.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      throw new AuthError('Email же сырсөз туура эмес', 401);
    }

    const isValidPassword = await PasswordService.compare(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new AuthError('Email же сырсөз туура эмес', 401);
    }

    const tokens = TokenService.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: TokenService.getRefreshTokenExpiry(),
      },
    });

    return { user: this.toUserProfile(user), tokens };
  }

  /** Refresh токен */
  static async refresh(refreshToken: string): Promise<AuthTokens> {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
      throw new AuthError('Жараксыз же мөөнөтү өткөн refresh токен', 401);
    }

    if (!storedToken.user.isActive) {
      throw new AuthError('Колдонуучу активдүү эмес', 403);
    }

    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    const tokens = TokenService.generateTokenPair({
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role as UserRole,
    });

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: storedToken.user.id,
        expiresAt: TokenService.getRefreshTokenExpiry(),
      },
    });

    return tokens;
  }

  /** Чыгуу */
  static async logout(refreshToken: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revoked: true },
    });
  }

  /** Бардык refresh токендерди жокко чыгаруу (сырсөз өзгөргөндө) */
  static async revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }

  /** Учурдагы колдонуучунун профили */
  static async getProfile(userId: string): Promise<UserProfile> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new AuthError('Колдонуучу табылган жок', 404);
    }
    return this.toUserProfile(user);
  }

  /**
   * Сырсөздү унутуу — reset токен түзүү
   * Коопсуздук: email бар же жок экенин ачык айтпайбыз
   */
  static async forgotPassword(
    input: ForgotPasswordInput
  ): Promise<{ message: string; resetToken?: string }> {
    const user = await prisma.user.findUnique({ where: { email: input.email } });

    if (!user || !user.isActive) {
      return {
        message: 'Эгерде бул email катталган болсо, калыбына келтирүү шилтемеси жөнөтүлдү',
      };
    }

    // Эски токендерди жокко чыгаруу
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + RESET_TOKEN_EXPIRY_HOURS);

    await prisma.passwordResetToken.create({
      data: { tokenHash, userId: user.id, expiresAt },
    });

    const result: { message: string; resetToken?: string } = {
      message: 'Эгерде бул email катталган болсо, калыбына келтирүү шилтемеси жөнөтүлдү',
    };

    // Development: токенди жоопко кошуу (email сервиси жок учурда)
    if (env.isDev) {
      result.resetToken = rawToken;
      console.log(`[DEV] Password reset token for ${user.email}: ${rawToken}`);
    }

    return result;
  }

  /** Сырсөздү калыбына келтирүү */
  static async resetPassword(input: ResetPasswordInput): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(input.token).digest('hex');

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      throw new AuthError('Жараксыз же мөөнөтү өткөн токен', 400);
    }

    if (!resetToken.user.isActive) {
      throw new AuthError('Колдонуучу активдүү эмес', 403);
    }

    const passwordHash = await PasswordService.hash(input.password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
      prisma.refreshToken.updateMany({
        where: { userId: resetToken.userId },
        data: { revoked: true },
      }),
    ]);
  }

  private static toUserProfile(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
  }): UserProfile {
    const role = user.role as UserRole;
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role,
      permissions: getPermissionsForRole(role),
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    };
  }
}

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
