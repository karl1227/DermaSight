/**
 * SkinSense Navigation
 *
 * Structure:
 *   Root Stack
 *     ├── Splash
 *     ├── Onboarding
 *     ├── Landing
 *     ├── MedicalDisclaimer
 *     ├── PrivacyConsent
 *     ├── MainTabs (Bottom Tab Navigator)
 *     │     ├── Home
 *     │     ├── History
 *     │     └── Guide
 *     ├── Settings
 *     ├── PatientInfo
 *     ├── SymptomChecklist
 *     ├── Camera
 *     ├── ConfirmImage
 *     ├── ImagePreprocessing
 *     ├── AIClassification
 *     ├── Result
 *     └── Report
 */

import {
  EditProfileScreen,
  SecurityScreen,
  AboutScreen,
} from '../screens/AccountSettingsScreens';
import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { RootStackParamList, TabParamList } from '../types';

import { useAuth } from '../auth/AuthContext';
import {
  WelcomeScreen,
  SignInScreen,
  SignUpScreen,
} from '../screens/AuthScreens';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { LineIcon, AccountColors } from '../components/AccountUI';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Screens
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { LandingScreen } from '../screens/LandingScreen';
import { MedicalDisclaimerScreen } from '../screens/MedicalDisclaimerScreen';
import { PrivacyConsentScreen } from '../screens/PrivacyConsentScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SettingsMedicalDisclaimerScreen } from '../screens/SettingsMedicalDisclaimerScreen';
import { SettingsPrivacyConsentScreen } from '../screens/SettingsPrivacyConsentScreen';
import { PatientInfoScreen } from '../screens/PatientInfoScreen';
import { SymptomChecklistScreen } from '../screens/SymptomChecklistScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { ConfirmImageScreen } from '../screens/ConfirmImageScreen';
import { ImagePreprocessingScreen } from '../screens/ImagePreprocessingScreen';
import { AIClassificationScreen } from '../screens/AIClassificationScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ReportScreen } from '../screens/ReportScreen';
import { LesionGuideScreen } from '../screens/LesionGuideScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: AccountColors.teal,
        tabBarInactiveTintColor: AccountColors.muted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
        tabBarStyle: {
          backgroundColor: '#FFF',
          borderTopColor: '#E8F1F3',
          height: 62 + insets.bottom,
          paddingBottom: Math.max(8, insets.bottom),
          paddingTop: 8,
        },
        tabBarIcon: ({ focused, color }) => (
          <View
            style={{
              padding: 7,
              borderRadius: 24,
              backgroundColor: focused ? AccountColors.teal : 'transparent',
            }}
          >
            <LineIcon
              name={
                route.name === 'Home'
                  ? 'home'
                  : route.name === 'History'
                  ? 'records'
                  : route.name === 'Analytics'
                  ? 'analytics'
                  : 'user'
              }
              color={focused ? '#FFF' : color}
              size={22}
            />
          </View>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ tabBarLabel: 'Records' }}
      />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ─── Root Stack Navigator ─────────────────────────────────────────────────────

export function AppNavigator({
  initialRoute,
}: {
  initialRoute: keyof RootStackParamList;
}) {
  const { state, owner } = useAuth();
  const sessionKey = owner ? `${owner.kind}:${owner.id}` : 'unauthenticated';
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    opacity.setValue(0);
    const transition = Animated.timing(opacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    });
    transition.start();
    return () => transition.stop();
  }, [opacity, sessionKey]);
  return (
    <Animated.View style={{ flex: 1, opacity }}>
      <NavigationContainer key={sessionKey}>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            animationTypeForReplace: 'push',
            animationDuration: 250,
          }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          {state.status !== 'unauthenticated' && (
            <>
              <Stack.Screen name="Splash" component={SplashScreen} />
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
              <Stack.Screen name="Landing" component={LandingScreen} />
              <Stack.Screen
                name="MedicalDisclaimer"
                component={MedicalDisclaimerScreen}
              />
              <Stack.Screen
                name="PrivacyConsent"
                component={PrivacyConsentScreen}
              />
              <Stack.Screen
                name="SettingsMedicalDisclaimer"
                component={SettingsMedicalDisclaimerScreen}
              />
              <Stack.Screen
                name="SettingsPrivacyConsent"
                component={SettingsPrivacyConsentScreen}
              />
              <Stack.Screen name="MainTabs" component={MainTabs} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen name="EditProfile" component={EditProfileScreen} />
              <Stack.Screen name="AccountSecurity" component={SecurityScreen} />
              <Stack.Screen name="About" component={AboutScreen} />
              <Stack.Screen name="PatientInfo" component={PatientInfoScreen} />
              <Stack.Screen
                name="SymptomChecklist"
                component={SymptomChecklistScreen}
              />
              <Stack.Screen name="Camera" component={CameraScreen} />
              <Stack.Screen
                name="ConfirmImage"
                component={ConfirmImageScreen}
              />
              <Stack.Screen
                name="ImagePreprocessing"
                component={ImagePreprocessingScreen}
              />
              <Stack.Screen
                name="AIClassification"
                component={AIClassificationScreen}
                options={{ gestureEnabled: false }}
              />
              <Stack.Screen
                name="Result"
                component={ResultScreen}
                options={{ gestureEnabled: false }}
              />
              <Stack.Screen name="Report" component={ReportScreen} />
              <Stack.Screen name="LesionGuide" component={LesionGuideScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </Animated.View>
  );
}
