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
            <Text style={styles.cardBody}>{item.body}</Text>
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
