import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Colors, Typography, Spacing, Radius } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MedicalDisclaimer'>;
};

interface DisclaimerItem {
  title: string;
  body: string;
  titleColor: string;
  danger?: boolean;
}

const DISCLAIMERS: DisclaimerItem[] = [
  {
    title: 'Educational Use Only',
    body: 'DermaSight provides preliminary educational screening only. It is designed to raise awareness about pigmented skin lesions.',
    titleColor: Colors.primary,
  },
  {
    title: 'Not a Medical Diagnosis',
    body: 'This application does not diagnose any medical condition. Results are for informational purposes and should not replace professional medical advice.',
    titleColor: Colors.primary,
  },
  {
    title: 'Consult Licensed Professionals',
    body: 'The app does not replace consultations with licensed dermatologists or healthcare providers. Always seek professional medical evaluation.',
    titleColor: Colors.primary,
  },
  {
    title: 'Seek Immediate Care If:',
    body: 'The lesion is bleeding, painful, rapidly changing, or appears suspicious. Do not wait for screening results.',
    titleColor: Colors.danger,
    danger: true,
  },
  {
    title: 'No Treatment Recommendations',
    body: 'DermaSight does not provide treatment plans, medication advice, or therapeutic recommendations of any kind.',
    titleColor: Colors.primary,
  },
];

export const MedicalDisclaimerScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Warning icon */}
        <View style={styles.iconWrapper}>
          <View style={styles.iconCircle}>
            {/* Triangle warning */}
            <View style={styles.triangle} />
            <Text style={styles.exclamation}>!</Text>
          </View>
        </View>

        <Text style={styles.pageTitle}>Medical Safety Disclaimer</Text>

        {DISCLAIMERS.map((item, idx) => (
          <View
            key={idx}
            style={[styles.card, item.danger && styles.cardDanger]}>
            <Text style={[styles.cardTitle, { color: item.titleColor }]}>
              {item.title}
            </Text>
            <Text style={styles.cardBody}>{item.body}</Text>
          </View>
        ))}

        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => navigation.navigate('PrivacyConsent')}
            activeOpacity={0.85}>
            <Text style={styles.continueBtnText}>I Understand, Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    alignItems: 'center',
  },
  iconWrapper: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triangle: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 16,
    borderRightWidth: 16,
    borderBottomWidth: 28,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: Colors.danger,
    top: 16,
  },
  exclamation: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.white,
    position: 'absolute',
    top: 28,
  },
  pageTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    alignSelf: 'stretch',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardDanger: {
    borderColor: '#FFCDD2',
    backgroundColor: '#FFFBFB',
  },
  cardTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    marginBottom: Spacing.sm,
  },
  cardBody: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sm * 1.65,
  },
  bottomButtons: {
    alignSelf: 'stretch',
    marginTop: Spacing.base,
  },
  continueBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingVertical: 18,
    alignItems: 'center',
  },
  continueBtnText: {
    fontSize: Typography.md,
    fontWeight: Typography.semiBold,
    color: Colors.white,
  },
});
