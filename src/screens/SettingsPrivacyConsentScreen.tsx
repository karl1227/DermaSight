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
  navigation: NativeStackNavigationProp<RootStackParamList, 'SettingsPrivacyConsent'>;
};

interface Section {
  title: string;
  icon: 'db' | 'wifi' | 'x';
  body: string;
  citation: string;
}

const SECTIONS: Section[] = [
  {
    icon: 'db',
    title: 'On-Device Storage',
    body: 'Profiles, logs, and captured images are stored purely in local SQLite storage.',
    citation: 'ISO/IEC 25010',
  },
  {
    icon: 'wifi',
    title: 'Offline Processing',
    body: 'TensorFlow Lite executes CNN inferences locally on-device with zero internet reliance.',
    citation: 'ISO/IEC 25010',
  },
  {
    icon: 'x',
    title: 'Zero Server Uploads',
    body: 'No cloud backups, third-party tracking, or external server data transfers occur.',
    citation: 'RA 10173 Data Privacy Act',
  },
];

// ─── Icon components ──────────────────────────────────────────────────────────

const DbIcon = () => (
  <View style={iconS.db}>
    <View style={iconS.dbTop} />
    <View style={iconS.dbMid} />
    <View style={iconS.dbBot} />
  </View>
);

const WifiIcon = () => (
  <View style={iconS.wifi}>
    {[14, 10, 6].map((s, i) => (
      <View
        key={i}
        style={[
          iconS.wifiArc,
          { width: s, height: s, borderRadius: s, borderTopLeftRadius: 0, borderTopRightRadius: 0, bottom: i * 3 },
          i === 0 && { opacity: 0.3 },
          i === 1 && { opacity: 0.6 },
        ]}
      />
    ))}
    <View style={iconS.wifiDot} />
  </View>
);

const XIcon = () => (
  <View style={iconS.xWrapper}>
    <Text style={iconS.xText}>✕</Text>
  </View>
);

const ICONS = { db: DbIcon, wifi: WifiIcon, x: XIcon };

export const SettingsPrivacyConsentScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backChevron}>‹</Text>
          <Text style={styles.headerTitle}>Privacy & Data Consent</Text>
        </TouchableOpacity>
        <Text style={styles.headerSubtitle}>Your data security and privacy matter</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {SECTIONS.map((section) => {
          const Icon = ICONS[section.icon];
          return (
            <View key={section.title} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconWrapper}>
                  <Icon />
                </View>
                <Text style={styles.cardTitle}>{section.title}</Text>
              </View>
              <View style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{section.body}</Text>
              </View>
              <Text style={styles.citation}>{section.citation}</Text>
            </View>
          );
        })}

        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// ─── Icon styles ──────────────────────────────────────────────────────────────

const iconS = StyleSheet.create({
  db: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  dbTop: { width: 18, height: 5, borderRadius: 2, borderWidth: 1.5, borderColor: Colors.primary },
  dbMid: { width: 18, height: 5, borderRadius: 2, borderWidth: 1.5, borderColor: Colors.primary },
  dbBot: { width: 18, height: 5, borderRadius: 2, borderWidth: 1.5, borderColor: Colors.primary },
  wifi: { width: 18, height: 18, alignItems: 'center', position: 'relative' },
  wifiArc: { position: 'absolute', borderWidth: 2, borderColor: Colors.primary, borderTopWidth: 0 },
  wifiDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.primary, position: 'absolute', bottom: 0 },
  xWrapper: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  xText: { fontSize: 14, color: Colors.textMuted, fontWeight: Typography.bold },
});

// ─── Screen styles ────────────────────────────────────────────────────────────

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
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    paddingTop: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primaryUltraLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  cardTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.primary,
  },
  cardPreamble: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sm * 1.6,
    marginBottom: Spacing.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
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
  bulletText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  citation: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#666666',
    marginTop: Spacing.xs,
  },
  doneBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: Spacing.base,
  },
  doneBtnText: {
    fontSize: Typography.md,
    fontWeight: Typography.semiBold,
    color: Colors.white,
  },
});
