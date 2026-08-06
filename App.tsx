/**
 * SkinSense — AI-Assisted Pigmented Skin Lesion Screening
 * React Native CLI · TypeScript · Offline · SQLite
 *
 * Educational screening tool — not a medical diagnosis.
 *
 * Cold start  → Splash → Onboarding → ... → MainTabs
 * Dev reload  → directly to MainTabs (Home)
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppNavigator } from './src/navigation';
import { Colors } from './src/theme';

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor={Colors.primary}
          translucent={false}
        />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
