import { Request, Response, NextFunction } from 'express';
import { AuthService, AuthError } from './auth.service';
import {
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.schema';
import { sendSuccess, sendError } from '../../utils/api-response';

/**
 * Аутентификация HTTP контроллерлери
 */
export class AuthController {
  /** POST /auth/login */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = loginSchema.parse(req.body);
      const result = await AuthService.login(input);
      sendSuccess(res, result, 'Ийгиликтүү кирдиңиз');
    } catch (error) {
      next(error);
    }
  }

  /** POST /auth/refresh */
  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = refreshTokenSchema.parse(req.body);
      const tokens = await AuthService.refresh(refreshToken);
      sendSuccess(res, tokens, 'Токен жаңыланды');
    } catch (error) {
      next(error);
    }
  }

  /** POST /auth/logout */
  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = refreshTokenSchema.parse(req.body);
      await AuthService.logout(refreshToken);
      sendSuccess(res, null, 'Ийгиликтүү чыктыңыз');
    } catch (error) {
      next(error);
    }
  }

  /** GET /auth/me */
  static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Аутентификация талап кылынат', 401);
        return;
      }
      const profile = await AuthService.getProfile(req.user.userId);
      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  }

  /** POST /auth/forgot-password */
  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = forgotPasswordSchema.parse(req.body);
      const result = await AuthService.forgotPassword(input);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  /** POST /auth/reset-password */
  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = resetPasswordSchema.parse(req.body);
      await AuthService.resetPassword(input);
      sendSuccess(res, null, 'Сырсөз ийгиликтүү өзгөртүлдү');
    } catch (error) {
      next(error);
    }
  }
}

export function handleAuthError(
  error: Error,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (error instanceof AuthError) {
    sendError(res, error.message, error.statusCode);
    return;
  }
  next(error);
}
