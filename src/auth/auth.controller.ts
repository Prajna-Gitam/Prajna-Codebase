import { Request, Response } from 'express';
import { AuthRequest } from './auth.middleware.js';
import * as authService from './auth.service.js';
import { verifyChallengeToken } from '../lib/jwt.js';
import { rotateRefreshToken, revokeRefreshToken } from './auth.service.js';

const REFRESH_COOKIE = 'refreshToken';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

function traceId() {
  return crypto.randomUUID();
}

function errorResponse(res: Response, status: number, code: string, message: string) {
  return res.status(status).json({ error: { code, message, traceId: traceId() } });
}

function extractIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress;
}

// ---------------------------------------------------------------------------
// POST /auth/login
// ---------------------------------------------------------------------------

export async function login(req: Request, res: Response): Promise<void> {
  const { identifier, password } = req.body as { identifier?: string; password?: string };

  if (!identifier || !password) {
    errorResponse(res, 400, 'VALIDATION_ERROR', 'identifier and password are required.');
    return;
  }

  try {
    const result = await authService.login(identifier, password, extractIp(req));

    if (result.type === 'MFA_REQUIRED') {
      res.status(200).json({
        mfaRequired: true,
        mfaChallengeToken: result.mfaChallengeToken,
        otpSentTo: result.otpSentTo,
      });
      return;
    }

    res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);
    res.status(200).json({ accessToken: result.accessToken, user: result.user });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'INVALID_CREDENTIALS') {
      errorResponse(res, 401, 'INVALID_CREDENTIALS', 'The email or password you entered is incorrect.');
    } else if (e.code === 'ACCOUNT_INACTIVE') {
      errorResponse(res, 403, 'ACCOUNT_INACTIVE', 'This account has been deactivated.');
    } else {
      console.error('[login]', err);
      errorResponse(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred.');
    }
  }
}

// ---------------------------------------------------------------------------
// POST /auth/mfa/send-otp
// ---------------------------------------------------------------------------

export async function sendOtp(req: Request, res: Response): Promise<void> {
  const challengeToken = (req.headers.authorization ?? '').replace('Bearer ', '');

  if (!challengeToken) {
    errorResponse(res, 401, 'INVALID_CHALLENGE_TOKEN', 'Challenge token is required.');
    return;
  }

  try {
    const result = await authService.sendMfaOtp(challengeToken);
    res.status(200).json(result);
  } catch (err: unknown) {
    const e = err as { code?: string; name?: string };
    if (e.code === 'INVALID_CHALLENGE_TOKEN' || e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
      errorResponse(res, 401, 'INVALID_CHALLENGE_TOKEN', 'Challenge token is missing, expired, or invalid.');
    } else {
      console.error('[sendOtp]', err);
      errorResponse(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred.');
    }
  }
}

// ---------------------------------------------------------------------------
// POST /auth/mfa/verify
// ---------------------------------------------------------------------------

export async function verifyOtp(req: Request, res: Response): Promise<void> {
  const challengeToken = (req.headers.authorization ?? '').replace('Bearer ', '');
  const rawOtp = req.body?.otp;

  if (!challengeToken) {
    errorResponse(res, 401, 'INVALID_CHALLENGE_TOKEN', 'Challenge token is required.');
    return;
  }
  if (typeof rawOtp !== 'string') {
    errorResponse(res, 400, 'VALIDATION_ERROR', 'otp must be a string, not a number.');
    return;
  }
  if (!/^\d{6}$/.test(rawOtp)) {
    errorResponse(res, 400, 'VALIDATION_ERROR', 'otp must be a 6-digit code.');
    return;
  }
  const otp = rawOtp;

  try {
    const result = await authService.verifyMfa(challengeToken, otp, extractIp(req));
    res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);
    res.status(200).json({ accessToken: result.accessToken, user: result.user });
  } catch (err: unknown) {
    const e = err as { code?: string; name?: string };
    if (e.code === 'INVALID_OTP') {
      errorResponse(res, 400, 'INVALID_OTP', 'The OTP entered is incorrect.');
    } else if (e.code === 'OTP_EXPIRED') {
      errorResponse(res, 410, 'OTP_EXPIRED', 'The OTP has expired. Please request a new one.');
    } else if (e.code === 'INVALID_CHALLENGE_TOKEN' || e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
      errorResponse(res, 401, 'INVALID_CHALLENGE_TOKEN', 'Challenge token is missing, expired, or invalid.');
    } else {
      console.error('[verifyOtp]', err);
      errorResponse(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred.');
    }
  }
}

// ---------------------------------------------------------------------------
// POST /auth/refresh
// ---------------------------------------------------------------------------

export async function refresh(req: Request, res: Response): Promise<void> {
  const rawToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;

  if (!rawToken) {
    errorResponse(res, 401, 'MISSING_REFRESH_TOKEN', 'Refresh token cookie is missing.');
    return;
  }

  try {
    const { newRaw, userId } = await rotateRefreshToken(rawToken);

    // Rebuild access token — fetch user for current role/campus
    const { signAccessToken } = await import('../lib/jwt.js');
    const { default: prisma } = await import('../lib/prisma.js');
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.isActive) {
      errorResponse(res, 403, 'ACCOUNT_INACTIVE', 'This account has been deactivated.');
      return;
    }

    const accessToken = signAccessToken({
      sub: user.id,
      role: user.role,
      campusId: user.campusId,
      departmentId: user.departmentId ?? undefined,
    });

    res.cookie(REFRESH_COOKIE, newRaw, COOKIE_OPTIONS);
    res.status(200).json({ accessToken });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'INVALID_REFRESH_TOKEN') {
      errorResponse(res, 401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or has been revoked.');
    } else if (e.code === 'REFRESH_TOKEN_EXPIRED') {
      errorResponse(res, 401, 'REFRESH_TOKEN_EXPIRED', 'Refresh token has expired. Please log in again.');
    } else if (e.code === 'ACCOUNT_INACTIVE') {
      errorResponse(res, 403, 'ACCOUNT_INACTIVE', 'This account has been deactivated.');
    } else {
      console.error('[refresh]', err);
      errorResponse(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred.');
    }
  }
}

// ---------------------------------------------------------------------------
// POST /auth/logout
// ---------------------------------------------------------------------------

export async function logout(req: Request, res: Response): Promise<void> {
  const rawToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  const authHeader = req.headers.authorization;

  if (!rawToken && !authHeader) {
    errorResponse(res, 401, 'NOT_AUTHENTICATED', 'No active session found.');
    return;
  }

  try {
    if (rawToken) {
      await revokeRefreshToken(rawToken);
    }

    // Write audit log if we can identify the user from the access token
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const { verifyAccessToken } = await import('../lib/jwt.js');
        const payload = verifyAccessToken(authHeader.slice(7));
        await authService.writeAuditLog(payload.sub, 'USER_LOGOUT', 'User', payload.sub, extractIp(req));
      } catch {
        // token may be expired — audit log is best-effort on logout
      }
    }

    // Clear cookie regardless
    res.clearCookie(REFRESH_COOKIE, { httpOnly: true, secure: COOKIE_OPTIONS.secure });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('[logout]', err);
    errorResponse(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred.');
  }
}

