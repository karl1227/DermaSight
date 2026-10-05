import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Colors, Typography, Spacing } from '../theme';
import {
  AccountScreen,
  AccountColors,
  LineIcon,
  IconName,
  a,
} from '../components/AccountUI';
import { useAuth } from '../auth/AuthContext';
import { deleteLocalImage } from '../services/imageStorageService';
import {
  deleteAllScreenings,
  getAllScreenings,
  historyEnabledFor,
  setHistoryEnabled,
} from '../database/database';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
};

const SettingRow: React.FC<{
  icon: IconName;
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
    accessibilityRole={onPress ? 'button' : undefined}
    activeOpacity={0.75}
  >
    <View
      style={[
        styles.rowIcon,
        { backgroundColor: (color ?? Colors.primary) + '15' },
      ]}
    >
      <LineIcon name={icon} size={21} color={color ?? AccountColors.teal} />
    </View>
    <View style={styles.rowContent}>
      <Text style={[styles.rowLabel, color ? { color } : null]}>{label}</Text>
      {sublabel ? <Text style={styles.rowSublabel}>{sublabel}</Text> : null}
    </View>
    {right ?? <LineIcon name="chevron" size={20} color={AccountColors.light} />}
  </TouchableOpacity>
);

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const auth = useAuth();
  const { owner } = auth;
  const [historyEnabled, setHistoryEnabledValue] = useState(true);

  useEffect(() => {
    if (owner)
      historyEnabledFor(owner)
        .then(setHistoryEnabledValue)
        .catch(() => Alert.alert('Settings unavailable', 'Please try again.'));
  }, [owner]);
  const changeHistory = async (enabled: boolean) => {
    if (!owner) return;
    try {
      await setHistoryEnabled(owner, enabled);
      setHistoryEnabledValue(enabled);
    } catch {
      Alert.alert('Could not save setting', 'Please try again.');
    }
  };
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
              if (!owner) return;
              const records = await getAllScreenings(owner);
              await deleteAllScreenings(owner);
              await Promise.all(
                records.map(record => deleteLocalImage(record.image_path)),
              );
              Alert.alert('Done', 'All screening records have been deleted.');
            } catch {
              Alert.alert(
                'Error',
                'Could not delete records. Please try again.',
              );
            }
          },
        },
      ],
    );
  };

  return (
    <AccountScreen>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={a.back}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <LineIcon name="back" size={18} />
        <Text style={a.link}>Back</Text>
      </TouchableOpacity>
      <Text style={a.title}>Settings</Text>
      <Text style={a.subtitle}>
        Manage your account and screening preferences
      </Text>
      <Text style={styles.groupLabel}>Account</Text>
      <View style={styles.group}>
        <SettingRow
          icon="user"
          label={
            auth.state.status === 'authenticated'
              ? 'Edit Profile'
              : 'Create Account'
          }
          sublabel={
            auth.state.status === 'authenticated'
              ? 'Full name and sex for future screenings'
              : 'Keep your current guest screenings'
          }
          onPress={() =>
            navigation.navigate(
              auth.state.status === 'authenticated' ? 'EditProfile' : 'SignUp',
            )
          }
        />
        <View style={styles.divider} />
        <SettingRow
          icon="shield"
          label="Account Security"
          sublabel="Sign-in method and verification information"
          onPress={() => navigation.navigate('AccountSecurity')}
        />
      </View>
      <Text style={styles.groupLabel}>Screening History</Text>
      <View style={styles.group}>
        <SettingRow
          icon="records"
          label="Enable Screening History"
          sublabel="Save screening records locally"
          right={
            <Switch
              value={historyEnabled}
              onValueChange={changeHistory}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={historyEnabled ? Colors.primary : Colors.textMuted}
            />
          }
        />
        <View style={styles.divider} />
        <SettingRow
          icon="trash"
          label="Delete All Saved Records"
          sublabel="Permanently remove all screening data"
          onPress={handleDeleteAll}
          color={Colors.danger}
        />
      </View>

      <Text style={styles.groupLabel}>Privacy & Legal</Text>
      <View style={styles.group}>
        <SettingRow
          icon="shield"
          label="View Privacy & Data Consent"
          onPress={() => navigation.navigate('SettingsPrivacyConsent')}
        />
        <View style={styles.divider} />
        <SettingRow
          icon="medical"
          label="View Medical Disclaimer"
          onPress={() => navigation.navigate('SettingsMedicalDisclaimer')}
        />
      </View>
      <Text style={styles.groupLabel}>About</Text>
      <View style={styles.group}>
        <SettingRow
          icon="info"
          label="About DermaSight"
          onPress={() => navigation.navigate('About')}
        />
      </View>
      <Text style={styles.groupLabel}>Session</Text>
      <View style={styles.group}>
        <SettingRow
          icon="logout"
          label={auth.state.status === 'guest' ? 'Exit Guest Mode' : 'Sign Out'}
          color={Colors.danger}
          onPress={() =>
            Alert.alert(
              'End session?',
              auth.state.status === 'guest'
                ? 'Create an account first to keep access to this guest history. Exiting closes this session.'
                : 'Your local records are preserved for your next sign-in.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Sign Out',
                  style: 'destructive',
                  onPress: () =>
                    auth
                      .logout()
                      .catch(() =>
                        Alert.alert('Could not sign out', 'Please try again.'),
                      ),
                },
              ],
            )
          }
        />
      </View>
    </AccountScreen>
  );
};

const styles = StyleSheet.create({
  groupLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.semiBold,
    color: AccountColors.light,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    marginTop: Spacing.base,
  },
  group: {
    ...a.card,
    marginBottom: Spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    minHeight: 76,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  rowContent: { flex: 1, marginRight: 12 },
  rowLabel: {
    fontSize: Typography.base,
    color: AccountColors.text,
    fontWeight: Typography.medium,
  },
  rowSublabel: {
    fontSize: Typography.xs,
    color: AccountColors.muted,
    lineHeight: 18,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 56 + Spacing.base,
  },
});
