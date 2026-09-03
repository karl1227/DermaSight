import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, LesionClass, ClassificationResult } from '../types';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { runInference } from '../services/tfliteService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AIClassification'>;
  route: RouteProp<RootStackParamList, 'AIClassification'>;
};

const LESION_CLASSES: LesionClass[] = [
  'Melanoma',
  'Basal Cell Carcinoma',
  'Actinic Keratoses',
  'Melanocytic Nevi',
  'Benign Keratosis',
  'Dermatofibroma',
  'Vascular Lesions',
];

const INFERENCE_STEPS = [
  { id: 's1', label: 'Loading preprocessed image tensor' },
  { id: 's2', label: 'Running CNN EfficientNet inference' },
  { id: 's3', label: 'Comparing features with 7 HAM10000 classes' },
  { id: 's4', label: 'Reading trained model probabilities' },
  { id: 's5', label: 'Evaluating confidence threshold' },
  { id: 's6', label: 'Generating preliminary screening result' },
];

export const AIClassificationScreen: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const { patientInfo, symptoms, imageUri, imagePath, imageData, imageType, preprocessingId } = route.params;
  const sourceImagePath = imagePath ?? imageUri;

  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [activeClass, setActiveClass] = useState<number>(-1);
  const [classificationResult, setClassificationResult] = useState<ClassificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1800,
        useNativeDriver: true,
      }),
    ).start();
  }, [rotateAnim]);

  useEffect(() => {
    const runClassification = async () => {
      try {
        const stepDelay = 200;
        for (let i = 0; i < INFERENCE_STEPS.length; i++) {
          setCurrentStep(i);
          setActiveClass(i % LESION_CLASSES.length);
          await new Promise<void>(r => setTimeout(r, stepDelay));

          const progressValue = ((i + 1) / INFERENCE_STEPS.length) * 100;
          setProgress(Math.round(progressValue));
          Animated.timing(progressAnim, {
            toValue: progressValue / 100,
            duration: stepDelay * 0.8,
            useNativeDriver: false,
          }).start();

          setCompletedSteps(prev => [...prev, INFERENCE_STEPS[i].id]);
        }

        const result = await runInference(
          {
            base64: imageData,
            mimeType: imageType,
            filePath: sourceImagePath,
          },
          symptoms,
          preprocessingId,
        );

        setClassificationResult(result);
        setActiveClass(-1);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown runtime error';
        setError(`Classification failed: ${message}`);
      }
    };

    runClassification();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagePath, imageUri, patientInfo, symptoms]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleContinue = () => {
    if (!classificationResult) return;
    navigation.replace('Result', {
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
        showsVerticalScrollIndicator={false}>
        <View style={styles.progressCenter}>
          <View style={styles.progressCircleOuter}>
            <Animated.View
              style={[
                styles.progressSpinner,
                { transform: [{ rotate: spin }] },
              ]}>
              <View style={styles.spinnerArc} />
            </Animated.View>
            <View style={styles.progressInner}>
              <Text style={styles.progressPercent}>{progress}%</Text>
              <Text style={styles.progressLabel}>Processing</Text>
            </View>
          </View>
        </View>

        <View style={styles.chipsSection}>
          <Text style={styles.chipsTitle}>HAM10000 Classes</Text>
          <View style={styles.chipsRow}>
            {LESION_CLASSES.map((cls, idx) => (
              <View
                key={cls}
                style={[
                  styles.chip,
                  idx === activeClass && styles.chipActive,
                  classificationResult
                    ? styles.chipScanned
                    : completedSteps.length > 0 && idx < activeClass && styles.chipScanned,
                ]}>
                <Text
                  style={[
                    styles.chipText,
                    idx === activeClass && styles.chipTextActive,
                  ]}>
                  {cls}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.stepsCard}>
          {INFERENCE_STEPS.map((step, idx) => {
            const isCompleted = completedSteps.includes(step.id);
            const isActive = idx === currentStep && !isCompleted;
            return (
              <View
                key={step.id}
                style={[
                  styles.stepRow,
                  isActive && styles.stepActive,
                  isCompleted && styles.stepDone,
                  idx === INFERENCE_STEPS.length - 1 && styles.stepLast,
                ]}>
                <Text style={styles.stepIcon}>
                  {isCompleted ? 'OK' : isActive ? '>' : 'o'}
                </Text>
                <Text
                  style={[
                    styles.stepText,
                    isCompleted && styles.stepTextDone,
                    isActive && styles.stepTextActive,
                  ]}>
                  {step.label}
                </Text>
                {isActive && (
                  <ActivityIndicator size="small" color={Colors.primary} />
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.modelCard}>
          <Text style={styles.modelCardTitle}>Available CNN Model</Text>
          <Text style={styles.modelCardText}>
            EfficientNet TensorFlow Lite model trained for the supported
            HAM10000 lesion classes.
          </Text>
        </View>

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <View style={styles.errorActions}>
              <TouchableOpacity
                style={styles.errorBtn}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}>
                <Text style={styles.errorBtnText}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.errorBtn, styles.errorBtnPrimary]}
                onPress={() => navigation.replace('AIClassification', { patientInfo, symptoms, imageUri, imagePath: sourceImagePath, imageData, imageType, preprocessingId })}
                activeOpacity={0.8}>
                <Text style={[styles.errorBtnText, styles.errorBtnTextPrimary]}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {classificationResult && !error && (
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={handleContinue}
            activeOpacity={0.8}>
            <Text style={styles.continueBtnText}>Continue to Screening Result</Text>
          </TouchableOpacity>
        )}

        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>
            All inference runs locally on device. No data is transmitted to any server.
          </Text>
        </View>
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
  },
  progressCenter: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.base,
  },
  progressCircleOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.primaryUltraLight,
    borderWidth: 3,
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
    fontSize: Typography.xs,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
  },
  chipsSection: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  chipsTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Shadow.sm,
  },
  chipScanned: {
    backgroundColor: Colors.primaryUltraLight,
    borderColor: Colors.primaryLight,
  },
  chipText: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
  },
  chipTextActive: {
    color: Colors.white,
    fontWeight: Typography.semiBold,
  },
  stepsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    width: '100%',
    marginBottom: Spacing.base,
    ...Shadow.card,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  stepLast: { borderBottomWidth: 0 },
  stepActive: { backgroundColor: Colors.primaryUltraLight },
  stepDone: { backgroundColor: Colors.successLight },
  stepIcon: { fontSize: Typography.xs, marginRight: Spacing.md, width: 22 },
  stepText: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
  },
  stepTextActive: { color: Colors.primary, fontWeight: Typography.semiBold },
  stepTextDone: { color: Colors.success },
  errorCard: {
    backgroundColor: Colors.dangerLight,
    borderRadius: Radius.md,
    padding: Spacing.base,
    width: '100%',
    marginBottom: Spacing.base,
  },
  modelCard: {
    backgroundColor: Colors.primaryUltraLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    marginBottom: Spacing.base,
  },
  modelCardTitle: {
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: Typography.bold,
    marginBottom: 4,
  },
  modelCardText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.xs * 1.6,
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
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
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
  footerNote: {
    backgroundColor: Colors.primaryUltraLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  footerNoteText: {
    fontSize: Typography.xs,
    color: Colors.primary,
    textAlign: 'center',
    lineHeight: Typography.xs * 1.6,
    fontWeight: Typography.medium,
  },
});
