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
  citation: string;
  titleColor: string;
  danger?: boolean;
}

const DISCLAIMERS: DisclaimerItem[] = [
  {
    title: 'Educational Screening Only',
    body: 'Serves as a preliminary awareness tool, not a diagnostic system.',
    citation: 'Vodrahalli et al., 2023',
    titleColor: Colors.primary,
  },
  {
    title: 'No Professional Replacement',
    body: 'Results do not replace clinical consultation or treatment plans from licensed dermatologists.',
    citation: 'Buenaflor, 2026',
    titleColor: Colors.primary,
  },
  {
    title: 'Seek Immediate Care',
    body: 'Consult a doctor immediately if lesions bleed, hurt, or change rapidly.',
    citation: 'Abbasi et al., 2004',
    titleColor: Colors.danger,
    danger: true,
  },
];

export const MedicalDisclaimerScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
      </View>

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
            <View style={styles.bulletRow}>
              <View style={[styles.bulletDot, item.danger && styles.bulletDotDanger]} />
              <Text style={styles.cardBody}>{item.body}</Text>
            </View>
            <Text style={styles.citation}>{item.citation}</Text>
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
  headerBar: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xs,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
    paddingRight: Spacing.md,
  },
  backBtnText: {
    fontSize: Typography.base,
    color: Colors.primary,
    fontWeight: Typography.medium,
  },
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
    backgroundColor: '#FFEEEE',
  },
  cardTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    marginBottom: Spacing.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 7,
    marginRight: 10,
    flexShrink: 0,
  },
  bulletDotDanger: {
    backgroundColor: Colors.danger,
  },
  cardBody: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sm * 1.65,
    flex: 1,
  },
  citation: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#666666',
    marginTop: Spacing.xs,
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
