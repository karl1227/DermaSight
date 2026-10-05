import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GoogleSigninButton } from '@react-native-google-signin/google-signin';
import { useAuth } from '../auth/AuthContext';
import { googleIdToken } from '../auth/google';
import { AccountError } from '../auth/api';
import { useConnectivity } from '../connectivity/ConnectivityContext';
import { a } from './AccountUI';
export function GoogleEntry({ onProfile }: { onProfile: () => void }) {
  const auth = useAuth();
  const connectivity = useConnectivity();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function signIn() {
    setError('');
    if (connectivity === 'offline') {
      setError(
        'Google Sign-In needs an internet connection. Local screening is still available.',
      );
      return;
    }
    setBusy(true);
    try {
      const token = await googleIdToken();
      if (!token) return;
      const profile = await auth.googleLogin(token);
      if (profile) onProfile();
    } catch (err) {
      setError(
        err instanceof AccountError
          ? err.message
          : 'Could not finish Google Sign-In. Try again.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={styles.container}>
      <GoogleSigninButton
        size={GoogleSigninButton.Size.Wide}
        color={GoogleSigninButton.Color.Light}
        disabled={busy || auth.busy}
        onPress={signIn}
        style={styles.button}
      />
      {error ? (
        <Text accessibilityRole="alert" style={a.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { marginVertical: 14 },
  button: { width: '100%', height: 48 },
});
