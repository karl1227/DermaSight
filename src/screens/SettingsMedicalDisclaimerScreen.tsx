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
  navigation: NativeStackNavigationProp<RootStackParamList, 'SettingsMedicalDisclaimer'>;
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

export const SettingsMedicalDisclaimerScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backChevron}>‹</Text>
          <Text style={styles.headerTitle}>Medical Disclaimer</Text>
        </TouchableOpacity>
        <Text style={styles.headerSubtitle}>Read before using DermaSight</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

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
            style={styles.doneBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  backChevron: {
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
    color: Colors.white,
    lineHeight: Typography.xxl,
    marginTop: -2,
  },
  headerTitle: {
    fontSize: Typography.xxl,
    fontWeight: Typography.extraBold,
    color: Colors.white,
    flex: 1,
  },
  headerSubtitle: {
    fontSize: Typography.base,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: Typography.base * 1.5,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
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
    marginTop: Spacing.base,
  },
  doneBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingVertical: 18,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: Typography.md,
    fontWeight: Typography.semiBold,
    color: Colors.white,
  },
});
