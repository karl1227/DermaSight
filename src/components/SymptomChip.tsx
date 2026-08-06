import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../theme';

interface SymptomChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  type?: 'symptom' | 'location';
}

export const SymptomChip: React.FC<SymptomChipProps> = ({
  label,
  selected,
  onPress,
  type = 'symptom',
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        type === 'location' && styles.locationChip,
        selected && styles.chipSelected,
        selected && type === 'location' && styles.locationChipSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.75}>
      {selected && (
        <View style={styles.checkDot} />
      )}
      <Text
        style={[
          styles.label,
          selected && styles.labelSelected,
        ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  locationChip: {
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: Spacing.base,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  locationChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  checkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.white,
    marginRight: 6,
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.textSecondary,
  },
  labelSelected: {
    color: Colors.white,
    fontWeight: Typography.semiBold,
  },
});
