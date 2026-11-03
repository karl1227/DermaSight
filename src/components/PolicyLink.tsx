import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography } from '../theme';
import { LineIcon } from './AccountUI';
import { openPolicy } from '../services/policyLinks';

export function PolicyLink({
  kind,
  anchor,
}: {
  kind: 'privacy' | 'medical-disclaimer' | 'about';
  anchor?: 'references';
}) {
  return (
    <TouchableOpacity
      accessibilityRole="link"
      style={styles.link}
      onPress={() => openPolicy(kind, anchor)}
    >
      <LineIcon name="info" size={20} />
      <Text style={styles.text}>
        {anchor === 'references'
          ? 'View references'
          : kind === 'privacy'
          ? 'Read full Privacy & Data Consent'
          : kind === 'about'
          ? 'Read more about DermaSight'
          : 'Read full Medical Disclaimer'}{' '}
        (opens browser)
      </Text>
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.base,
    marginBottom: Spacing.md,
  },
  text: {
    flex: 1,
    color: Colors.primary,
    fontSize: Typography.base,
    textDecorationLine: 'underline',
  },
});
