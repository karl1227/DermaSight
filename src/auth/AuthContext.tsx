import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { clearGoogleSession } from './google';
import * as Keychain from 'react-native-keychain';
import {
  activateAccount,
  createGuestSession,
  endGuestSession,
  hasCompletedFirstRun,
  isActiveGuest,
  stageGuestUpgrade,
  pendingGuestUpgrade,
  accountNeedsOnboarding,
  setAccountOnboarding,
} from '../database/database';
import { accountApi, AccountError, AccountResponse, validUser } from './api';
import {
  AuthState,
  Session,
  Sex,
  Owner,
  ownerOf,
  GoogleProfile,
  PendingGoogleSignup,
} from './types';
const SERVICE = 'com.dermasight.session';
const STORAGE = {
  service: SERVICE,
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};
async function persist(session: Session) {
  const saved = await Keychain.setGenericPassword(
    'session',
    JSON.stringify(session),
    STORAGE,
  );
  if (!saved) throw new Error('Secure storage unavailable');
}
interface AuthContextValue {
  state: AuthState;
  owner: Owner | null;
  busy: boolean;
  error: string | null;
  consentCompleted: boolean;
  onboardingRequired: boolean;
  completeOnboarding: () => Promise<void>;
  completeConsent: () => void;
  retry: () => Promise<void>;
  enterGuest: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    name: string,
    sex: Sex,
  ) => Promise<void>;
  pendingGoogle: PendingGoogleSignup | null;
  cancelGoogleSignup: () => void;
  googleLogin: (
    idToken: string,
    name?: string,
    sex?: Sex,
    password?: string,
  ) => Promise<GoogleProfile | null>;
  addPassword: (idToken: string, password: string) => Promise<void>;
  updateProfile: (name: string, sex: Sex) => Promise<void>;
  logout: () => Promise<void>;
}
const Context = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });
  const [consentCompleted, setConsentCompleted] = useState(false);
  const [onboardingRequired, setOnboardingRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingGoogle, setPendingGoogle] =
    useState<PendingGoogleSignup | null>(null);
  const locked = useRef(false);
  const restore = useCallback(async () => {
    setError(null);
    setState({ status: 'loading' });
    try {
      setConsentCompleted(await hasCompletedFirstRun());
      const stored = await Keychain.getGenericPassword({ service: SERVICE });
      if (!stored) {
        setState({ status: 'unauthenticated' });
        return;
      }
      let session: Session;
      try {
        session = JSON.parse(stored.password);
      } catch {
        await Keychain.resetGenericPassword({ service: SERVICE });
        setState({ status: 'unauthenticated' });
        return;
      }
      if (
        session.status === 'guest' &&
        typeof session.guestSessionId === 'string' &&
        (await isActiveGuest(session.guestSessionId))
      ) {
        setState(session);
        return;
      }
      if (
        session.status === 'authenticated' &&
        validUser(session.user) &&
        typeof session.token === 'string' &&
        Date.parse(session.expiresAt) > Date.now()
      ) {
        let user = session.user;
        try {
          user = await accountApi.me(session.token);
        } catch (err) {
          if (err instanceof AccountError && err.status === 401) {
            await Keychain.resetGenericPassword({ service: SERVICE });
            setState({ status: 'unauthenticated' });
            return;
          }
          // A valid cached session may access on-device history while offline until expiry.
          if (
            !(err instanceof AccountError) ||
            (err.status && err.status < 500)
          )
            throw err;
        }
        await activateAccount(user, session.migrateGuestId);
        const restored: Session = {
          status: 'authenticated',
          user,
          token: session.token,
          expiresAt: session.expiresAt,
        };
        await persist(restored);
        setOnboardingRequired(await accountNeedsOnboarding(user.id));
        setState(restored);
        return;
      }
      await Keychain.resetGenericPassword({ service: SERVICE });
      setState({ status: 'unauthenticated' });
    } catch {
      setError(
        'Could not restore your local session. Your records are preserved. Please try again.',
      );
    }
  }, []);
  useEffect(() => {
    restore();
  }, [restore]);
  useEffect(() => {
    if (state.status !== 'authenticated') return;
    const timer = setInterval(() => {
      if (Date.parse(state.expiresAt) <= Date.now()) {
        Keychain.resetGenericPassword({ service: SERVICE })
          .then(() => setState({ status: 'unauthenticated' }))
          .catch(() => {
            setState({ status: 'loading' });
            setError('Your session expired. Tap Retry to sign in again.');
          });
      }
    }, 60000);
    return () => clearInterval(timer);
  }, [state]);
  async function run(action: () => Promise<void>) {
    if (locked.current)
      throw new AccountError('Please wait for the current account request.');
    locked.current = true;
    setBusy(true);
    try {
      await action();
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  async function activate(
    response: AccountResponse,
    guestId?: string,
    created = false,
  ) {
    if (created) await setAccountOnboarding(response.user.id, true);
    const staged: Session = {
      status: 'authenticated',
      ...response,
      ...(guestId ? { migrateGuestId: guestId } : {}),
    };
    // Journal in secure storage first: if SQLite fails, retry can finish adoption safely.
    if (guestId) await stageGuestUpgrade(response.user.id, guestId);
    try {
      await persist(staged);
    } catch {
      accountApi.logout(response.token).catch(() => {});
      throw new AccountError(
        'Your account was created, but the session could not be saved. Sign in to finish restoring your guest scans.',
      );
    }
    try {
      await activateAccount(response.user, guestId);
      const session: Session = { status: 'authenticated', ...response };
      await persist(session);
      setOnboardingRequired(await accountNeedsOnboarding(response.user.id));
      setState(session);
    } catch {
      setState({ status: 'loading' });
      setError(
        'Your account is ready, but local records could not be restored. Tap Retry to finish safely.',
      );
      throw new AccountError(
        'Your scans are preserved. Retry session recovery.',
      );
    }
  }
  const cancelGoogleSignup = useCallback(() => setPendingGoogle(null), []);
  const owner = useMemo(() => ownerOf(state), [state]);
  const value: AuthContextValue = {
    state,
    pendingGoogle,
    cancelGoogleSignup,
    owner,
    busy,
    error,
    consentCompleted,
    onboardingRequired,
    completeOnboarding: async () => {
      if (state.status !== 'authenticated') return;
      await setAccountOnboarding(state.user.id, false);
      setOnboardingRequired(false);
    },
    completeConsent: () => setConsentCompleted(true),
    retry: restore,
    enterGuest: () =>
      run(async () => {
        if (state.status === 'guest') return;
        if (state.status === 'authenticated')
          throw new AccountError('Sign out before starting a guest session.');
        const id = await createGuestSession();
        const session: Session = { status: 'guest', guestSessionId: id };
        try {
          await persist(session);
          setState(session);
        } catch {
          await endGuestSession(id);
          throw new AccountError(
            'Could not save your guest session. Try again.',
          );
        }
      }),
    login: (email, password) =>
      run(async () => {
        const response = await accountApi.login(
          email.trim().toLowerCase(),
          password,
        );
        await activate(response, await pendingGuestUpgrade(response.user.id));
        // Ordinary sign-in never adopts guest records; only an unfinished verified signup can resume.
      }),
    signup: (email, password, name, sex) =>
      run(async () => {
        const guestId =
          state.status === 'guest' ? state.guestSessionId : undefined;
        await activate(
          await accountApi.signup(
            email.trim().toLowerCase(),
            password,
            name.trim(),
            sex,
          ),
          guestId,
          true,
        );
      }),
    googleLogin: async (idToken, name, sex, password) => {
      let completion: GoogleProfile | null = null;
      await run(async () => {
        const response = await accountApi.google(idToken, name, sex, password);
        if ('needsProfile' in response) {
          completion = response;
          setPendingGoogle({ ...response, idToken });
          return;
        }
        const guestId =
          response.created && state.status === 'guest'
            ? state.guestSessionId
            : await pendingGuestUpgrade(response.user.id);
        await activate(response, guestId, response.created);
        setPendingGoogle(null);
      });
      return completion;
    },
    addPassword: (idToken, password) =>
      run(async () => {
        if (state.status !== 'authenticated')
          throw new AccountError('Sign in first.');
        const user = await accountApi.addPassword(
          state.token,
          idToken,
          password,
        );
        const session: Session = { ...state, user };
        await persist(session);
        await activateAccount(user);
        setState(session);
      }),
    updateProfile: (name, sex) =>
      run(async () => {
        if (state.status !== 'authenticated')
          throw new AccountError('Sign in to edit your profile.');
        const user = await accountApi.updateProfile(
          state.token,
          name.trim(),
          sex,
        );
        const session: Session = { ...state, user };
        // Save the server profile securely before caching it locally; retry restores this value.
        await persist(session);
        try {
          await activateAccount(user);
          setState(session);
        } catch {
          setState({ status: 'loading' });
          setError(
            'Profile saved. Tap Retry to update the local profile cache.',
          );
        }
      }),
    logout: () =>
      run(async () => {
        const previous = state;
        setPendingGoogle(null);
        // Clear credentials before the navigation tree is replaced.
        await Keychain.resetGenericPassword({ service: SERVICE });
        if (previous.status === 'guest') {
          // Preserve local rows but close this session; the next guest gets a new UUID.
          await endGuestSession(previous.guestSessionId);
        }
        setState({ status: 'unauthenticated' });
        clearGoogleSession().catch(() => {});
        if (previous.status === 'authenticated')
          accountApi.logout(previous.token).catch(() => {});
      }),
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAuth(): AuthContextValue {
  const value = useContext(Context);
  if (!value) throw new Error('AuthProvider is required');
  return value;
}
