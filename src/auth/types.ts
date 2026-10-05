export type Sex = 'Male' | 'Female' | 'Other';
export interface User {
  id: string;
  email: string;
  name: string;
  sex: Sex;
  created_at: string;
  updated_at: string;
  authenticationMethods?: Array<'password' | 'google'>;
}
export type Owner =
  | { kind: 'user'; id: string }
  | { kind: 'guest'; id: string };
export type Session =
  | { status: 'unauthenticated' }
  | { status: 'guest'; guestSessionId: string }
  | {
      status: 'authenticated';
      user: User;
      token: string;
      expiresAt: string;
      migrateGuestId?: string;
    };
export type AuthState = Session | { status: 'loading' };
export function ownerOf(state: AuthState): Owner | null {
  if (state.status === 'guest')
    return { kind: 'guest', id: state.guestSessionId };
  if (state.status === 'authenticated')
    return { kind: 'user', id: state.user.id };
  return null;
}

export interface GoogleProfile {
  needsProfile: true;
  name: string;
  email: string;
  mode: 'create' | 'link';
}
export type PendingGoogleSignup = GoogleProfile & { idToken: string };
