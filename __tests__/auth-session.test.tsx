import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { AuthProvider, useAuth } from '../src/auth/AuthContext';
import * as Keychain from 'react-native-keychain';
import { accountApi } from '../src/auth/api';
import {
  activateAccount,
  isActiveGuest,
  endGuestSession,
  pendingGuestUpgrade,
  accountNeedsOnboarding,
  setAccountOnboarding,
} from '../src/database/database';
jest.mock('../src/auth/google', () => ({
  clearGoogleSession: jest.fn(async () => {}),
}));
let mockStored: string | null = null;
jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'unlocked' },
  getGenericPassword: jest.fn(async () =>
    mockStored ? { password: mockStored } : false,
  ),
  setGenericPassword: jest.fn(async (_name, value) => {
    mockStored = value;
    return true;
  }),
  resetGenericPassword: jest.fn(async () => {
    mockStored = null;
    return true;
  }),
}));
jest.mock('../src/database/database', () => ({
  accountNeedsOnboarding: jest.fn(async () => false),
  setAccountOnboarding: jest.fn(async () => {}),
  stageGuestUpgrade: jest.fn(async () => {}),
  pendingGuestUpgrade: jest.fn(async () => undefined),
  hasCompletedFirstRun: jest.fn(async () => true),
  createGuestSession: jest.fn(async () => 'guest-1'),
  isActiveGuest: jest.fn(async () => true),
  endGuestSession: jest.fn(async () => {}),
  activateAccount: jest.fn(async () => {}),
}));
jest.mock('../src/auth/api', () => {
  const actual = jest.requireActual('../src/auth/api');
  return {
    ...actual,
    accountApi: {
      addPassword: jest.fn(),
      google: jest.fn(),
      updateProfile: jest.fn(),
      signup: jest.fn(),
      login: jest.fn(),
      me: jest.fn(),
      logout: jest.fn(async () => {}),
    },
  };
});
let current: ReturnType<typeof useAuth>;
function Probe() {
  current = useAuth();
  return null;
}
const user = {
  id: 'user-1',
  email: 'user@example.com',
  name: 'Sample',
  sex: 'Female' as const,
  created_at: '2026-10-05',
  updated_at: '2026-10-05',
};
const response = {
  user,
  token: 'test-token',
  expiresAt: new Date(Date.now() + 600000).toISOString(),
};
let tree: Renderer.ReactTestRenderer;
async function mount() {
  await act(async () => {
    tree = Renderer.create(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
  });
}
beforeEach(() => {
  mockStored = null;
  jest.clearAllMocks();
  (activateAccount as jest.Mock).mockResolvedValue(undefined);
  (isActiveGuest as jest.Mock).mockResolvedValue(true);
  (accountApi.me as jest.Mock).mockResolvedValue(user);
  (accountApi.signup as jest.Mock).mockResolvedValue(response);
  (accountApi.login as jest.Mock).mockResolvedValue(response);
});
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
});
test('fresh launch is unauthenticated, guest is securely restored, and exit clears session', async () => {
  await mount();
  expect(current.state.status).toBe('unauthenticated');
  await act(async () => current.enterGuest());
  expect(current.owner).toEqual({ kind: 'guest', id: 'guest-1' });
  expect(accountApi.signup).not.toHaveBeenCalled();
  await act(async () => tree.unmount());
  await mount();
  expect(current.state.status).toBe('guest');
  await act(async () => current.logout());
  expect(current.state.status).toBe('unauthenticated');
  expect(mockStored).toBeNull();
  expect(endGuestSession).toHaveBeenCalledWith('guest-1');
});
test('signup migrates current guest; authenticated restart restores same user; logout clears credentials', async () => {
  await mount();
  await act(async () => current.enterGuest());
  await act(async () =>
    current.signup(user.email, 'valid-password', user.name, user.sex),
  );
  expect(activateAccount).toHaveBeenCalledWith(user, 'guest-1');
  expect(current.owner).toEqual({ kind: 'user', id: user.id });
  expect(mockStored).not.toContain('valid-password');
  await act(async () => tree.unmount());
  await mount();
  expect(current.owner?.id).toBe(user.id);
  await act(async () => current.logout());
  expect(Keychain.resetGenericPassword).toHaveBeenCalled();
  expect(current.owner).toBeNull();
});
test('failed migration retains secure recovery journal and retries adoption', async () => {
  await mount();
  await act(async () => current.enterGuest());
  (activateAccount as jest.Mock).mockRejectedValueOnce(new Error('disk'));
  await act(async () => {
    await expect(
      current.signup(user.email, 'valid-password', user.name, user.sex),
    ).rejects.toThrow('preserved');
  });
  expect(current.state.status).toBe('loading');
  expect(JSON.parse(mockStored!).migrateGuestId).toBe('guest-1');
  await act(async () => current.retry());
  expect(current.owner?.id).toBe(user.id);
  expect(JSON.parse(mockStored!).migrateGuestId).toBeUndefined();
});
test('expired sessions are cleared; signing into an existing account never adopts guest records', async () => {
  mockStored = JSON.stringify({
    status: 'authenticated',
    ...response,
    expiresAt: '2000-01-01',
  });
  await mount();
  expect(current.state.status).toBe('unauthenticated');
  expect(mockStored).toBeNull();
  await act(async () => current.enterGuest());
  await act(async () => current.login(user.email, 'valid-password'));
  expect(activateAccount).toHaveBeenCalledWith(user, undefined);
});

