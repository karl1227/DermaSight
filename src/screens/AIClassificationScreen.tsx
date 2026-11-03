import { showScreeningResult } from '../navigation/screeningFlow';
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  AccessibilityInfo,
  AppState,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, ClassificationResult } from '../types';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { runInference } from '../services/tfliteService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AIClassification'>;
  route: RouteProp<RootStackParamList, 'AIClassification'>;
};

export const AIClassificationScreen: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const {
    patientInfo,
    symptoms,
    imageUri,
    imagePath,
    imageData,
    imageType,
    preprocessingId,
  } = route.params;
  const sourceImagePath = imagePath ?? imageUri;

  const [progress, setProgress] = useState(0);
  const [classificationResult, setClassificationResult] =
    useState<ClassificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { width, height } = useWindowDimensions();
  const diameter = Math.max(180, Math.min(width - 100, height * 0.36, 320));
  const circleSize = {
    width: diameter,
    height: diameter,
    borderRadius: diameter / 2,
  };
  const [reduceMotion, setReduceMotion] = useState(true);
  const [foreground, setForeground] = useState(
    AppState.currentState === 'active',
  );
  const pulseAnim = useRef(new Animated.Value(0)).current;
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
    const app = AppState.addEventListener('change', state =>
      setForeground(state === 'active'),
    );
    return () => {
      active = false;
      motion.remove();
      app.remove();
    };
  }, []);

  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    rotateAnim.setValue(0);
    pulseAnim.setValue(0);
    if (error || reduceMotion || !foreground) return;
    const spinner = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    spinner.start();
    pulse.start();
    return () => {
      spinner.stop();
      pulse.stop();
    };
  }, [rotateAnim, pulseAnim, error, reduceMotion, foreground]);

  useEffect(() => {
    let cancelled = false;

    const runClassification = async () => {
      try {
        setProgress(0);
        setClassificationResult(null);
        setError(null);
        setProgress(10);

        setProgress(35);

        const result = await runInference(
          {
            base64: imageData,
            mimeType: imageType,
            filePath: sourceImagePath,
          },
          symptoms,
          preprocessingId,
        );

        if (cancelled) return;
        setProgress(100);
        setClassificationResult(result);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : 'Unknown runtime error';
        setError(`Classification failed: ${message}`);
      }
    };

    runClassification();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagePath, imageUri, patientInfo, symptoms, preprocessingId]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleContinue = () => {
    if (!classificationResult) return;
    showScreeningResult(navigation, {
      patientInfo,
      symptoms,
      imageUri,
      result: classificationResult,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>CNN EfficientNet Classification</Text>
        <Text style={styles.headerSubtitle}>
          Using the trained TensorFlow Lite model
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.progressCenter}>
          <View
            style={[
              styles.progressStage,
              { width: diameter + 64, height: diameter + 64 },
            ]}
          >
            <Animated.View
              pointerEvents="none"
              style={[
                styles.halo,
                circleSize,
                {
                  opacity: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.18, 0.4],
                  }),
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1.08, 1.2],
                      }),
                    },
                  ],
                },
              ]}
            />
            <View
              pointerEvents="none"
              style={[
                styles.orbit,
                {
                  width: diameter + 36,
                  height: diameter + 36,
                  borderRadius: (diameter + 36) / 2,
                },
              ]}
            />
            <View style={[styles.progressCircleOuter, circleSize]}>
              <Animated.View
                style={[
                  styles.progressSpinner,
                  circleSize,
                  { transform: [{ rotate: spin }] },
                ]}
              >
                <View style={[styles.spinnerArc, circleSize]} />
              </Animated.View>
              <View style={styles.progressInner}>
                <Text
                  style={[
                    styles.progressPercent,
                    { fontSize: diameter * 0.23 },
                  ]}
                >
                  {progress}%
                </Text>
                <Text style={styles.progressLabel}>
                  {error
                    ? 'Unable to analyze'
                    : classificationResult
                    ? 'Complete'
                    : 'Processing'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <View style={styles.errorActions}>
              <TouchableOpacity
                style={styles.errorBtn}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
              >
                <Text style={styles.errorBtnText}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.errorBtn, styles.errorBtnPrimary]}
                onPress={() =>
                  navigation.replace('AIClassification', {
                    patientInfo,
                    symptoms,
                    imageUri,
                    imagePath: sourceImagePath,
                    imageData,
                    imageType,
                    preprocessingId,
                  })
                }
                activeOpacity={0.8}
              >
                <Text style={[styles.errorBtnText, styles.errorBtnTextPrimary]}>
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {classificationResult && !error && (
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueBtnText}>
              Continue to Screening Result
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    fontWeight: Typography.medium,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  progressCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.base,
  },
  progressStage: { alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', backgroundColor: Colors.primaryLight },
  orbit: { position: 'absolute', borderWidth: 1, borderColor: Colors.border },
  progressCircleOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressSpinner: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  spinnerArc: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: Colors.primary,
    borderRightColor: Colors.primary,
  },
  progressInner: { alignItems: 'center' },
  progressPercent: {
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  progressLabel: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
    marginTop: Spacing.sm,
  },
  errorCard: {
    backgroundColor: Colors.dangerLight,
    borderRadius: Radius.md,
    padding: Spacing.base,
    width: '100%',
    marginBottom: Spacing.base,
  },
  errorText: {
    fontSize: Typography.sm,
    color: Colors.danger,
    textAlign: 'center',
  },
  errorActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.base,
  },
  errorBtn: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.danger,
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  errorBtnPrimary: {
    backgroundColor: Colors.danger,
  },
  errorBtnText: {
    fontSize: Typography.sm,
    color: Colors.danger,
    fontWeight: Typography.semiBold,
  },
  errorBtnTextPrimary: {
    color: Colors.white,
  },
  continueBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    minHeight: 56,
    justifyContent: 'center',
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  continueBtnText: {
    fontSize: Typography.base,
    color: Colors.white,
    fontWeight: Typography.bold,
  },
});
