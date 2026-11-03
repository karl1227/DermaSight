import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../theme';

interface DisclaimerCardProps {
  type?: 'medical' | 'privacy' | 'educational';
  onReadMore?: () => void;
}

const DISCLAIMER_CONTENT = {
  medical: {
    title: 'Unsure? See a dermatologist',
    text: 'This is a preliminary screening estimate, not a diagnosis. If you are unsure or concerned about the lesion, consult a licensed dermatologist regardless of the result or confidence score—even if it says Low Risk. Do not delay professional assessment because of an app result.',
  },
  privacy: {
    title: 'Privacy Notice',
    text: 'All data is stored locally on your device. No information is transmitted over the internet. DermaSight does not collect, share, or upload any personal or health information.',
  },
  educational: {
    title: 'Educational Use Only',
    text: 'DermaSight is an educational screening tool designed to raise awareness about pigmented skin lesions. It does not replace professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for any health concerns.',
  },
};

export const DisclaimerCard: React.FC<DisclaimerCardProps> = ({
  type = 'medical',
  onReadMore,
}) => {
  const content = DISCLAIMER_CONTENT[type];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{content.title}</Text>
      <Text style={styles.text}>{content.text}</Text>
      {type === 'medical' && (
        <Text style={[styles.text, styles.followUp]}>
          Seek assessment for a new, changing, bleeding or non-healing spot.
        </Text>
      )}
      {onReadMore && (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={onReadMore}
          style={styles.readMore}
          activeOpacity={0.8}
        >
          <Text style={styles.readMoreText}>Read Medical Disclaimer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  followUp: { marginTop: Spacing.sm },
  readMore: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
    minHeight: 44,
    justifyContent: 'center',
  },
  readMoreText: {
    color: Colors.primaryDark,
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    textDecorationLine: 'underline',
  },
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
