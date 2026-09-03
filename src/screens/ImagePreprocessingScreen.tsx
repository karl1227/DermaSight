import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  InteractionManager,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { AppButton } from '../components/AppButton';
import {
  runPreprocessing,
  PREPROCESSING_STEPS,
  PreprocessingStep,
} from '../services/preprocessingService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ImagePreprocessing'>;
  route: RouteProp<RootStackParamList, 'ImagePreprocessing'>;
};

const IMAGE_PREVIEW_SIZE = Dimensions.get('window').width - Spacing.xl * 2;

interface StepState {
  started: boolean;
  completed: boolean;
}

export const ImagePreprocessingScreen: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const { patientInfo, symptoms, imageUri, imagePath, imageData, imageType } = route.params;
  const sourceImagePath = imagePath ?? imageUri;

  const [stepStates, setStepStates] = useState<Record<string, StepState>>(
    Object.fromEntries(
      PREPROCESSING_STEPS.map(s => [s.id, { started: false, completed: false }]),
    ),
  );
  const [processedUri, setProcessedUri] = useState<string | null>(null);
  const [preprocessingId, setPreprocessingId] = useState<string | undefined>();
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Start preprocessing when the screen mounts */
  useEffect(() => {
    const interaction = InteractionManager.runAfterInteractions(() => {
      setIsRunning(true);
      setError(null);
      runPreprocessing(
        {
          base64: imageData,
          mimeType: imageType,
          filePath: sourceImagePath,
        },
        (stepId, completed) => {
          setStepStates(prev => ({
            ...prev,
            [stepId]: { started: true, completed },
          }));
        },
      )
        .then(result => {
          setProcessedUri(result.processedImagePath);
          setPreprocessingId(result.id);
          setIsRunning(false);
          setIsDone(true);
        })
        .catch(err => {
          const message = err instanceof Error ? err.message : 'Unknown preprocessing error';
          setError(`Preprocessing failed: ${message}`);
          setIsRunning(false);
        });
    });

    return () => interaction.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceImagePath, imageUri]);

  const handleContinue = () => {
    navigation.replace('AIClassification', {
      patientInfo,
      symptoms,
      imageUri: processedUri ?? imageUri,
      imagePath: sourceImagePath,
      imageData,
      imageType,
      preprocessingId,
    });
  };

  const renderStepIcon = (step: PreprocessingStep) => {
    const state = stepStates[step.id];
    if (state.completed) return '✓';
    if (state.started) return '•';
    return '○';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => !isRunning && navigation.goBack()}
          disabled={isRunning}>
          <Text style={[styles.backText, isRunning && { opacity: 0.4 }]}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Image Preprocessing</Text>
        <Text style={styles.headerSubtitle}>
          Preparing image for CNN classification
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Image preview */}
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
          />
          {isRunning && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color={Colors.accent} />
              <Text style={styles.processingText}>Processing...</Text>
            </View>
          )}
          {isDone && (
            <View style={styles.doneOverlay}>
              <Text style={styles.doneText}>Preprocessing Complete</Text>
            </View>
          )}
        </View>

        {/* Step cards */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>Processing Pipeline</Text>
          {PREPROCESSING_STEPS.map((step, idx) => {
            const state = stepStates[step.id];
            return (
              <View
                key={step.id}
                style={[
                  styles.stepRow,
                  state.completed && styles.stepRowDone,
                  state.started && !state.completed && styles.stepRowActive,
                  idx === PREPROCESSING_STEPS.length - 1 && styles.stepRowLast,
                ]}>
                <Text style={styles.stepIcon}>{renderStepIcon(step)}</Text>
                <View style={styles.stepContent}>
                  <Text
                    style={[
                      styles.stepLabel,
                      state.completed && styles.stepLabelDone,
                    ]}>
                    {step.label}
                  </Text>
                  <Text style={styles.stepDesc}>{step.description}</Text>
                </View>
                {state.started && !state.completed && (
                  <ActivityIndicator size="small" color={Colors.primary} />
                )}
              </View>
            );
          })}
        </View>

        {/* Done message */}
        {isDone && (
          <View style={styles.doneCard}>
            <Text style={styles.doneCardTitle}>Ready for CNN Analysis</Text>
            <Text style={styles.doneCardText}>
              Image tensor has been prepared as Float32 RGB data with shape
              [1, 224, 224, 3] for EfficientNet classification.
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <AppButton
          label="Continue to AI Classification"
          onPress={handleContinue}
          size="lg"
          disabled={!isDone}
          loading={isRunning}
          style={styles.continueBtn}
        />
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
  },
  backBtn: { marginBottom: Spacing.sm },
  backText: {
    fontSize: Typography.base,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: Typography.medium,
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.75)',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  imageWrapper: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
    position: 'relative',
    ...Shadow.md,
  },
  image: {
    width: IMAGE_PREVIEW_SIZE,
    height: 200,
    borderRadius: Radius.xl,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.xl,
  },
  processingText: {
    color: Colors.white,
    fontSize: Typography.sm,
    marginTop: Spacing.sm,
    fontWeight: Typography.medium,
  },
  doneOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(46, 125, 50, 0.85)',
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  doneText: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
  },
  stepsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.base,
    ...Shadow.card,
  },
  stepsTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    padding: Spacing.base,
    backgroundColor: Colors.primaryUltraLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryLight,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  stepRowLast: { borderBottomWidth: 0 },
  stepRowActive: { backgroundColor: Colors.primaryUltraLight },
  stepRowDone: { backgroundColor: Colors.successLight },
  stepIcon: { fontSize: 20, marginRight: Spacing.md, width: 28 },
  stepContent: { flex: 1 },
  stepLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
  },
  stepLabelDone: { color: Colors.success },
  stepDesc: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  doneCard: {
    backgroundColor: Colors.primaryUltraLight,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    alignItems: 'center',
  },
  doneCardTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.primary,
    marginBottom: 6,
  },
  doneCardText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.sm * 1.6,
  },
  errorCard: {
    backgroundColor: Colors.dangerLight,
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  errorText: {
    fontSize: Typography.sm,
    color: Colors.danger,
    textAlign: 'center',
    lineHeight: Typography.sm * 1.45,
  },
  continueBtn: {},
});
