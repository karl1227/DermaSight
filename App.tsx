/**
 * DermaSight — AI-Assisted Pigmented Skin Lesion Screening
 * React Native CLI · TypeScript · Offline · SQLite
 *
 * Educational screening tool — not a medical diagnosis.
 *
 * Welcome → Guest / Account → Existing consent flow → MainTabs
 * Session restoration uses the platform credential store.
 */

import { ConnectivityProvider } from './src/connectivity/ConnectivityContext';
import React, { useCallback, useEffect, useState } from 'react';
import { SplashScreen } from './src/screens/SplashScreen';
import { StatusBar, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppNavigator } from './src/navigation';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { Colors } from './src/theme';
import { initDatabase } from './src/database/database';

function App(): React.JSX.Element {
  const [ready, setReady] = useState(false);
  const [dbError, setDbError] = useState(false);

  useEffect(() => {
    let mounted = true;

    initDatabase()
      .then(() => {
        if (mounted) setReady(true);
      })
      .catch(() => {
        if (mounted) setDbError(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor={Colors.primary}
          translucent={false}
        />
        {ready ? (
          <ConnectivityProvider>
            <AuthProvider>
              <SessionNavigator />
            </AuthProvider>
          </ConnectivityProvider>
        ) : (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: Colors.background,
            }}
          >
            <Text style={{ color: Colors.textSecondary }}>
              {dbError
                ? 'Could not open the local database. Restart the app to retry. Your records have not been deleted.'
                : 'Preparing local database...'}
            </Text>
          </View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function SessionNavigator() {
  const { state, error, retry, consentCompleted, onboardingRequired } =
    useAuth();
  const [splashDone, setSplashDone] = useState(false);
  const finishSplash = useCallback(() => setSplashDone(true), []);
  if (!splashDone) return <SplashScreen onFinished={finishSplash} />;
  if (state.status === 'loading')
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          padding: 24,
          backgroundColor: Colors.background,
        }}
      >
        <Text style={{ color: Colors.textPrimary }}>
          {error ?? 'Restoring your session...'}
        </Text>
        {error && (
          <TouchableOpacity onPress={retry} style={{ padding: 20 }}>
            <Text style={{ color: Colors.primary }}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  return (
    <AppNavigator
      initialRoute={
        state.status === 'unauthenticated'
          ? 'Welcome'
          : state.status === 'authenticated'
          ? onboardingRequired
            ? 'Onboarding'
            : 'MainTabs'
          : consentCompleted
          ? 'MainTabs'
          : 'Onboarding'
      }
    />
  );
}
export default App;
