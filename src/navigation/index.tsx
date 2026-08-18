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

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { RootStackParamList, TabParamList } from '../types';
import { Colors, Typography } from '../theme';

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

/**
 * Module-level flag: tracks whether this JS runtime has already gone through
 * the splash/onboarding flow in this session.
 *
 * - Cold start (app killed → reopened): new JS process → flag is false → Splash
 * - Metro dev reload (press R): same JS process re-renders → flag stays true → Home
 */
let _sessionInitialised = false;

// ─── Minimal line icons ───────────────────────────────────────────────────────

const HomeIcon: React.FC<{ color: string }> = ({ color }) => (
  <View style={iconStyles.wrapper}>
    <View style={iconStyles.homeContainer}>
      {/* Roof: two rectangles that form a /\ shape using skew */}
      <View style={iconStyles.roofRow}>
        <View style={[iconStyles.roofLeft, { backgroundColor: color }]} />
        <View style={[iconStyles.roofRight, { backgroundColor: color }]} />
      </View>
      {/* House body */}
      <View style={[iconStyles.houseBody, { borderColor: color }]}>
        {/* Door */}
        <View style={[iconStyles.door, { borderColor: color }]} />
      </View>
    </View>
  </View>
);

const HistoryIcon: React.FC<{ color: string }> = ({ color }) => (
  <View style={iconStyles.wrapper}>
    {/* Clipboard outline */}
    <View style={[iconStyles.clipboard, { borderColor: color }]}>
      {/* Clip tab at top */}
      <View style={[iconStyles.clipTab, { borderColor: color, backgroundColor: 'transparent' }]} />
      {/* Lines */}
      <View style={[iconStyles.line, { backgroundColor: color, marginTop: 10 }]} />
      <View style={[iconStyles.line, { backgroundColor: color, width: 10 }]} />
      <View style={[iconStyles.line, { backgroundColor: color, width: 14 }]} />
    </View>
  </View>
);

const GuideIcon: React.FC<{ color: string }> = ({ color }) => (
  <View style={iconStyles.wrapper}>
    {/* Book outline */}
    <View style={[iconStyles.book, { borderColor: color }]}>
      {/* Spine line */}
      <View style={[iconStyles.spine, { backgroundColor: color }]} />
      {/* Text lines */}
      <View style={[iconStyles.bookLine, { backgroundColor: color, marginTop: 5 }]} />
      <View style={[iconStyles.bookLine, { backgroundColor: color }]} />
      <View style={[iconStyles.bookLine, { backgroundColor: color, width: 8 }]} />
    </View>
  </View>
);

// ─── Tab icon wrapper ─────────────────────────────────────────────────────────

interface TabIconProps {
  Icon: React.FC<{ color: string }>;
  label: string;
  focused: boolean;
}

const TabIcon: React.FC<TabIconProps> = ({ Icon, label, focused }) => {
  const color = focused ? Colors.primary : Colors.textMuted;
  return (
    <View style={tabStyles.iconWrapper}>
      <Icon color={color} />
      <Text style={[tabStyles.label, focused && tabStyles.labelFocused]}>{label}</Text>
    </View>
  );
};

// ─── Bottom Tab Navigator ─────────────────────────────────────────────────────

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: tabStyles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={HomeIcon} label="Home" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={HistoryIcon} label="History" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Guide"
        component={LesionGuideScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={GuideIcon} label="Guide" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Root Stack Navigator ─────────────────────────────────────────────────────

export function AppNavigator() {
  /**
   * On first render of this navigator:
   * - If not yet initialised → start from Splash (cold start path)
   * - If already initialised → jump straight to MainTabs (dev reload path)
   */
  const initialRoute: keyof RootStackParamList = _sessionInitialised
    ? 'MainTabs'
    : 'Splash';

  // Mark session as initialised after this render
  _sessionInitialised = true;

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>

        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="MedicalDisclaimer" component={MedicalDisclaimerScreen} />
        <Stack.Screen name="PrivacyConsent" component={PrivacyConsentScreen} />
        <Stack.Screen name="SettingsMedicalDisclaimer" component={SettingsMedicalDisclaimerScreen} />
        <Stack.Screen name="SettingsPrivacyConsent" component={SettingsPrivacyConsentScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="PatientInfo" component={PatientInfoScreen} />
        <Stack.Screen name="SymptomChecklist" component={SymptomChecklistScreen} />
        <Stack.Screen name="Camera" component={CameraScreen} />
        <Stack.Screen name="ConfirmImage" component={ConfirmImageScreen} />
        <Stack.Screen name="ImagePreprocessing" component={ImagePreprocessingScreen} />
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

      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const tabStyles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: 64,
    paddingBottom: 8,
    paddingTop: 6,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
  },
  labelFocused: {
    color: Colors.primary,
    fontWeight: Typography.semiBold,
  },
});

// ─── Icon geometry styles ─────────────────────────────────────────────────────

const iconStyles = StyleSheet.create({
  wrapper: {
    width: 22,
    height: 20,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  // Home icon
  homeContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  roofRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 0,
  },
  roofLeft: {
    width: 11,
    height: 2,
    borderRadius: 1,
    transform: [{ rotate: '-35deg' }, { translateY: 2 }],
  },
  roofRight: {
    width: 11,
    height: 2,
    borderRadius: 1,
    transform: [{ rotate: '35deg' }, { translateY: 2 }],
  },
  houseBody: {
    width: 14,
    height: 10,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderRadius: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  door: {
    width: 4,
    height: 6,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderRadius: 1,
  },
  // History / clipboard icon
  clipboard: {
    width: 14,
    height: 17,
    borderWidth: 1.5,
    borderRadius: 2,
    alignItems: 'center',
  },
  clipTab: {
    position: 'absolute',
    top: -3,
    width: 6,
    height: 4,
    borderWidth: 1.5,
    borderRadius: 1,
  },
  line: {
    height: 1.5,
    width: 8,
    borderRadius: 1,
    marginTop: 3,
  },
  // Guide / book icon
  book: {
    width: 16,
    height: 18,
    borderWidth: 1.5,
    borderRadius: 2,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  spine: {
    width: 1.5,
    height: '100%',
  },
  bookLine: {
    position: 'absolute',
    height: 1.5,
    width: 7,
    borderRadius: 1,
    right: 2,
  },
});