test('failed secure-session storage preserves a pending upgrade for the correct account to finish at sign-in', async () => {
  await mount();
  await act(async () => current.enterGuest());
  (Keychain.setGenericPassword as jest.Mock).mockResolvedValueOnce(false);
  await act(async () => {
    await expect(
      current.signup(user.email, 'valid-password', user.name, user.sex),
    ).rejects.toThrow('Sign in');
  });
  expect(current.state.status).toBe('guest');
  (pendingGuestUpgrade as jest.Mock).mockResolvedValueOnce('guest-1');
  await act(async () => current.login(user.email, 'valid-password'));
  expect(activateAccount).toHaveBeenCalledWith(user, 'guest-1');
  expect(current.owner?.id).toBe(user.id);
});

test('new Google account adopts current guest, but existing Google account does not', async () => {
  await mount();
  await act(async () => current.enterGuest());
  (accountApi.google as jest.Mock).mockResolvedValueOnce({
    needsProfile: true,
    name: 'Google Name',
    email: user.email,
    mode: 'create',
  });
  let completion: unknown;
  await act(async () => {
    completion = await current.googleLogin('google-id-token');
  });
  expect(completion).toEqual({
    needsProfile: true,
    name: 'Google Name',
    email: user.email,
    mode: 'create',
  });
  expect(current.pendingGoogle?.idToken).toBe('google-id-token');
  expect(current.state.status).toBe('guest');
  expect(mockStored).not.toContain('google-id-token');
  (accountApi.google as jest.Mock).mockResolvedValueOnce({
    ...response,
    created: true,
  });
  await act(async () => {
    await current.googleLogin('google-id-token', user.name, user.sex);
  });
  expect(activateAccount).toHaveBeenCalledWith(user, 'guest-1');
  expect(mockStored).not.toContain('google-id-token');
  await act(async () => current.logout());
  await act(async () => current.enterGuest());
  (activateAccount as jest.Mock).mockClear();
  (accountApi.google as jest.Mock).mockResolvedValueOnce({
    ...response,
    created: false,
  });
  await act(async () => {
    await current.googleLogin('other-google-token');
  });
  expect(activateAccount).toHaveBeenCalledWith(user, undefined);
});

test('offline restore and server outage preserve valid cached account; profile edit updates its cache', async () => {
  mockStored = JSON.stringify({ status: 'authenticated', ...response });
  const { AccountError } = jest.requireActual('../src/auth/api');
  (accountApi.me as jest.Mock).mockRejectedValueOnce(
    new AccountError('Offline'),
  );
  await mount();
  expect(current.owner?.id).toBe(user.id);
  (accountApi.updateProfile as jest.Mock).mockResolvedValueOnce({
    ...user,
    name: 'Updated',
    sex: 'Other',
  });
  await act(async () => current.updateProfile('Updated', 'Other'));
  expect(JSON.parse(mockStored!).user.name).toBe('Updated');
  expect(activateAccount).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'Updated', sex: 'Other' }),
  );
  await act(async () => tree.unmount());
  (accountApi.me as jest.Mock).mockRejectedValueOnce(
    new AccountError('Server unavailable', 503),
  );
  await mount();
  expect(current.state.status).toBe('authenticated');
});

test('only new accounts require onboarding; completion persists per account and returning login skips it', async () => {
  (accountNeedsOnboarding as jest.Mock).mockResolvedValue(false);
  await mount();
  await act(async () => current.login('user@example.com', 'test-password'));
  expect(current.onboardingRequired).toBe(false);
  expect(setAccountOnboarding).not.toHaveBeenCalled();
  await act(async () => current.logout());
  (accountNeedsOnboarding as jest.Mock).mockResolvedValue(true);
  await act(async () =>
    current.signup('user@example.com', 'test-password', 'Sample', 'Female'),
  );
  expect(setAccountOnboarding).toHaveBeenCalledWith('user-1', true);
  expect(current.onboardingRequired).toBe(true);
  await act(async () => current.completeOnboarding());
  expect(setAccountOnboarding).toHaveBeenLastCalledWith('user-1', false);
  expect(current.onboardingRequired).toBe(false);
  (accountNeedsOnboarding as jest.Mock).mockResolvedValue(false);
});
