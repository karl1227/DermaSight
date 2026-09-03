import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, Animated } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Colors, Typography, Spacing } from '../theme';
import { hasCompletedFirstRun } from '../database/database';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
};

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 55, friction: 9, useNativeDriver: true }),
    ]).start();

    let mounted = true;
    const timer = setTimeout(async () => {
      const completed = await hasCompletedFirstRun();
      if (!mounted) return;
      navigation.replace(completed ? 'MainTabs' : 'Onboarding');
    }, 2600);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <Animated.View
        style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>

        {/* Outer ring */}
        <View style={styles.outerRing}>
          {/* Teal circle with scan icon */}
          <View style={styles.iconCircle}>
            {/* Scan frame corners */}
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
          </View>
        </View>

        <Text style={styles.appName}>DermaSight</Text>
        <Text style={styles.subtitle}>AI-Assisted Pigmented Skin Lesion Screening</Text>

        {/* Loading dots */}
        <View style={styles.dots}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

const ICON_SIZE = 80;
const OUTER_SIZE = 160;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  outerRing: {
    width: OUTER_SIZE,
    height: OUTER_SIZE,
    borderRadius: OUTER_SIZE / 2,
    backgroundColor: Colors.primaryUltraLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  iconCircle: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 36,
    height: 36,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderColor: Colors.white,
    borderWidth: 2.5,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 2 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 2 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 2 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 2 },
  appName: {
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
    color: Colors.primary,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.xxl,
    lineHeight: Typography.sm * 1.55,
  },
  dots: {
    flexDirection: 'row',
    marginTop: Spacing.xxl,
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.primary,
  },
});
