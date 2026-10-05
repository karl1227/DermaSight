import { googleIdToken } from '../auth/google';
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
    <TouchableOpacity style={a.back} onPress={() => navigation.goBack()}>
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
        <Text style={a.label}>Purpose</Text>
        <Text style={s.body}>
          DermaSight provides preliminary educational screening of skin lesion
          images using a CNN EfficientNet model trained with HAM10000 and
          TensorFlow Lite inference on this device.
        </Text>
        <Text style={a.label}>Intended use</Text>
        <Text style={s.body}>
          Predictions are not medical diagnoses. Consult a qualified healthcare
          professional about skin changes or concerns. The model can make
          mistakes.
        </Text>
        <Text style={a.label}>Privacy and offline use</Text>
        <Text style={s.body}>
          Screening records and images remain on this device in local storage.
          Signing in sends account information to the account service. Google
          Sign-In sends a Google ID token for verification. No scan images are
          uploaded by this implementation. Internet is needed for new account
          sign-in and profile updates; local screening and saved history remain
          available to guests and valid restored sessions.
        </Text>
        <Text style={s.body}>
          See Privacy & Data Consent and Medical Disclaimer in Settings for the
          existing consent information.
        </Text>
      </View>
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