// ---------------------------------------------------------------------------
// GET /auth/me
// ---------------------------------------------------------------------------

export async function me(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = await authService.getMe(req.user!.sub);
    res.status(200).json(data);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'INVALID_TOKEN') {
      errorResponse(res, 401, 'INVALID_TOKEN', 'Unable to find user for this token.');
    } else {
      console.error('[me]', err);
      errorResponse(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred.');
    }
  }
}

// ---------------------------------------------------------------------------
// POST /auth/change-password
// ---------------------------------------------------------------------------

export async function changePassword(req: AuthRequest, res: Response): Promise<void> {
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    errorResponse(res, 400, 'VALIDATION_ERROR', 'currentPassword and newPassword are required.');
    return;
  }

  try {
    await authService.changePassword(req.user!.sub, currentPassword, newPassword, extractIp(req));
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'VALIDATION_ERROR') {
      errorResponse(
        res,
        400,
        'VALIDATION_ERROR',
        'Password must be at least 8 characters with 1 uppercase letter, 1 digit, and 1 special character.'
      );
    } else if (e.code === 'WRONG_CURRENT_PASSWORD') {
      errorResponse(res, 401, 'WRONG_CURRENT_PASSWORD', 'The current password you entered is incorrect.');
    } else {
      console.error('[changePassword]', err);
      errorResponse(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred.');
    }
  }
}

// ---------------------------------------------------------------------------
// POST /auth/forgot-password
// ---------------------------------------------------------------------------

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email?: string };

  if (!email) {
    errorResponse(res, 400, 'VALIDATION_ERROR', 'email is required.');
    return;
  }

  // Always fire-and-forget to prevent enumeration — never await in error path
  authService.forgotPassword(email).catch((err) => console.error('[forgotPassword]', err));

  res.status(200).json({ message: 'If the email is registered, a reset link has been sent.' });
}

// ---------------------------------------------------------------------------
// POST /auth/reset-password
// ---------------------------------------------------------------------------

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { email, otp, newPassword } = req.body as {
    email?: string;
    otp?: string;
    newPassword?: string;
  };

  if (!email || !otp || !newPassword) {
    errorResponse(res, 400, 'VALIDATION_ERROR', 'email, otp, and newPassword are required.');
    return;
  }

  try {
    await authService.resetPassword(email, otp, newPassword, extractIp(req));
    res.status(200).json({ message: 'Password reset successful. Please log in.' });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'VALIDATION_ERROR') {
      errorResponse(
        res,
        400,
        'VALIDATION_ERROR',
        'Password must be at least 8 characters with 1 uppercase letter, 1 digit, and 1 special character.'
      );
    } else if (e.code === 'INVALID_OTP') {
      errorResponse(res, 400, 'INVALID_OTP', 'The OTP entered is incorrect.');
    } else if (e.code === 'OTP_EXPIRED') {
      errorResponse(res, 410, 'OTP_EXPIRED', 'The OTP has expired. Please request a new one.');
    } else {
      console.error('[resetPassword]', err);
      errorResponse(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred.');
    }
  }
}
