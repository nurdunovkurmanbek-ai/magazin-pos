import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../modules/auth/token.service';

/** JWT бар болсо текшерет, жок болсо улантат */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }
  try {
    req.user = TokenService.verifyAccessToken(authHeader.slice(7));
  } catch {
    /* жараксыз токен — конок катары улантат */
  }
  next();
}
