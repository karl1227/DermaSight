import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import {
  CompositeNavigationProp,
  useFocusEffect,
} from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, TabParamList } from '../types';
import { useAuth } from '../auth/AuthContext';
import { getAllScreenings } from '../database/database';
import {
  AccountScreen,
  AccountButton,
  a,
  AccountColors,
  LineIcon,
  IconName,
  TealGradient,
} from '../components/AccountUI';
type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList, 'Profile'>,
    NativeStackNavigationProp<RootStackParamList>
  >;
};
export function ProfileScreen({ navigation }: Props) {
  const auth = useAuth();
  const [count, setCount] = useState<number | null>(null);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setCount(null);
      if (auth.owner)
        getAllScreenings(auth.owner)
          .then(rows => {
            if (active) setCount(rows.length);
          })
          .catch(() => {});
      return () => {
        active = false;
      };
    }, [auth.owner]),
  );
  const user = auth.state.status === 'authenticated' ? auth.state.user : null;
  const row = (icon: IconName, label: string, value: string) => (
    <View style={s.row}>
      <View style={s.icon}>
        <LineIcon name={icon} size={19} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.label}>{label}</Text>
        <Text style={s.value}>{value}</Text>
      </View>
    </View>
  );
  const quick = (icon: IconName, label: string, onPress: () => void) => (
    <TouchableOpacity
      style={s.row}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={s.icon}>
        <LineIcon name={icon} size={19} />
      </View>
      <Text style={[s.value, { flex: 1 }]}>{label}</Text>
      <LineIcon name="chevron" color={AccountColors.light} size={20} />
    </TouchableOpacity>
  );
  const logout = () =>
    Alert.alert(
      user ? 'Sign Out' : 'Exit Guest Mode',
      user
        ? 'Your saved screenings will remain on this device.'
        : 'This guest session will close. Its local records will be preserved but will not appear in a new guest session. Create an account first to keep access to them.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: user ? 'Sign Out' : 'Exit',
          style: 'destructive',
          onPress: () =>
            auth
              .logout()
              .catch(() =>
                Alert.alert('Could not sign out', 'Please try again.'),
              ),
        },
      ],
    );
  return (
    <AccountScreen>
      <Text style={[a.title, { marginTop: 4 }]}>Profile</Text>
      <Text style={a.subtitle}>
        {user ? 'Your DermaSight account' : 'Your guest session'}
      </Text>
      <View style={a.card}>
        <View style={s.banner}>
          <TealGradient />
          <View style={s.avatar}>
            <LineIcon name="user" color="#FFF" size={30} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{user?.name ?? 'Guest'}</Text>
            <Text style={s.email}>{user?.email ?? 'Local screening mode'}</Text>
          </View>
        </View>
        {user && row('user', 'Sex', user.sex)}
        {row('mail', 'Email', user?.email ?? 'No account required')}
        {row(
          'records',
          'Saved Screenings',
          count === null ? 'Unavailable' : `${count} records`,
        )}
        {row('shield', 'Account Type', user ? 'Registered' : 'Guest')}
      </View>
      <View style={a.card}>
        <Text style={s.quickTitle}>QUICK ACCESS</Text>
        {user &&
          quick('user', 'Edit Profile', () =>
            navigation.navigate('EditProfile'),
          )}
        {quick('records', 'My Records', () => navigation.navigate('History'))}
        {quick('analytics', 'Analytics', () =>
          navigation.navigate('Analytics'),
        )}
        {quick('settings', 'Settings', () => navigation.navigate('Settings'))}
      </View>
      {!user && (
        <>
          <AccountButton
            label="Create Account"
            icon="signup"
            onPress={() => navigation.navigate('SignUp')}
          />
          <AccountButton
            label="Sign In"
            icon="signin"
            outline
            onPress={() => navigation.navigate('SignIn')}
          />
        </>
      )}
      <AccountButton
        label={user ? 'Sign Out' : 'Exit Guest Mode'}
        icon="logout"
        danger
        onPress={logout}
        busy={auth.busy}
      />
      <Text
        style={[
          a.caption,
          { fontSize: 12, color: AccountColors.light, marginTop: 8 },
        ]}
      >
        DermaSight v1.0 · Educational Use Only
      </Text>
    </AccountScreen>
  );
}
const s = StyleSheet.create({
  banner: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    minHeight: 112,
    backgroundColor: AccountColors.teal,
    overflow: 'hidden',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: { color: '#FFF', fontSize: 18, fontWeight: '600' },
  email: { color: '#C2EDF0', fontSize: 15, marginTop: 4 },
  row: {
    padding: 22,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EDF3F5',
    minHeight: 68,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E7F3F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: AccountColors.light, fontSize: 13, marginBottom: 4 },
  value: { color: AccountColors.text, fontSize: 15, lineHeight: 22 },
  quickTitle: {
    color: AccountColors.light,
    fontSize: 12,
    letterSpacing: 1,
    margin: 24,
    marginBottom: 10,
  },
});
