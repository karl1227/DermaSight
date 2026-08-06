import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';

export type RiskLevel = 'high' | 'precancerous' | 'benign';

interface LesionClassCardProps {
  name: string;
  abbreviation: string;
  riskLevel: RiskLevel;
  description: string;
  commonSigns: string[];
}

const RISK_COLORS: Record<RiskLevel, string> = {
  high: Colors.danger,
  precancerous: Colors.warning,
  benign: Colors.success,
};

const RISK_BG: Record<RiskLevel, string> = {
  high: Colors.dangerLight,
  precancerous: Colors.warningLight,
  benign: Colors.successLight,
};

const RISK_LABELS: Record<RiskLevel, string> = {
  high: 'High Concern',
  precancerous: 'Precancerous',
  benign: 'Generally Benign',
};

export const LesionClassCard: React.FC<LesionClassCardProps> = ({
  name,
  abbreviation,
  riskLevel,
  description,
  commonSigns,
}) => {
  const [expanded, setExpanded] = useState(false);
  const dotColor = RISK_COLORS[riskLevel];
  const bgColor = RISK_BG[riskLevel];

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: dotColor }]}
      onPress={() => setExpanded(prev => !prev)}
      activeOpacity={0.85}>
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <View style={styles.headerText}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.abbr}>{abbreviation}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: bgColor }]}>
          <Text style={[styles.badgeText, { color: dotColor }]}>
            {RISK_LABELS[riskLevel]}
          </Text>
        </View>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </View>

      {expanded && (
        <View style={styles.expandedContent}>
          <Text style={styles.description}>{description}</Text>
          <Text style={styles.signsTitle}>Common Signs:</Text>
          {commonSigns.map((sign, idx) => (
            <View key={idx} style={styles.signRow}>
              <View style={[styles.signDot, { backgroundColor: dotColor }]} />
              <Text style={styles.signText}>{sign}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderLeftWidth: 4,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.md,
    flexShrink: 0,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
  },
  abbr: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    marginRight: Spacing.sm,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: Typography.semiBold,
  },
  chevron: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  expandedContent: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  description: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  signsTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  signRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  signDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 7,
    marginRight: 8,
    flexShrink: 0,
  },
  signText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 19,
  },
});
