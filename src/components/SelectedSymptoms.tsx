import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../theme';
import type { ABCDEAnswers, OtherSymptoms } from '../types';

interface Props {
  abcde: Partial<ABCDEAnswers> | Record<string, boolean>;
  other: Partial<OtherSymptoms> | Record<string, boolean>;
}

export const SelectedSymptoms: React.FC<Props> = ({ abcde, other }) => {
  const abcdeLabels: Record<string, string> = {
    asymmetry: 'A - Asymmetry',
    borderIrregularity: 'B - Border Irregularity',
    colorVariation: 'C - Color Variation',
    diameterLarge: 'D - Diameter > 6mm',
    evolution: 'E - Evolution',
  };

  const symptomLabels: Record<string, string> = {
    pearlyOrWaxyBump: 'Pearly or waxy bump',
    roughOrScalyTexture: 'Rough or scaly texture',
    bleedingOrCrusting: 'Bleeding or crusting',
    firmSmallNodule: 'Firm small nodule',
    dimplingWhenPinched: 'Dimpling when pinched',
    blanchingWhenPressed: 'Blanching when pressed',
    redOrPurpleBump: 'Red or purple bump',
    stableAppearance: 'Stable appearance',
    painOrTenderness: 'Pain or tenderness',
    itching: 'Itching',
  };

  const groups = [
    { title: 'ABCDE Criteria', values: abcde, labels: abcdeLabels },
    { title: 'Other Signs', values: other, labels: symptomLabels },
  ]
    .map(group => ({
      ...group,
      selected: Object.entries(group.values)
        .filter(([, value]) => value === true)
        .map(([key]) => group.labels[key] ?? key),
    }))
    .filter(group => group.selected.length > 0);
  if (!groups.length) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selected Symptoms</Text>
      {groups.map(group => (
        <View key={group.title}>
          <Text style={styles.label}>{group.title}</Text>
          {group.selected.map(sign => (
            <Text key={sign} style={styles.symptom}>
              • {sign}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.md,
  },
  title: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  label: {
    marginTop: Spacing.sm,
    marginBottom: 4,
    fontSize: Typography.xs,
    fontWeight: Typography.semiBold,
    color: Colors.textMuted,
  },
  symptom: {
    fontSize: Typography.sm,
    lineHeight: 21,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
});
