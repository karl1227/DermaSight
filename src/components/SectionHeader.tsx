import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing } from '../theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  style?: ViewStyle;
  centered?: boolean;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  style,
  centered = false,
}) => {
  return (
    <View style={[styles.container, centered && styles.centered, style]}>
      <Text style={[styles.title, centered && styles.titleCentered]}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, centered && styles.subtitleCentered]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.base,
  },
  centered: {
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    lineHeight: Typography.lg * 1.3,
  },
  titleCentered: {
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    lineHeight: Typography.sm * 1.5,
  },
  subtitleCentered: {
    textAlign: 'center',
  },
});
