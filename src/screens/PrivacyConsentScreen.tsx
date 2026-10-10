import { returnToDashboard } from '../navigation/screeningFlow';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { useAuth } from '../auth/AuthContext';
import { markFirstRunCompleted } from '../database/database';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PrivacyConsent'>;
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
    body: 'Screening records stay in local SQLite. Images are stored as files on this device. Account profiles are stored by the account service and cached locally.',
    citation: 'DermaSight data handling',
  },
  {
    icon: 'wifi',
    title: 'Offline Processing',
    body: 'TensorFlow Lite executes CNN inferences locally on-device with zero internet reliance.',
    citation: 'DermaSight data handling',
  },
  {
    icon: 'x',
    title: 'Account Connections',
    body: 'Skin images and screening results are not uploaded. Account sign-in sends account details to the account service; Google Sign-In sends an identity token for verification. Internet is needed for account sign-in and profile updates.',
    citation: 'DermaSight data handling',
  },
];

// ─── Small inline icon components ────────────────────────────────────────────

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
          {
            width: s,
            height: s,
            borderRadius: s,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            bottom: i * 3,
          },
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

export const PrivacyConsentScreen: React.FC<Props> = ({ navigation }) => {
  const { completeConsent } = useAuth();
  const handleAgree = async () => {
    try {
      await markFirstRunCompleted();
      completeConsent();
      returnToDashboard(navigation);
    } catch {
      Alert.alert('Could not save consent', 'Please try again.');
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel',
      'You must agree to continue using SkinSense. Go back?',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Go Back', onPress: () => navigation.goBack() },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Shield icon + header */}
        <View style={styles.headerArea}>
          <View style={styles.iconCircle}>
            {/* Shield outline */}
            <View style={styles.shield} />
          </View>
          <Text style={styles.pageTitle}>Privacy & Data Consent</Text>
          <Text style={styles.pageSubtitle}>
            Your data security and privacy matter
          </Text>
        </View>

        {SECTIONS.map(section => {
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

        {/* Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.agreeBtn}
            onPress={handleAgree}
            activeOpacity={0.85}
          >
            <Text style={styles.agreeBtnText}>Agree and Continue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
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
  dbTop: {
    width: 18,
    height: 5,
    borderRadius: 2,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  dbMid: {
    width: 18,
    height: 5,
    borderRadius: 2,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  dbBot: {
    width: 18,
    height: 5,
    borderRadius: 2,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  wifi: {
    width: 18,
    height: 18,
    alignItems: 'center',
    position: 'relative',
  },
  wifiArc: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderTopWidth: 0,
  },
  wifiDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    position: 'absolute',
    bottom: 0,
  },
  xWrapper: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: Typography.bold,
  },
});

// ─── Screen styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: {
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
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    paddingTop: Spacing.xl,
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryUltraLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  shield: {
    width: 28,
    height: 32,
    borderWidth: 2.5,
    borderColor: Colors.primary,
    borderRadius: 6,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  pageTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  pageSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textAlign: 'center',
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
  buttonGroup: {
    marginTop: Spacing.base,
    gap: Spacing.sm,
  },
  agreeBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingVertical: 18,
    alignItems: 'center',
  },
  agreeBtnText: {
    fontSize: Typography.md,
    fontWeight: Typography.semiBold,
    color: Colors.white,
  },
  cancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: Typography.base,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
  },
});
