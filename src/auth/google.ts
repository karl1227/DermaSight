import { Platform } from 'react-native';
import {
  GoogleSignin,
  isSuccessResponse,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '../config/auth';
import { AccountError } from './api';
export async function googleIdToken(): Promise<string | null> {
  if (!GOOGLE_WEB_CLIENT_ID || (Platform.OS === 'ios' && !GOOGLE_IOS_CLIENT_ID))
    throw new AccountError(
      'Google Sign-In setup is not complete yet. You can use email sign-in or continue as a guest.',
    );
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    offlineAccess: false,
  });
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const result = await GoogleSignin.signIn();
    if (!isSuccessResponse(result)) return null;
    if (!result.data.idToken)
      throw new AccountError(
        'Google did not return a sign-in token. Check the Web client ID.',
      );
    return result.data.idToken;
  } catch (error) {
    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED)
      return null;
    if (error instanceof AccountError) throw error;
    throw new AccountError(
      'Google Sign-In could not finish. Check your connection and Google setup, then try again.',
    );
  }
}
export async function clearGoogleSession() {
  if (GOOGLE_WEB_CLIENT_ID) await GoogleSignin.signOut();
}
