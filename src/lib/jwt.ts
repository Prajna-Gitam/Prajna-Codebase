import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const ACCESS_TOKEN_TTL = '15m';

export interface AccessTokenPayload {
  sub: string;       // userId
  role: string;
  campusId: string;
  departmentId?: string;
  iat?: number;
  exp?: number;
}

export interface ChallengeTokenPayload {
  sub: string;       // userId
  purpose: 'MFA_LOGIN';
  iat?: number;
  exp?: number;
}

export function signAccessToken(payload: Omit<AccessTokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL, algorithm: 'HS256' });
}

export function signChallengeToken(userId: string): string {
  return jwt.sign({ sub: userId, purpose: 'MFA_LOGIN' }, JWT_SECRET, {
    expiresIn: '10m',
    algorithm: 'HS256',
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, JWT_SECRET) as AccessTokenPayload;
}

export function verifyChallengeToken(token: string): ChallengeTokenPayload {
  const payload = jwt.verify(token, JWT_SECRET) as ChallengeTokenPayload;
  if (payload.purpose !== 'MFA_LOGIN') {
    throw new Error('Wrong token purpose');
  }
  return payload;
}
