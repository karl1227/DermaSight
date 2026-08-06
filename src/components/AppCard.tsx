import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing, Shadow } from '../theme';

interface AppCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'flat' | 'tinted' | 'bordered';
  padding?: number;
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  style,
  variant = 'default',
  padding = Spacing.base,
}) => {
  return (
    <View
      style={[
        styles.base,
        styles[`variant_${variant}`],
        { padding },
        style,
      ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
  },
  variant_default: {
    ...Shadow.card,
  },
  variant_elevated: {
    ...Shadow.md,
  },
  variant_flat: {
    backgroundColor: Colors.surfaceAlt,
  },
  variant_tinted: {
    backgroundColor: Colors.primaryUltraLight,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  variant_bordered: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
});
