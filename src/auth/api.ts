import { AUTH_API_URL } from '../config/auth';
import { User, Sex, GoogleProfile } from './types';
export class AccountError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}
export interface AccountResponse {
  user: User;
  token: string;
  expiresAt: string;
}
export function validUser(user: unknown): user is User {
  if (!user || typeof user !== 'object') return false;
  const u = user as User;
  return (
    typeof u.id === 'string' &&
    !!u.id &&
    typeof u.email === 'string' &&
    typeof u.name === 'string' &&
    !!u.name.trim() &&
    ['Male', 'Female', 'Other'].includes(u.sex) &&
    typeof u.created_at === 'string' &&
    Number.isFinite(Date.parse(u.created_at)) &&
    typeof u.updated_at === 'string' &&
    Number.isFinite(Date.parse(u.updated_at))
  );
}
async function request(
  path: string,
  method: string,
  data?: unknown,
  token?: string,
) {
  if (!AUTH_API_URL)
    throw new AccountError(
      'The account service is not configured yet. You can continue as a guest.',
    );
  if (
    !AUTH_API_URL.startsWith('https://') &&
    !(
      __DEV__ &&
      /^http:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(
        AUTH_API_URL,
      )
    )
  ) {
    throw new AccountError(
      'The account service requires a secure HTTPS connection.',
    );
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${AUTH_API_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
    const result = await response.json();
    if (!response.ok)
      throw new AccountError(
        response.status === 401
          ? 'Email or password is incorrect, or your session has expired.'
          : response.status === 409
          ? 'An account already uses this email. Sign in instead.'
          : response.status === 429
          ? 'Too many attempts. Please try again later.'
          : 'The account request failed. Please try again.',
        response.status,
      );
    return result;
  } catch (error) {
    if (error instanceof AccountError) throw error;
    throw new AccountError(
      'Cannot reach the account service. Check your connection and try again.',
    );
  } finally {
    clearTimeout(timer);
  }
}
function account(value: AccountResponse): AccountResponse {
  if (
    !validUser(value.user) ||
    typeof value.token !== 'string' ||
    !value.token ||
    !Number.isFinite(Date.parse(value.expiresAt)) ||
    Date.parse(value.expiresAt) <= Date.now()
  ) {
    throw new AccountError(
      'The account service returned an invalid session. Please try again.',
    );
  }
  return value;
}
export const accountApi = {
  google: async (
    idToken: string,
    name?: string,
    sex?: Sex,
    password?: string,
  ): Promise<(AccountResponse & { created: boolean }) | GoogleProfile> => {
    const result = await request('/auth/google', 'POST', {
      idToken,
      name,
      sex,
      password,
    });
    if (result.needsProfile === true)
      return {
        needsProfile: true,
        name: typeof result.name === 'string' ? result.name : '',
        email: typeof result.email === 'string' ? result.email : '',
        mode: result.mode === 'link' ? 'link' : 'create',
      };
    return { ...account(result), created: result.created === true };
  },
  addPassword: async (
    token: string,
    idToken: string,
    password: string,
  ): Promise<User> => {
    const result = await request(
      '/auth/password',
      'POST',
      { idToken, password },
      token,
    );
    if (!validUser(result.user))
      throw new AccountError('Could not add your password.');
    return result.user;
  },
  updateProfile: async (
    token: string,
    name: string,
    sex: Sex,
  ): Promise<User> => {
    const result = await request(
      '/auth/profile',
      'PATCH',
      { name, sex },
      token,
    );
    if (!validUser(result.user))
      throw new AccountError('Could not update your profile.');
    return result.user;
  },
  signup: async (email: string, password: string, name: string, sex: Sex) =>
    account(
      await request('/auth/signup', 'POST', { email, password, name, sex }),
    ),
  login: async (email: string, password: string) =>
    account(await request('/auth/login', 'POST', { email, password })),
  me: async (token: string): Promise<User> => {
    const result = await request('/auth/me', 'GET', undefined, token);
    if (!validUser(result.user))
      throw new AccountError('Could not restore your profile.');
    return result.user;
  },
  logout: (token: string) => request('/auth/logout', 'POST', undefined, token),
};
