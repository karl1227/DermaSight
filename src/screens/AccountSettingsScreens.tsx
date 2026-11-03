import {
  ABOUT_SUMMARY,
  PROJECT_OPERATORS,
  PROJECT_INSTITUTION,
} from '../content/information';
import { googleIdToken } from '../auth/google';
import { PolicyLink } from '../components/PolicyLink';
import { backToSettings } from '../navigation/screeningFlow';
import React, { useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  Linking,
  StyleSheet,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../auth/AuthContext';
import { Sex } from '../auth/types';
import { AccountError } from '../auth/api';
import {
  AccountScreen,
  AccountField,
  AccountButton,
  a,
  AccountColors,
} from '../components/AccountUI';
type Props = { navigation: NativeStackNavigationProp<RootStackParamList> };
function Back({ navigation }: Props) {
  return (
    <TouchableOpacity style={a.back} onPress={() => backToSettings(navigation)}>
      <Text style={a.link}>‹ Back</Text>
    </TouchableOpacity>
  );
}
export function EditProfileScreen({ navigation }: Props) {
  const auth = useAuth();
  const user = auth.state.status === 'authenticated' ? auth.state.user : null;
  const [name, setName] = useState(user?.name ?? '');
  const [sex, setSex] = useState<Sex>(user?.sex ?? 'Other');
  const [error, setError] = useState('');
  return (
    <AccountScreen>
      <Back navigation={navigation} />
      <Text style={a.title}>Edit Profile</Text>
      <Text style={a.subtitle}>
        These values will populate future screenings. Saved reports keep their
        original information.
      </Text>
      {user ? (
        <>
          <AccountField
            label="Full Name"
            value={name}
            onChangeText={setName}
            maxLength={100}
          />
          <Text style={a.label}>Sex</Text>
          <View style={s.options}>
            {(['Male', 'Female', 'Other'] as Sex[]).map(value => (
              <TouchableOpacity
                key={value}
                accessibilityRole="radio"
                accessibilityState={{ checked: sex === value }}
                onPress={() => setSex(value)}
                style={[s.option, sex === value && s.selected]}
              >
                <Text style={a.caption}>{value}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.body}>Email: {user.email}</Text>
          {error ? (
            <Text style={a.error} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}
          <AccountButton
            label="Save Profile"
            busy={auth.busy}
            onPress={async () => {
              setError('');
              if (!name.trim()) {
                setError('Full name is required.');
                return;
              }
              try {
                await auth.updateProfile(name, sex);
                navigation.goBack();
              } catch (err) {
                setError(
                  err instanceof AccountError
                    ? err.message
                    : 'Could not update your profile. Please try again.',
                );
              }
            }}
          />
        </>
      ) : (
        <Text style={s.body}>
          Sign in to edit an account profile. Guest details are entered for each
          screening.
        </Text>
      )}
    </AccountScreen>
  );
}
export function SecurityScreen({ navigation }: Props) {
  const auth = useAuth();
  const { state } = auth;
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [error, setError] = useState('');
  const methods =
    state.status === 'authenticated'
      ? state.user.authenticationMethods
      : undefined;
  return (
    <AccountScreen>
      <Back navigation={navigation} />
      <Text style={a.title}>Account Security</Text>
      <Text style={a.subtitle}>Your sign-in and session protection</Text>
      <View style={[a.card, s.card]}>
        <Text style={a.label}>Sign-in method</Text>
        <Text style={s.body}>
          {state.status === 'guest'
            ? 'Guest session — no registered account'
            : methods?.includes('google')
            ? methods.includes('password')
              ? 'Google Sign-In and email/password'
              : 'Google Sign-In'
            : 'Email and password'}
        </Text>
        {methods?.includes('google') && !methods.includes('password') && (
          <>
            <Text style={a.label}>Enable email sign-in</Text>
            <Text style={s.body}>
              Add a DermaSight password to sign in manually with the same email
              and records. This is separate from your Google password.
            </Text>
            <AccountField
              label="New Password"
              value={password}
              onChangeText={setPassword}
              secure
              maxLength={128}
              textContentType="newPassword"
              autoCapitalize="none"
            />
            <AccountField
              label="Confirm Password"
              value={confirm}
              onChangeText={setConfirm}
              secure
              maxLength={128}
              textContentType="newPassword"
              autoCapitalize="none"
            />
            <AccountButton
              label="Add Password"
              busy={auth.busy || passwordBusy}
              onPress={async () => {
                setError('');
                if (
                  password.length < 8 ||
                  password.length > 128 ||
                  password !== confirm
                ) {
                  setError('Use 8–128 characters and matching passwords.');
                  return;
                }
                setPasswordBusy(true);
                try {
                  const token = await googleIdToken();
                  if (token) await auth.addPassword(token, password);
                } catch (err) {
                  setError(
                    err instanceof AccountError
                      ? err.message
                      : 'Could not add a password. Try again.',
                  );
                } finally {
                  setPassword('');
                  setConfirm('');
                  setPasswordBusy(false);
                }
              }}
            />
          </>
        )}
        <Text style={a.label}>Two-step verification</Text>
        <Text style={s.body}>
          DermaSight does not currently enforce a second factor. Google may
          request verification based on your Google account settings. Your
          DermaSight session does not prove that a second factor was used.
        </Text>
        <AccountButton
          outline
          label="Google security settings"
          onPress={() =>
            Linking.openURL('https://myaccount.google.com/security').catch(() =>
              setError('Could not open Google security settings.'),
            )
          }
        />
        <Text style={s.body}>
          Email accounts use salted password hashes on the account server.
          Session credentials are stored in the phone’s secure credential
          storage. Sign out on shared devices.
        </Text>
      </View>
      {error ? <Text style={a.error}>{error}</Text> : null}
    </AccountScreen>
  );
}
export function AboutScreen({ navigation }: Props) {
  return (
    <AccountScreen>
      <Back navigation={navigation} />
      <Text style={a.title}>About DermaSight</Text>
      <Text style={a.subtitle}>AI skin lesion screening · v1.0</Text>
      <View style={[a.card, s.card]}>
        <Text style={s.body}>{ABOUT_SUMMARY}</Text>
        <Text style={s.body}>
          Users can record personal screening information, lesion location,
          symptoms, occupation and sunburn history.
        </Text>
        <Text style={a.label}>Offline</Text>
        <Text style={s.body}>
          Guest screenings and locally saved account records stay on this
          device.
        </Text>
        <Text style={a.label}>Online</Text>
        <Text style={s.body}>
          Users can register or sign in through the project account server.
          Screening records still remain on the phone. Cloud storage is planned
          and not enabled.
        </Text>
        <Text style={s.body}>
          Results are screening estimates—not medical diagnoses, severity
          assessments or cancer stages. Consult a licensed dermatologist about
          concerning skin changes.
        </Text>
        <Text style={a.label}>Project Team</Text>
        <Text style={s.body}>
          {PROJECT_OPERATORS} of the {PROJECT_INSTITUTION}.
        </Text>
      </View>
      <PolicyLink kind="about" />
      <PolicyLink kind="privacy" />
      <PolicyLink kind="medical-disclaimer" />
      <PolicyLink kind="about" anchor="references" />
    </AccountScreen>
  );
}
const s = StyleSheet.create({
  card: { padding: 20 },
  body: {
    color: AccountColors.muted,
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 22,
  },
  options: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  option: {
    flex: 1,
    borderWidth: 1,
    borderColor: AccountColors.border,
    padding: 12,
    borderRadius: 12,
  },
  selected: { borderColor: AccountColors.teal, backgroundColor: '#E7F4F5' },
});
