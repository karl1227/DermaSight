import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../theme';

interface DisclaimerCardProps {
  type?: 'medical' | 'privacy' | 'educational';
}

const DISCLAIMER_CONTENT = {
  medical: {
    title: 'Medical Disclaimer',
    text: 'This result is not a medical diagnosis. The confidence score only represents the model\'s certainty based on image features and checklist inputs — not clinical certainty. Only a licensed dermatologist can confirm any skin condition through proper clinical evaluation. SkinSense is designed for preliminary educational screening only.',
  },
  privacy: {
    title: 'Privacy Notice',
    text: 'All data is stored locally on your device. No information is transmitted over the internet. SkinSense does not collect, share, or upload any personal or health information.',
  },
  educational: {
    title: 'Educational Use Only',
    text: 'SkinSense is an educational screening tool designed to raise awareness about pigmented skin lesions. It does not replace professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for any health concerns.',
  },
};

export const DisclaimerCard: React.FC<DisclaimerCardProps> = ({
  type = 'medical',
}) => {
  const content = DISCLAIMER_CONTENT[type];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{content.title}</Text>
      <Text style={styles.text}>{content.text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.warningLight,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  title: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.warning,
    marginBottom: Spacing.sm,
  },
  text: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sm * 1.6,
  },
});
