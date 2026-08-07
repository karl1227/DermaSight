/**
 * SkinSense — AI-Assisted Pigmented Skin Lesion Screening
 * React Native CLI · TypeScript · Offline · SQLite
 *
 * Educational screening tool — not a medical diagnosis.
 *
 * Cold start  → Splash → Onboarding → ... → MainTabs
 * Dev reload  → directly to MainTabs (Home)
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppNavigator } from './src/navigation';
import { Colors } from './src/theme';
import { initDatabase } from './src/database/database';

function App(): React.JSX.Element {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    initDatabase()
      .catch(err => console.warn('DB init error:', err))
      .finally(() => {
        if (mounted) setReady(true);
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
          <AppNavigator />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
            <Text style={{ color: Colors.textSecondary }}>Preparing secure local database...</Text>
          </View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
