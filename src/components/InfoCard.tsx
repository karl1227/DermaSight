import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';

interface InfoCardProps {
  icon?: string;           // optional short text label or symbol
  title: string;
  description: string;
  variant?: 'default' | 'tinted' | 'warning' | 'danger' | 'success';
  style?: ViewStyle;
  titleColor?: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  icon,
  title,
  description,
  variant = 'default',
  style,
  titleColor,
}) => {
  const containerStyle = [
    styles.container,
    styles[`variant_${variant}`],
    style,
  ];

  return (
    <View style={containerStyle}>
      {icon ? (
        <View style={styles.iconWrapper}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
      ) : null}
      <View style={styles.content}>
        <Text style={[styles.title, titleColor ? { color: titleColor } : null]}>
          {title}
        </Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  variant_default: {
    backgroundColor: Colors.surface,
  },
  variant_tinted: {
    backgroundColor: Colors.primaryUltraLight,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  variant_warning: {
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    shadowOpacity: 0,
    elevation: 0,
  },
  variant_danger: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    shadowOpacity: 0,
    elevation: 0,
  },
  variant_success: {
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    shadowOpacity: 0,
    elevation: 0,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    flexShrink: 0,
  },
  icon: {
    fontSize: 18,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  description: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sm * 1.55,
  },
});
