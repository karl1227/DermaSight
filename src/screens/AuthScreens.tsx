import { GoogleEntry } from '../components/GoogleEntry';
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../auth/AuthContext';
import { Sex } from '../auth/types';
import { AccountError } from '../auth/api';
import {
  a,
  AccountScreen,
  AccountButton,
  AccountField,
  AccountColors,
  LineIcon,
  TealGradient,
} from '../components/AccountUI';
type Props = { navigation: NativeStackNavigationProp<RootStackParamList> };
function message(error: unknown) {
  return error instanceof AccountError
    ? error.message
    : 'Could not save your session. Please try again.';
}
export function WelcomeScreen({ navigation }: Props) {
  const auth = useAuth();
  const [error, setError] = useState('');
  return (
    <AccountScreen>
      <View style={s.hero}>
        <View style={s.logo}>
          <TealGradient />
          <LineIcon name="scan" size={46} color="#FFF" />
        </View>
        <Text style={s.brand}>DermaSight</Text>
        <Text style={s.kicker}>AI SKIN LESION SCREENING</Text>
        <Text style={s.description}>
          Preliminary skin lesion screening using CNN EfficientNet and
          TensorFlow Lite. For educational purposes only.
        </Text>
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={a.error}>
          {error}
        </Text>
      ) : null}
      <AccountButton
        label="Sign In"
        icon="signin"
        onPress={() => navigation.navigate('SignIn')}
      />
      <AccountButton
        label="Create Account"
        icon="signup"
        outline
        onPress={() => navigation.navigate('SignUp')}
      />
      <TouchableOpacity
        accessibilityRole="button"
        style={s.guest}
        disabled={auth.busy}
        onPress={() => auth.enterGuest().catch(err => setError(message(err)))}
      >
        <LineIcon name="user" color={AccountColors.muted} size={18} />
        <Text style={a.caption}>Continue as Guest</Text>
      </TouchableOpacity>
      <Text style={s.disclaimer}>
        This app provides preliminary educational screening only. Not a
        substitute for professional medical diagnosis.
      </Text>
    </AccountScreen>
  );
}
function Back({ navigation }: Props) {
  return (
    <TouchableOpacity
      style={a.back}
      accessibilityRole="button"
      onPress={() => navigation.goBack()}
    >
      <LineIcon name="back" size={18} />
      <Text style={a.link}>Back</Text>
    </TouchableOpacity>
  );
}
export function SignInScreen({ navigation }: Props) {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const submit = async () => {
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || !password) {
      setError('Enter a valid email and your password.');
      return;
    }
    try {
      await auth.login(email, password);
    } catch (err) {
      setError(message(err));
    } finally {
      setPassword('');
    }
  };
  return (
    <AccountScreen>
      <Back navigation={navigation} />
      <Text style={a.title}>Welcome back</Text>
      <Text style={a.subtitle}>Sign in to your DermaSight account</Text>
      <AccountField
        label="Email Address"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="emailAddress"
        maxLength={254}
      />
      <AccountField
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secure
        textContentType="password"
        autoCapitalize="none"
        maxLength={128}
      />
      <TouchableOpacity
        style={s.forgot}
        onPress={() =>
          Alert.alert(
            'Password recovery',
            'Password recovery email is not configured yet. Contact your project administrator for account help.',
          )
        }
      >
        <Text style={a.link}>Forgot Password?</Text>
      </TouchableOpacity>
      {error ? (
        <Text accessibilityRole="alert" style={a.error}>
          {error}
        </Text>
      ) : null}
      <AccountButton
        label="Sign In"
        icon="signin"
        onPress={submit}
        busy={auth.busy}
      />
      <View style={s.divider}>
        <View style={s.line} />
        <Text style={s.or}>or</Text>
        <View style={s.line} />
      </View>
      <GoogleEntry onProfile={() => navigation.navigate('SignUp')} />
      <AccountButton
        label="Continue as Guest"
        icon="user"
        outline
        busy={auth.busy}
        onPress={() =>
          auth.state.status === 'guest'
            ? navigation.goBack()
            : auth.enterGuest().catch(err => setError(message(err)))
        }
      />
      <View style={s.switch}>
        <Text style={a.caption}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => navigation.replace('SignUp')}>
          <Text style={a.link}>Create Account</Text>
        </TouchableOpacity>
      </View>
      <Text style={s.notice}>
        Your account saves your profile. Screening images and records remain on
        this device.
      </Text>
    </AccountScreen>
  );
}
export function SignUpScreen({ navigation }: Props) {
  const auth = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [sex, setSex] = useState<Sex | ''>('');
  const [error, setError] = useState('');
  const google = auth.pendingGoogle;
  const linking = google?.mode === 'link';
  useEffect(() => {
    if (google) {
      setName(google.name);
      setEmail(google.email);
      setPassword('');
      setConfirm('');
      setError('');
    }
  }, [google]);
  const cancelGoogle = auth.cancelGoogleSignup;
  useEffect(() => () => cancelGoogle(), [cancelGoogle]);

  const submit = async () => {
    setError('');
    if (!linking && (!name.trim() || !sex)) {
      setError('Enter your full name and sex for your screening profile.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (
      (!google || linking) &&
      (password.length < 8 || password.length > 128)
    ) {
      setError('Use a password of 8–128 characters.');
      return;
    }
    if (!google && password !== confirm) {
      setError('Your passwords do not match.');
      return;
    }
    try {
      if (google) {
        const remaining = await auth.googleLogin(
          google.idToken,
          linking ? undefined : name,
          linking ? undefined : sex || undefined,
          linking ? password : undefined,
        );
        if (remaining) setError('Complete the required fields to continue.');
      } else if (sex) await auth.signup(email, password, name, sex);
    } catch (err) {
      setError(message(err));
    } finally {
      setPassword('');
      setConfirm('');
    }
  };
  return (
    <AccountScreen>
      <Back navigation={navigation} />
      <Text style={a.title}>
        {linking ? 'Connect Google' : 'Create Account'}
      </Text>
      <Text style={a.subtitle}>
        {linking
          ? 'Enter your existing DermaSight password to connect Google to the same account.'
          : google
          ? 'Confirm your details to continue. You can add a password later in Settings → Security.'
          : 'Join DermaSight to save and track your screenings'}
      </Text>
      {!google && <GoogleEntry onProfile={() => {}} />}
      <AccountField
        label="Full Name"
        placeholder="e.g. Maria Santos"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        editable={!linking}
        textContentType="name"
        maxLength={100}
      />
      <AccountField
        label="Email Address"
        placeholder="you@example.com"
        editable={!google}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        maxLength={254}
      />
      {(!google || linking) && (
        <AccountField
          label={linking ? 'Existing Password' : 'Password'}
          placeholder={
            linking ? 'Enter your DermaSight password' : 'Create a password'
          }
          value={password}
          onChangeText={setPassword}
          secure
          textContentType={linking ? 'password' : 'newPassword'}
          autoCapitalize="none"
          maxLength={128}
        />
      )}
      {!google && (
        <AccountField
          label="Confirm Password"
          placeholder="Repeat your password"
          value={confirm}
          onChangeText={setConfirm}
          secure
          textContentType="newPassword"
          autoCapitalize="none"
          maxLength={128}
        />
      )}
      {!linking && (
        <>
          <Text style={a.label}>Sex</Text>
          <View style={s.sexRow}>
            {(['Male', 'Female', 'Other'] as Sex[]).map(option => (
              <TouchableOpacity
                key={option}
                accessibilityRole="radio"
                accessibilityState={{ checked: sex === option }}
                style={[
                  s.sex,
                  sex === option && {
                    borderColor: AccountColors.teal,
                    backgroundColor: '#E7F4F5',
                  },
                ]}
                onPress={() => setSex(option)}
              >
                <Text style={a.caption}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
      {auth.state.status === 'guest' && !linking && (
        <Text style={s.notice}>
          Your current guest screenings will be moved to your new account.
        </Text>
      )}
      {error ? (
        <Text accessibilityRole="alert" style={a.error}>
          {error}
        </Text>
      ) : null}
      <AccountButton
        label={
          linking
            ? 'Connect and Sign In'
            : google
            ? 'Continue'
            : 'Create Account'
        }
        icon="signup"
        onPress={submit}
        busy={auth.busy}
      />
      {google && (
        <TouchableOpacity
          disabled={auth.busy}
          style={s.guest}
          onPress={() => {
            auth.cancelGoogleSignup();
            setName('');
            setEmail('');
            setPassword('');
            setConfirm('');
            setError('');
          }}
        >
          <Text style={a.link}>Use another sign-in method</Text>
        </TouchableOpacity>
      )}
      <View style={s.switch}>
        <Text style={a.caption}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.replace('SignIn')}>
          <Text style={a.link}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </AccountScreen>
  );
}
const s = StyleSheet.create({
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 52,
    minHeight: 340,
  },
  logo: {
    width: 112,
    height: 112,
    borderRadius: 56,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  brand: { fontSize: 36, fontWeight: '600', color: AccountColors.teal },
  kicker: {
    fontSize: 14,
    letterSpacing: 1.5,
    color: AccountColors.cyan,
    marginTop: 10,
  },
  description: {
    fontSize: 15,
    color: AccountColors.muted,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 28,
  },
  guest: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 21,
    color: AccountColors.light,
    textAlign: 'center',
    marginTop: 22,
  },
  forgot: { alignSelf: 'flex-end', marginBottom: 24 },
  divider: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginVertical: 14,
  },
  line: { flex: 1, height: 1, backgroundColor: AccountColors.border },
  or: { color: AccountColors.light },
  switch: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  notice: {
    fontSize: 13,
    color: AccountColors.muted,
    lineHeight: 21,
    textAlign: 'center',
    backgroundColor: '#F2F8F9',
    borderWidth: 1,
    borderColor: AccountColors.border,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  sexRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  sex: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AccountColors.border,
    backgroundColor: '#FFF',
  },
});
