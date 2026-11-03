import React from 'react';
import {
  Alert,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { AppCard } from './AppCard';
import { LESION_CLASSES, LESION_SOURCES } from '../content/lesionEducation';
import { CLASSIFIER_CONFIDENCE_THRESHOLD } from '../config/classifier';
import { Colors, Spacing, Typography } from '../theme';
import { formatConfidence } from '../utils';

interface Props {
  lesion: string;
  confidence: number;
}

export const LesionExplanationCard: React.FC<Props> = ({
  lesion,
  confidence,
}) => {
  const education = LESION_CLASSES.find(item => item.name === lesion);
  const source = LESION_SOURCES[lesion];
  const lowConfidence = confidence < CLASSIFIER_CONFIDENCE_THRESHOLD;

  return (
    <AppCard variant="bordered" style={styles.card}>
      <Text style={styles.title}>Lesion Information</Text>
      <Text style={styles.label}>Predicted lesion</Text>
      <Text style={styles.lesion}>{lesion}</Text>
      <Text style={styles.label}>Description</Text>
      <Text style={styles.body}>
        {education?.description ||
          'An educational description is not available for this saved label.'}
      </Text>
      <Text style={styles.label}>Basis of this prediction</Text>
      <Text style={styles.body}>
        EfficientNet assigned {lesion} the highest score among the seven
        supported lesion classes ({formatConfidence(confidence)}). This is a
        model score, not the probability that you have this condition or cancer.
      </Text>
      {lowConfidence && (
        <Text style={styles.warning}>
          This score is below the app’s {CLASSIFIER_CONFIDENCE_THRESHOLD}%
          threshold. Treat this prediction as uncertain.
        </Text>
      )}
      {education && (
        <>
          <Text style={styles.label}>Common features of this lesion type</Text>
          <Text style={styles.body}>
            These are general reference features, not findings confirmed in your
            photo.
          </Text>
          {education.commonSigns.map(sign => (
            <Text key={sign} style={styles.feature}>
              • {sign}
            </Text>
          ))}
        </>
      )}
      <Text style={styles.note}>
        The model does not report which specific features caused its prediction.
        A single photo cannot confirm changes over time, texture, or a
        diagnosis. See a dermatologist if you are unsure or notice changes,
        regardless of this result.
      </Text>
      {source && (
        <TouchableOpacity
          accessibilityRole="link"
          onPress={() =>
            Linking.openURL(source).catch(() =>
              Alert.alert(
                'Could not open reference',
                'Check your internet connection and try again.',
              ),
            )
          }
        >
          <Text style={styles.link}>
            Read the clinical reference on DermNet
          </Text>
        </TouchableOpacity>
      )}
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.base },
  title: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  label: {
    marginTop: Spacing.md,
    marginBottom: 5,
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
  },
  lesion: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  body: {
    fontSize: Typography.sm,
    lineHeight: 21,
    color: Colors.textSecondary,
  },
  feature: {
    fontSize: Typography.sm,
    lineHeight: 21,
    color: Colors.textSecondary,
    marginTop: 5,
  },
  warning: {
    fontSize: Typography.sm,
    lineHeight: 21,
    color: Colors.warning,
    marginTop: Spacing.sm,
  },
  note: {
    fontSize: Typography.sm,
    lineHeight: 21,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  link: {
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: Typography.semiBold,
    paddingVertical: Spacing.md,
  },
});
