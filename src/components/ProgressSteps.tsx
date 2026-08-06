import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../theme';

interface ProgressStepsProps {
  steps: string[];
  currentStep: number; // 0-indexed
}

export const ProgressSteps: React.FC<ProgressStepsProps> = ({
  steps,
  currentStep,
}) => {
  return (
    <View style={styles.container}>
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStep;
        const isActive = idx === currentStep;
        return (
          <React.Fragment key={step}>
            <View style={styles.stepWrapper}>
              <View
                style={[
                  styles.circle,
                  isCompleted && styles.circleCompleted,
                  isActive && styles.circleActive,
                ]}>
                <Text
                  style={[
                    styles.circleText,
                    (isCompleted || isActive) && styles.circleTextActive,
                  ]}>
                  {isCompleted ? '✓' : idx + 1}
                </Text>
              </View>
              <Text
                style={[
                  styles.label,
                  isActive && styles.labelActive,
                  isCompleted && styles.labelCompleted,
                ]}>
                {step}
              </Text>
            </View>
            {idx < steps.length - 1 && (
              <View
                style={[
                  styles.connector,
                  isCompleted && styles.connectorCompleted,
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  stepWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  circleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  circleCompleted: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  circleText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.textMuted,
  },
  circleTextActive: {
    color: Colors.white,
  },
  label: {
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: 'center',
    fontWeight: Typography.medium,
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: Typography.bold,
  },
  labelCompleted: {
    color: Colors.primaryDark,
  },
  connector: {
    height: 2,
    flex: 0.5,
    backgroundColor: Colors.border,
    marginBottom: 20,
    marginHorizontal: -4,
  },
  connectorCompleted: {
    backgroundColor: Colors.primary,
  },
});
