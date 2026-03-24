import crypto from 'crypto';
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';
import {
  signAccessToken,
  signChallengeToken,
  verifyChallengeToken,
} from '../lib/jwt.js';
import { Role } from '../../generated/prisma/client.js';

const log = (fn: string, msg: string, meta?: Record<string, unknown>) =>
  console.log(`[auth:${fn}] ${msg}`, meta ? JSON.stringify(meta) : '');

const logError = (fn: string, err: unknown) =>
  console.error(`[auth:${fn}] ERROR`, err);

// Roles that require MFA
const MFA_ROLES: Role[] = [Role.HOD, Role.DEAN, Role.DIRECTOR, Role.IQAC_COORDINATOR, Role.SYSTEM_ADMIN];

export function requiresMfa(role: Role): boolean {
  return MFA_ROLES.includes(role);
}

// Mask email: priya.sharma@gitam.edu → pr***ma@gitam.edu
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (local.length <= 4) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-2)}@${domain}`;
}

// Password validation: min 8 chars, 1 uppercase, 1 digit, 1 special char
export function validatePasswordStrength(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

// ---------------------------------------------------------------------------
// Refresh token helpers (stored as SHA-256 hash in DB)
// ---------------------------------------------------------------------------

export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createRefreshToken(userId: string): Promise<string> {
  const raw = generateRefreshToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.refreshToken.create({
    data: { token: hashRefreshToken(raw), userId, expiresAt },
  });

  log('createRefreshToken', 'Refresh token created', { userId, expiresAt });
  return raw;
}

export async function rotateRefreshToken(
  rawToken: string
): Promise<{ newRaw: string; userId: string }> {
  const hashed = hashRefreshToken(rawToken);
  const record = await prisma.refreshToken.findUnique({ where: { token: hashed } });

  if (!record) {
    log('rotateRefreshToken', 'Token not found in DB');
    throw Object.assign(new Error('INVALID_REFRESH_TOKEN'), { code: 'INVALID_REFRESH_TOKEN' });
  }
  if (record.revokedAt) {
    log('rotateRefreshToken', 'Token already revoked', { revokedAt: record.revokedAt });
    throw Object.assign(new Error('INVALID_REFRESH_TOKEN'), { code: 'INVALID_REFRESH_TOKEN' });
  }
  if (record.expiresAt < new Date()) {
    log('rotateRefreshToken', 'Token expired', { expiresAt: record.expiresAt });
    throw Object.assign(new Error('REFRESH_TOKEN_EXPIRED'), { code: 'REFRESH_TOKEN_EXPIRED' });
  }

  const user = await prisma.user.findUnique({ where: { id: record.userId } });
  if (!user || !user.isActive) {
    log('rotateRefreshToken', 'User inactive or not found', { userId: record.userId });
    throw Object.assign(new Error('ACCOUNT_INACTIVE'), { code: 'ACCOUNT_INACTIVE' });
  }

  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });

  const newRaw = await createRefreshToken(record.userId);
  log('rotateRefreshToken', 'Token rotated', { userId: record.userId });
  return { newRaw, userId: record.userId };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const hashed = hashRefreshToken(rawToken);
  const result = await prisma.refreshToken.updateMany({
    where: { token: hashed, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  log('revokeRefreshToken', `Revoked ${result.count} token(s)`);
}

export async function revokeAllRefreshTokens(userId: string): Promise<void> {
  const result = await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  log('revokeAllRefreshTokens', `Revoked ${result.count} token(s)`, { userId });
}

// ---------------------------------------------------------------------------
// OTP helpers
// ---------------------------------------------------------------------------

export function generateOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function createOtp(
  userId: string,
  purpose: 'MFA_LOGIN' | 'PASSWORD_RESET'
): Promise<string> {
  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await prisma.oTPCode.create({
    data: { userId, codeHash, purpose, expiresAt },
  });

  log('createOtp', 'OTP created', { userId, purpose, expiresAt });
  return code;
}

export async function verifyOtp(
  userId: string,
  code: string,
  purpose: 'MFA_LOGIN' | 'PASSWORD_RESET'
): Promise<void> {
  const otpRecord = await prisma.oTPCode.findFirst({
    where: { userId, purpose, usedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpRecord) {
    log('verifyOtp', 'No active OTP record found', { userId, purpose });
    throw Object.assign(new Error('INVALID_OTP'), { code: 'INVALID_OTP' });
  }

  if (otpRecord.expiresAt < new Date()) {
    log('verifyOtp', 'OTP expired', { userId, expiresAt: otpRecord.expiresAt });
    throw Object.assign(new Error('OTP_EXPIRED'), { code: 'OTP_EXPIRED' });
  }

  const match = await bcrypt.compare(code, otpRecord.codeHash);
  if (!match) {
    log('verifyOtp', 'OTP code mismatch', { userId });
    throw Object.assign(new Error('INVALID_OTP'), { code: 'INVALID_OTP' });
  }

  await prisma.oTPCode.update({
    where: { id: otpRecord.id },
    data: { usedAt: new Date() },
  });

  log('verifyOtp', 'OTP verified successfully', { userId, purpose });
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

export async function writeAuditLog(
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  ipAddress?: string
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: { actorId, action, entityType, entityId, ipAddress },
    });
    log('auditLog', action, { actorId, entityType, entityId });
  } catch (err) {
    // Audit log failure must never break the main flow
    logError('auditLog', err);
  }
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export type LoginResult =
  | {
      type: 'TOKENS';
      accessToken: string;
      refreshToken: string;
      user: SafeUser;
    }
  | {
      type: 'MFA_REQUIRED';
      mfaChallengeToken: string;
      otpSentTo: string;
      userId: string;
    };

export interface SafeUser {
  id: string;
  email: string;
  employeeId: number;
  role: Role;
  campusId: string;
  departmentId: string | null;
}

export async function login(
  identifier: string,
  password: string,
  ipAddress?: string
): Promise<LoginResult> {
  log('login', 'Login attempt', { identifier: identifier.replace(/./g, '*').slice(-4), ipAddress });

  if (!process.env.JWT_SECRET) {
    logError('login', 'JWT_SECRET is not set — cannot sign tokens');
    throw new Error('Server misconfiguration: JWT_SECRET missing');
  }

  const isNumeric = /^\d+$/.test(identifier);
  const user = await prisma.user.findFirst({
    where: isNumeric
      ? { employeeId: parseInt(identifier, 10) }
      : { email: identifier },
  });

  if (!user) {
    log('login', 'User not found', { identifier });
    throw Object.assign(new Error('INVALID_CREDENTIALS'), { code: 'INVALID_CREDENTIALS' });
  }

  log('login', 'User found', { userId: user.id, role: user.role, isActive: user.isActive });

  if (!user.isActive) {
    log('login', 'Account inactive', { userId: user.id });
    throw Object.assign(new Error('ACCOUNT_INACTIVE'), { code: 'ACCOUNT_INACTIVE' });
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    log('login', 'Password mismatch', { userId: user.id });
    await writeAuditLog(user.id, 'USER_LOGIN_FAILED', 'User', user.id, ipAddress);
    throw Object.assign(new Error('INVALID_CREDENTIALS'), { code: 'INVALID_CREDENTIALS' });
  }

  log('login', 'Password verified', { userId: user.id });

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const safeUser: SafeUser = {
    id: user.id,
    email: user.email,
    employeeId: user.employeeId,
    role: user.role,
    campusId: user.campusId,
    departmentId: user.departmentId,
  };

  if (requiresMfa(user.role)) {
    log('login', 'MFA required — generating challenge token', { userId: user.id, role: user.role });

    const mfaChallengeToken = signChallengeToken(user.id);
    const otpCode = await createOtp(user.id, 'MFA_LOGIN');

    // DEV: OTP printed to server console — replace with notification service
    console.log(`\n[AUTH DEV] OTP for ${user.email}: ${otpCode}\n`);

    await writeAuditLog(user.id, 'USER_LOGIN_MFA_INITIATED', 'User', user.id, ipAddress);

    return {
      type: 'MFA_REQUIRED',
      mfaChallengeToken,
      otpSentTo: maskEmail(user.email),
      userId: user.id,
    };
  }

  log('login', 'No MFA — issuing tokens', { userId: user.id, role: user.role });

  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    campusId: user.campusId,
    departmentId: user.departmentId ?? undefined,
  });
  const refreshToken = await createRefreshToken(user.id);

  await writeAuditLog(user.id, 'USER_LOGIN', 'User', user.id, ipAddress);

  return { type: 'TOKENS', accessToken, refreshToken, user: safeUser };
}

// ---------------------------------------------------------------------------
// MFA send OTP (resend)
// ---------------------------------------------------------------------------

export async function sendMfaOtp(
  challengeToken: string
): Promise<{ otpSentTo: string; expiresInSeconds: number }> {
  log('sendMfaOtp', 'Sending MFA OTP');

  const payload = verifyChallengeToken(challengeToken);
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });

  if (!user) {
    log('sendMfaOtp', 'User not found for challenge token', { sub: payload.sub });
    throw Object.assign(new Error('INVALID_CHALLENGE_TOKEN'), { code: 'INVALID_CHALLENGE_TOKEN' });
  }

  const otpCode = await createOtp(user.id, 'MFA_LOGIN');
  console.log(`\n[AUTH DEV] OTP for ${user.email}: ${otpCode}\n`);

  log('sendMfaOtp', 'OTP sent', { userId: user.id, otpSentTo: maskEmail(user.email) });
  return { otpSentTo: maskEmail(user.email), expiresInSeconds: 600 };
}

// ---------------------------------------------------------------------------
// MFA verify
// ---------------------------------------------------------------------------

export async function verifyMfa(
  challengeToken: string,
  otp: string,
  ipAddress?: string
): Promise<{ accessToken: string; refreshToken: string; user: SafeUser }> {
  log('verifyMfa', 'Verifying MFA OTP');

  const payload = verifyChallengeToken(challengeToken);
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });

  if (!user || !user.isActive) {
    log('verifyMfa', 'User not found or inactive', { sub: payload.sub });
    throw Object.assign(new Error('INVALID_CHALLENGE_TOKEN'), { code: 'INVALID_CHALLENGE_TOKEN' });
  }

  await verifyOtp(user.id, otp, 'MFA_LOGIN');

  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    campusId: user.campusId,
    departmentId: user.departmentId ?? undefined,
  });
  const refreshToken = await createRefreshToken(user.id);

  await writeAuditLog(user.id, 'USER_LOGIN_MFA_SUCCESS', 'User', user.id, ipAddress);
  log('verifyMfa', 'MFA verified — tokens issued', { userId: user.id });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      employeeId: user.employeeId,
      role: user.role,
      campusId: user.campusId,
      departmentId: user.departmentId,
    },
  };
}

// ---------------------------------------------------------------------------
// Change password
// ---------------------------------------------------------------------------

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  ipAddress?: string
): Promise<void> {
  log('changePassword', 'Changing password', { userId });

  if (!validatePasswordStrength(newPassword)) {
    log('changePassword', 'New password fails strength rules', { userId });
    throw Object.assign(new Error('VALIDATION_ERROR'), { code: 'VALIDATION_ERROR' });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error('INVALID_CREDENTIALS'), { code: 'INVALID_CREDENTIALS' });

  const match = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!match) {
    log('changePassword', 'Current password mismatch', { userId });
    throw Object.assign(new Error('WRONG_CURRENT_PASSWORD'), { code: 'WRONG_CURRENT_PASSWORD' });
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });
  await revokeAllRefreshTokens(userId);
  await writeAuditLog(userId, 'PASSWORD_CHANGED', 'User', userId, ipAddress);
  log('changePassword', 'Password changed successfully', { userId });
}

// ---------------------------------------------------------------------------
// Forgot / reset password
// ---------------------------------------------------------------------------

export async function forgotPassword(email: string): Promise<void> {
  log('forgotPassword', 'Password reset requested', { email });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    log('forgotPassword', 'User not found or inactive — no-op', { email });
    return;
  }

  const otpCode = await createOtp(user.id, 'PASSWORD_RESET');
  console.log(`\n[AUTH DEV] Password reset OTP for ${user.email}: ${otpCode}\n`);
}

export async function resetPassword(
  email: string,
  otp: string,
  newPassword: string,
  ipAddress?: string
): Promise<void> {
  log('resetPassword', 'Resetting password', { email });

  if (!validatePasswordStrength(newPassword)) {
    throw Object.assign(new Error('VALIDATION_ERROR'), { code: 'VALIDATION_ERROR' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    log('resetPassword', 'User not found', { email });
    throw Object.assign(new Error('INVALID_OTP'), { code: 'INVALID_OTP' });
  }

  await verifyOtp(user.id, otp, 'PASSWORD_RESET');

  const newHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });
  await revokeAllRefreshTokens(user.id);
  await writeAuditLog(user.id, 'PASSWORD_RESET', 'User', user.id, ipAddress);
  log('resetPassword', 'Password reset successfully', { userId: user.id });
}

// ---------------------------------------------------------------------------
// Me
// ---------------------------------------------------------------------------

export async function getMe(userId: string) {
  log('getMe', 'Fetching user', { userId });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { campus: true, facultyProfile: { select: { id: true } } },
  });

  if (!user) throw Object.assign(new Error('INVALID_TOKEN'), { code: 'INVALID_TOKEN' });

  return {
    id: user.id,
    email: user.email,
    employeeId: user.employeeId,
    role: user.role,
    isActive: user.isActive,
    campusId: user.campusId,
    campusCode: user.campus.code,
    departmentId: user.departmentId,
    lastLoginAt: user.lastLoginAt,
    facultyProfileId: user.facultyProfile?.id ?? null,
  };
}
