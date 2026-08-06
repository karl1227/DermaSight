import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppCard } from './AppCard';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { ClassificationResult } from '../types';
import { formatConfidence } from '../utils';

interface ResultBasisCardProps {
  result: ClassificationResult;
}

export const ResultBasisCard: React.FC<ResultBasisCardProps> = ({ result }) => {
  const isAboveThreshold = result.thresholdStatus === 'Above Threshold';

  return (
    <AppCard variant="bordered" style={styles.card}>
      <Text style={styles.sectionTitle}>Result Basis & Threshold</Text>

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Predicted Lesion Type</Text>
        <Text style={styles.rowValue}>{result.predictedLesionType}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Confidence Score</Text>
        <Text style={styles.rowValue}>{formatConfidence(result.confidenceScore)}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Threshold Rule</Text>
        <Text style={styles.rowValue}>≥ 70% for classification</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Threshold Status</Text>
        <View
          style={[
            styles.badge,
            isAboveThreshold ? styles.badgeSuccess : styles.badgeWarning,
          ]}>
          <Text
            style={[
              styles.badgeText,
              isAboveThreshold ? styles.badgeTextSuccess : styles.badgeTextWarning,
            ]}>
            {result.thresholdStatus}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <Text style={styles.basisLabel}>Matching Visual Features</Text>
      {result.matchingVisualFeatures.map((feature, idx) => (
        <View key={idx} style={styles.featureRow}>
          <View style={styles.featureDot} />
          <Text style={styles.featureText}>{feature}</Text>
        </View>
      ))}

      <View style={styles.divider} />

      <Text style={styles.basisLabel}>Recommendation Basis</Text>
      <Text style={styles.basisText}>{result.recommendationBasis}</Text>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  rowLabel: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  rowValue: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 4,
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  badgeSuccess: {
    backgroundColor: Colors.successLight,
  },
  badgeWarning: {
    backgroundColor: Colors.warningLight,
  },
  badgeText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semiBold,
  },
  badgeTextSuccess: { color: Colors.success },
  badgeTextWarning: { color: Colors.warning },
  basisLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
    marginBottom: 6,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  featureDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 6,
    marginRight: 8,
  },
  featureText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  basisText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
