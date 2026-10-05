import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  TextInputProps,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Path,
  Circle,
} from 'react-native-svg';
export const AccountColors = {
  teal: '#0B7B80',
  cyan: '#10A7B6',
  text: '#1C1B33',
  muted: '#647895',
  light: '#94A6BF',
  border: '#D0E4E7',
};
export type IconName =
  | 'user'
  | 'signup'
  | 'signin'
  | 'logout'
  | 'eye'
  | 'mail'
  | 'records'
  | 'analytics'
  | 'settings'
  | 'shield'
  | 'scan'
  | 'back'
  | 'chevron'
  | 'trash'
  | 'info'
  | 'medical'
  | 'home';
const paths: Record<IconName, string> = {
  user: 'M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2',
  signup: 'M16 21v-2a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v2 M20 8v6 M17 11h6',
  signin: 'M14 3h5v18h-5 M3 12h12 M10 7l5 5-5 5',
  logout: 'M10 3H5v18h5 M10 12h12 M17 7l5 5-5 5',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7',
  mail: 'M3 5h18v14H3z M3 5l9 7 9-7',
  records: 'M8 4H5v17h14V4h-3 M8 2h8v4H8z M8 10h8 M8 14h8 M8 18h5',
  analytics: 'M5 21V12 M12 21V3 M19 21V8',
  settings: 'M9 3h6l1 4 4 1 1 6-4 2-1 4H9l-1-4-4-1-1-6 4-2z',
  shield: 'M12 2l8 4v6c0 6-8 10-8 10S4 18 4 12V6z',
  scan: 'M3 8V3h5 M16 3h5v5 M21 16v5h-5 M8 21H3v-5',
  back: 'M15 4l-8 8 8 8',
  chevron: 'M9 5l7 7-7 7',
  trash: 'M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7',
  info: 'M12 10v7 M12 7h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  medical: 'M8 3h8v5h5v8h-5v5H8v-5H3V8h5z',
  home: 'M3 11l9-8 9 8v10h-7v-7h-4v7H3z',
};
export function LineIcon({
  name,
  color = AccountColors.teal,
  size = 22,
}: {
  name: IconName;
  color?: string;
  size?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d={paths[name]} />
      {(name === 'user' || name === 'signup') && (
        <Circle cx={name === 'signup' ? 10 : 12} cy={6} r={4} />
      )}
      {name === 'eye' && <Circle cx={12} cy={12} r={3} />}
      {name === 'settings' && <Circle cx={12} cy={12} r={3} />}
    </Svg>
  );
}
export function TealGradient() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="teal" x1="0%" y1="0%" x2="100%" y2="70%">
            <Stop stopColor={AccountColors.teal} />
            <Stop offset="1" stopColor={AccountColors.cyan} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#teal)" />
      </Svg>
    </View>
  );
}
export function AccountScreen({ children }: { children: React.ReactNode }) {
  return (
    <View style={a.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#E8F3F4" />
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id="page" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop stopColor="#E7F2F3" />
            <Stop offset="1" stopColor="#FFFFFF" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#page)" />
      </Svg>
      <SafeAreaView style={a.container} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={a.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={a.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
export function AccountButton({
  label,
  icon,
  onPress,
  busy,
  outline,
  danger,
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  busy?: boolean;
  outline?: boolean;
  danger?: boolean;
}) {
  const color = danger ? '#FF343E' : outline ? AccountColors.teal : '#FFF';
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={busy}
      onPress={onPress}
      style={[
        a.button,
        outline && a.outline,
        danger && a.danger,
        busy && { opacity: 0.65 },
      ]}
      activeOpacity={0.8}
    >
      {!outline && !danger && <TealGradient />}
      {busy ? (
        <ActivityIndicator color={color} />
      ) : (
        <>
          {icon && <LineIcon name={icon} color={color} />}
          <Text style={[a.buttonText, { color }]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
export function AccountField({
  label,
  secure,
  ...props
}: TextInputProps & { label: string; secure?: boolean }) {
  const [hidden, setHidden] = React.useState(true);
  return (
    <View style={a.field}>
      <Text style={a.label}>{label}</Text>
      <View style={a.inputWrap}>
        <TextInput
          {...props}
          accessibilityLabel={label}
          style={[a.input, props.style]}
          placeholderTextColor="#C4D1E2"
          secureTextEntry={secure && hidden}
        />
        {secure && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            onPress={() => setHidden(!hidden)}
            style={{ padding: 14 }}
          >
            <LineIcon name="eye" color={AccountColors.light} size={20} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
export const a = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, padding: 24, paddingBottom: 32 },
  title: {
    fontSize: 26,
    fontWeight: '600',
    color: AccountColors.teal,
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    color: AccountColors.muted,
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 22,
  },
  field: { marginBottom: 22 },
  label: {
    color: AccountColors.teal,
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 10,
  },
  inputWrap: {
    minHeight: 60,
    borderRadius: 17,
    borderWidth: 1.3,
    borderColor: AccountColors.border,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: { flex: 1, padding: 16, color: AccountColors.text, fontSize: 16 },
  button: {
    minHeight: 58,
    borderRadius: 17,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  buttonText: { fontSize: 17, fontWeight: '600' },
  outline: {
    borderWidth: 1.3,
    borderColor: '#A6CCD0',
    backgroundColor: '#FFF',
  },
  danger: {
    backgroundColor: '#FFE2E2',
    borderWidth: 1,
    borderColor: '#FFBEBF',
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  link: { fontSize: 16, fontWeight: '500', color: AccountColors.teal },
  caption: {
    color: AccountColors.muted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  error: {
    color: '#B3261E',
    backgroundColor: '#FFF0F0',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    lineHeight: 21,
  },
  card: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: AccountColors.border,
    borderRadius: 24,
    marginBottom: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
});
