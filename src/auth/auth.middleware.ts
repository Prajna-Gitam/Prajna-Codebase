import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt.js';
import { Role } from '../../generated/prisma/client.js';

export interface AuthRequest extends Request {
  user?: {
    sub: string;
    role: Role;
    campusId: string;
    departmentId?: string;
  };
}

/**
 * Validates the Bearer access token. Attaches decoded payload to req.user.
 * Returns 401 on missing/invalid/expired token.
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json(errorEnvelope('INVALID_TOKEN', 'No token provided.'));
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      sub: payload.sub,
      role: payload.role as Role,
      campusId: payload.campusId,
      departmentId: payload.departmentId,
    };
    next();
  } catch (err: unknown) {
    const jwtErr = err as { name?: string };
    if (jwtErr.name === 'TokenExpiredError') {
      res.status(401).json(errorEnvelope('TOKEN_EXPIRED', 'Access token has expired.'));
    } else {
      res.status(401).json(errorEnvelope('INVALID_TOKEN', 'Token is invalid or malformed.'));
    }
  }
}

/**
 * Guards routes to specific roles. Must be used after requireAuth.
 */
export function requireRole(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json(errorEnvelope('FORBIDDEN', 'You do not have access to this resource.'));
      return;
    }
    next();
  };
}

function errorEnvelope(code: string, message: string) {
  return {
    error: {
      code,
      message,
      traceId: crypto.randomUUID(),
    },
  };
}
