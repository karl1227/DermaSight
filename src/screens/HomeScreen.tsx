import { startNewScreening } from '../navigation/screeningFlow';
import { useConnectivity } from '../connectivity/ConnectivityContext';
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Animated,
  Easing,
  AccessibilityInfo,
  AppState,
} from 'react-native';
import {
  CompositeNavigationProp,
  useIsFocused,
} from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, TabParamList } from '../types';
import { useAuth } from '../auth/AuthContext';
import { Colors, Typography, Spacing, Radius } from '../theme';

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList, 'Home'>,
    NativeStackNavigationProp<RootStackParamList>
  >;
};

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { state } = useAuth();
  const connectivity = useConnectivity();
  const focused = useIsFocused();
  const [reduceMotion, setReduceMotion] = useState(true);
  const [foreground, setForeground] = useState(
    AppState.currentState === 'active',
  );
  const innerPulse = useRef(new Animated.Value(0)).current;
  const outerPulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(enabled => {
        if (active) setReduceMotion(enabled);
      })
      .catch(() => {});
    const motion = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    const app = AppState.addEventListener('change', next =>
      setForeground(next === 'active'),
    );
    return () => {
      active = false;
      motion.remove();
      app.remove();
    };
  }, []);
  useEffect(() => {
    innerPulse.setValue(0);
    outerPulse.setValue(0);
    if (!focused || !foreground || reduceMotion) return;
    const ease = Easing.inOut(Easing.sin);
    const breathe = (value: Animated.Value) =>
      Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration: 1000,
          easing: ease,
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration: 1000,
          easing: ease,
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]);
    const pulse = Animated.loop(
      Animated.parallel([
        Animated.sequence([breathe(innerPulse), Animated.delay(180)]),
        Animated.sequence([Animated.delay(180), breathe(outerPulse)]),
      ]),
    );
    pulse.start();
    return () => {
      pulse.stop();
      innerPulse.setValue(0);
      outerPulse.setValue(0);
    };
  }, [focused, foreground, reduceMotion, innerPulse, outerPulse]);
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Top header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Welcome to DermaSight</Text>
          <Text style={styles.headerSubtitle}>
            {state.status === 'guest'
              ? 'Guest · Local screening'
              : state.status === 'authenticated'
              ? `Hello, ${state.user.name}`
              : 'AI-Assisted Skin Lesion Screening'}
          </Text>
          <View style={styles.offlineBadge}>
            {/* wifi-slash icon */}
            <Text style={styles.offlineIcon}>&#8212;</Text>
            <Text style={styles.offlineBadgeText}>
              {connectivity === 'online'
                ? 'Online · Local screening ready'
                : connectivity === 'offline'
                ? 'Offline · Screening available'
                : 'Checking connection…'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.75}
        >
          {/* Minimal gear icon */}
          <View style={styles.gearOuter}>
            <View style={styles.gearInner} />
            {/* Gear teeth - top, bottom, left, right */}
            <View style={[styles.gearTooth, styles.gearToothTop]} />
            <View style={[styles.gearTooth, styles.gearToothBottom]} />
            <View style={[styles.gearTooth, styles.gearToothLeft]} />
            <View style={[styles.gearTooth, styles.gearToothRight]} />
            <View style={[styles.gearTooth, styles.gearToothTL]} />
            <View style={[styles.gearTooth, styles.gearToothTR]} />
            <View style={[styles.gearTooth, styles.gearToothBL]} />
            <View style={[styles.gearTooth, styles.gearToothBR]} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Central scan CTA */}
      <View style={styles.ctaArea}>
        <View style={styles.pulseArea}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.outerRing,
              {
                transform: [
                  {
                    scale: outerPulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.08],
                    }),
                  },
                ],
                opacity: outerPulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.6],
                }),
              },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.innerRing,
              {
                transform: [
                  {
                    scale: innerPulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.06],
                    }),
                  },
                ],
                opacity: innerPulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.75],
                }),
              },
            ]}
          />
          <Animated.View
            style={{
              transform: [
                {
                  scale: innerPulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.02],
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Start New Screening"
              style={styles.scanCircle}
              onPress={() => startNewScreening(navigation)}
              activeOpacity={0.82}
            >
              {/* Scan frame corners */}
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
              </View>
              <Text style={styles.scanText}>Start New{'\n'}Screening</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => navigation.navigate('LesionGuide')}
        style={{ padding: 16, alignItems: 'center' }}
      >
        <Text style={{ color: Colors.primary }}>Skin Lesion Guide</Text>
      </TouchableOpacity>
      {/* Disclaimer card */}
      <View style={styles.disclaimerCard}>
        <Text style={styles.disclaimerText}>
          DermaSight supports early awareness and does not provide final
          diagnosis
        </Text>
      </View>
    </View>
  );
};

const SCAN_SIZE = 150;
const INNER_RING_SIZE = 190;
const OUTER_RING_SIZE = 230;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.base,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: { flex: 1 },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.primary,
    marginBottom: 3,
  },
  headerSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 5,
  },
  offlineIcon: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: Typography.bold,
  },
  offlineBadgeText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  settingsBtn: {
    marginTop: 4,
    padding: Spacing.sm,
  },
  gearOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.textMuted,
  },
  gearTooth: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 1,
    backgroundColor: Colors.textMuted,
  },
  gearToothTop: { top: -3, left: 8 },
  gearToothBottom: { bottom: -3, left: 8 },
  gearToothLeft: { left: -3, top: 8 },
  gearToothRight: { right: -3, top: 8 },
  gearToothTL: { top: 0, left: 0, transform: [{ rotate: '45deg' }] },
  gearToothTR: { top: 0, right: 0, transform: [{ rotate: '45deg' }] },
  gearToothBL: { bottom: 0, left: 0, transform: [{ rotate: '45deg' }] },
  gearToothBR: { bottom: 0, right: 0, transform: [{ rotate: '45deg' }] },
  ctaArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    width: OUTER_RING_SIZE,
    height: OUTER_RING_SIZE,
    borderRadius: OUTER_RING_SIZE / 2,
    backgroundColor: Colors.primaryUltraLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseArea: {
    width: OUTER_RING_SIZE,
    height: OUTER_RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRing: {
    position: 'absolute',
    width: INNER_RING_SIZE,
    height: INNER_RING_SIZE,
    borderRadius: INNER_RING_SIZE / 2,
    backgroundColor: `${Colors.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanCircle: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    borderRadius: SCAN_SIZE / 2,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  scanFrame: {
    width: 34,
    height: 34,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 11,
    height: 11,
    borderColor: Colors.white,
    borderWidth: 2.5,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 2,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 2,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 2,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 2,
  },
  scanText: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.white,
    textAlign: 'center',
    lineHeight: Typography.base * 1.4,
  },
  disclaimerCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  disclaimerText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: Typography.sm * 1.55,
  },
});
