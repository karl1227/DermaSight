import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { deleteAllScreenings } from '../database/database';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
};

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const [historyEnabled, setHistoryEnabled] = useState(true);

  const handleDeleteAll = () => {
    Alert.alert(
      'Delete All Records',
      'This will permanently delete all saved screening records and cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllScreenings();
              Alert.alert('Done', 'All screening records have been deleted.');
            } catch {
              Alert.alert('Error', 'Could not delete records. Please try again.');
            }
          },
        },
      ],
    );
  };

  const SettingRow: React.FC<{
    icon: string;
    label: string;
    sublabel?: string;
    onPress?: () => void;
    right?: React.ReactNode;
    color?: string;
  }> = ({ icon, label, sublabel, onPress, right, color }) => (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress && !right}
      activeOpacity={0.75}>
      <View style={[styles.rowIcon, { backgroundColor: (color ?? Colors.primary) + '15' }]}>
        <Text style={styles.rowIconText}>{icon}</Text>
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, color ? { color } : null]}>{label}</Text>
        {sublabel ? <Text style={styles.rowSublabel}>{sublabel}</Text> : null}
      </View>
      {right ?? <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Screening History */}
        <Text style={styles.groupLabel}>Screening History</Text>
        <View style={styles.group}>
          <SettingRow
            icon="H"
            label="Enable Screening History"
            sublabel="Save screening records locally"
            right={
              <Switch
                value={historyEnabled}
                onValueChange={setHistoryEnabled}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={historyEnabled ? Colors.primary : Colors.textMuted}
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="D"
            label="Delete All Saved Records"
            sublabel="Permanently remove all screening data"
            onPress={handleDeleteAll}
            color={Colors.danger}
          />
        </View>

        {/* Privacy & Legal */}
        <Text style={styles.groupLabel}>Privacy & Legal</Text>
        <View style={styles.group}>
          <SettingRow
            icon="P"
            label="View Privacy & Data Consent"
            onPress={() => navigation.navigate('PrivacyConsent')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="M"
            label="View Medical Disclaimer"
            onPress={() => navigation.navigate('MedicalDisclaimer')}
          />
        </View>

        {/* About */}
        <Text style={styles.groupLabel}>About</Text>
        <View style={styles.group}>
          <SettingRow
            icon="A"
            label="Application"
            sublabel="SkinSense v1.0.0"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="R"
            label="Research Purpose"
            sublabel="Capstone thesis prototype — educational use only"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="AI"
            label="AI Model"
            sublabel="CNN EfficientNet · HAM10000 · TensorFlow Lite"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="S"
            label="Storage"
            sublabel="SQLite (local) · Local file system"
            onPress={() => {}}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            SkinSense is a capstone thesis prototype for educational
            pigmented skin lesion screening. It is not a licensed medical device.
          </Text>
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
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  backBtn: { marginBottom: Spacing.sm },
  backText: {
    fontSize: Typography.base,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: Typography.medium,
  },
  headerTitle: {
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
    color: Colors.white,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  groupLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.semiBold,
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    marginTop: Spacing.base,
  },
  group: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.card,
    marginBottom: Spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  rowIconText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.primary,
    letterSpacing: 0.3,
  },
  rowContent: { flex: 1 },
  rowLabel: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    fontWeight: Typography.medium,
  },
  rowSublabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: Colors.textMuted,
    fontWeight: Typography.regular,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 56 + Spacing.base,
  },
  footer: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primaryUltraLight,
    borderRadius: Radius.md,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  footerText: {
    fontSize: Typography.xs,
    color: Colors.primary,
    textAlign: 'center',
    lineHeight: Typography.xs * 1.65,
  },
});
