import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../modules/auth/token.service';
import { sendError } from '../utils/api-response';
import type { JwtPayload, Permission, UserRole } from '@magazin/shared';
import { hasPermission, hasAnyPermission } from '@magazin/shared';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/** JWT access токенди текшерүү */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    sendError(res, 'Аутентификация талап кылынат', 401);
    return;
  }

  const token = authHeader.slice(7);

  try {
    req.user = TokenService.verifyAccessToken(token);
    next();
  } catch {
    sendError(res, 'Жараксыз же мөөнөтү өткөн токен', 401);
  }
}

/** Роль текшерүү */
export function authorize(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Аутентификация талап кылынат', 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(res, 'Уруксат жок', 403);
      return;
    }

    next();
  };
}

/** Уруксат текшерүү — RBAC */
export function requirePermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Аутентификация талап кылынат', 401);
      return;
    }

    const allowed = permissions.some((p) => hasPermission(req.user!.role, p));
    if (!allowed) {
      sendError(res, 'Бул аракет үчүн уруксат жок', 403);
      return;
    }

    next();
  };
}

/** Бардык уруксаттар талап кылынат */
export function requireAllPermissions(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Аутентификация талап кылынат', 401);
      return;
    }

    const allowed = permissions.every((p) => hasPermission(req.user!.role, p));
    if (!allowed) {
      sendError(res, 'Бул аракет үчүн уруксат жок', 403);
      return;
    }

    next();
  };
}

/** Уруксаттардын бирөөсү жетиштүү */
export function requireAnyPermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Аутентификация талап кылынат', 401);
      return;
    }

    if (!hasAnyPermission(req.user.role, permissions)) {
      sendError(res, 'Бул аракет үчүн уруксат жок', 403);
      return;
    }

    next();
  };
}
