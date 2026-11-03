import { startNewScreening } from '../navigation/screeningFlow';
import {
  useConnectivity,
  refreshConnectivity,
} from '../connectivity/ConnectivityContext';
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  Alert,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineIcon } from '../components/AccountUI';
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
  const [refreshing, setRefreshing] = useState(false);
  const refreshingLock = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const handleRefresh = async () => {
    if (refreshingLock.current) return;
    refreshingLock.current = true;
    setRefreshing(true);
    try {
      // A cached/fast response can otherwise batch true→false before iOS paints.
      const [connection] = await Promise.allSettled([
        refreshConnectivity(),
        new Promise<void>(resolve => setTimeout(resolve, 650)),
      ]);
      if (connection.status === 'rejected') throw connection.reason;
    } catch {
      if (mounted.current)
        Alert.alert(
          'Could not refresh',
          'Please try again. Local screening is still available.',
        );
    } finally {
      refreshingLock.current = false;
      if (mounted.current) setRefreshing(false);
    }
  };
  const focused = useIsFocused();
  const [reduceMotion, setReduceMotion] = useState(true);
  const [foreground, setForeground] = useState(
    AppState.currentState === 'active',
  );
  const breathe = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current;
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
    const values = [innerPulse, outerPulse, breathe, sweep];
    values.forEach(value => value.setValue(0));
    if (!focused || !foreground || reduceMotion) return;
    const timing = (value: Animated.Value, toValue: number, duration: number) =>
      Animated.timing(value, {
        toValue,
        duration,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
        isInteraction: false,
      });
    const ripple = Animated.loop(
      Animated.parallel([
        Animated.sequence([timing(innerPulse, 1, 2400), Animated.delay(600)]),
        Animated.sequence([Animated.delay(600), timing(outerPulse, 1, 2400)]),
      ]),
    );
    const breathing = Animated.loop(
      Animated.sequence([timing(breathe, 1, 1500), timing(breathe, 0, 1500)]),
    );
    const scanning = Animated.loop(
      Animated.sequence([timing(sweep, 1, 1900), Animated.delay(1100)]),
    );
    ripple.start();
    breathing.start();
    scanning.start();
    return () => {
      ripple.stop();
      breathing.stop();
      scanning.stop();
      values.forEach(value => value.setValue(0));
    };
  }, [
    focused,
    foreground,
    reduceMotion,
    innerPulse,
    outerPulse,
    breathe,
    sweep,
  ]);
  const outerOpacity = reduceMotion
    ? 0.5
    : outerPulse.interpolate({
        inputRange: [0, 0.12, 1],
        outputRange: [0, 0.65, 0],
      });
  const innerOpacity = reduceMotion
    ? 0.6
    : innerPulse.interpolate({
        inputRange: [0, 0.12, 1],
        outputRange: [0, 0.7, 0],
      });
  const outerScale = reduceMotion
    ? 1
    : outerPulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.72, 1.18],
      });
  const innerScale = reduceMotion
    ? 1
    : innerPulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.8, 1.25],
      });
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
        contentInsetAdjustmentBehavior="never"
        refreshControl={
          <RefreshControl
            enabled
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor={Colors.background}
        />

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
            <View
              style={[
                styles.offlineBadge,
                connectivity === 'online' && styles.onlineBadge,
              ]}
              accessibilityRole="text"
              accessibilityLiveRegion="polite"
            >
              <View
                style={[
                  styles.connectionDot,
                  {
                    backgroundColor:
                      connectivity === 'online'
                        ? Colors.success
                        : Colors.textMuted,
                  },
                ]}
              />
              <Text style={styles.offlineBadgeText}>
                {connectivity === 'online'
                  ? 'Online'
                  : connectivity === 'offline'
                  ? 'Offline'
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
                      scale: outerScale,
                    },
                  ],
                  opacity: outerOpacity,
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
                      scale: innerScale,
                    },
                  ],
                  opacity: innerOpacity,
                },
              ]}
            />
            <Animated.View
              style={{
                transform: [
                  {
                    scale: breathe.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.045],
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
                  {!reduceMotion && (
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.scanSweep,
                        {
                          opacity: sweep.interpolate({
                            inputRange: [0, 0.15, 0.85, 1],
                            outputRange: [0, 0.85, 0.85, 0],
                          }),
                          transform: [
                            {
                              translateY: sweep.interpolate({
                                inputRange: [0, 1],
                                outputRange: [3, 29],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                  )}
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

        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>About DermaSight</Text>
          <Text style={styles.aboutText}>
            DermaSight guides you through capturing a skin lesion, reviewing an
            on-device AI screening result, and saving your history on this
            device.
          </Text>
          <View style={styles.stepsRow}>
            {(
              [
                { icon: 'scan', label: 'Capture' },
                { icon: 'analytics', label: 'Analyze' },
                { icon: 'records', label: 'Review' },
              ] as const
            ).map(step => (
              <View key={step.label} style={styles.step}>
                <LineIcon name={step.icon} size={19} />
                <Text style={styles.stepText}>{step.label}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.localText}>
            Skin screening works offline. Internet is needed for sign-in and
            account updates.
          </Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => navigation.navigate('LesionGuide')}
          style={styles.guideLink}
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
      </ScrollView>
    </SafeAreaView>
  );
};

const SCAN_SIZE = 150;
const INNER_RING_SIZE = 190;
const OUTER_RING_SIZE = 230;

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  guideLink: { padding: Spacing.base, alignItems: 'center' },
  content: { flexGrow: 1, paddingBottom: Spacing.sm },
  onlineBadge: { backgroundColor: Colors.successLight, borderColor: '#C6DFC8' },
  connectionDot: { width: 7, height: 7, borderRadius: 4, marginRight: 3 },
  scanSweep: {
    position: 'absolute',
    left: 4,
    right: 4,
    height: 2,
    backgroundColor: Colors.white,
    borderRadius: 2,
  },
  aboutCard: {
    marginHorizontal: Spacing.xl,
    padding: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  aboutTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  aboutText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Spacing.base,
  },
  step: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  stepText: {
    fontSize: Typography.xs,
    color: Colors.primaryDark,
    fontWeight: Typography.medium,
  },
  localText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: Spacing.base,
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
    flexGrow: 1,
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
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
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
    position: 'absolute',
    width: INNER_RING_SIZE,
    height: INNER_RING_SIZE,
    borderRadius: INNER_RING_SIZE / 2,
    backgroundColor: `${Colors.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanCircle: {
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 5,
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    borderRadius: SCAN_SIZE / 2,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  scanFrame: {
    overflow: 'hidden',
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
