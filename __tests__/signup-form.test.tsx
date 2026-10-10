import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { TextInput, TouchableOpacity, Text } from 'react-native';
import { SignUpScreen } from '../src/screens/AuthScreens';
const mockAuth = {
  state: { status: 'guest' },
  pendingGoogle: null as null | {
    needsProfile: true;
    mode: 'create' | 'link';
    name: string;
    email: string;
    idToken: string;
  },
  busy: false,
  signup: jest.fn(),
  googleLogin: jest.fn(async () => null),
  cancelGoogleSignup: jest.fn(),
};
jest.mock('../src/auth/AuthContext', () => ({ useAuth: () => mockAuth }));
jest.mock('../src/components/GoogleEntry', () => ({ GoogleEntry: () => null }));
jest.mock('../src/components/AccountUI', () => {
  const ReactModule = require('react');
  const Native = require('react-native');
  return {
    a: {},
    AccountColors: {},
    LineIcon: () => null,
    TealGradient: () => null,
    AccountScreen: ({ children }: any) =>
      ReactModule.createElement(Native.View, null, children),
    AccountField: ({ label, secure, ...props }: any) =>
      ReactModule.createElement(Native.TextInput, {
        ...props,
        accessibilityLabel: label,
        secureTextEntry: secure,
      }),
    AccountButton: ({ label, onPress }: any) =>
      ReactModule.createElement(
        Native.TouchableOpacity,
        { onPress },
        ReactModule.createElement(Native.Text, null, label),
      ),
  };
});
let tree: Renderer.ReactTestRenderer;
const navigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
  replace: jest.fn(),
} as any;
async function mount() {
  await act(async () => {
    tree = Renderer.create(<SignUpScreen navigation={navigation} />);
  });
}
const field = (label: string) =>
  tree.root
    .findAllByType(TextInput)
    .find(node => node.props.accessibilityLabel === label)!;
const button = (label: string) =>
  tree.root
    .findAllByType(TouchableOpacity)
    .find(node =>
      node.findAllByType(Text).some(text => text.props.children === label),
    )!;
beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.pendingGoogle = null;
});
afterEach(async () => {
  await act(async () => tree.unmount());
});
test('Google prefill has no password fields and Continue completes signup', async () => {
  mockAuth.pendingGoogle = {
    needsProfile: true,
    mode: 'create',
    name: 'Google Name',
    email: 'google@example.com',
    idToken: 'test-google-token',
  };
  await mount();
  expect(
    tree.root
      .findAllByType(TextInput)
      .filter(node => node.props.accessibilityLabel === 'Full Name'),
  ).toHaveLength(1);
  expect(field('Full Name').props.value).toBe('Google Name');
  expect(field('Email Address').props.value).toBe('google@example.com');
  expect(field('Email Address').props.editable).toBe(false);
  expect(
    tree.root
      .findAllByType(Text)
      .some(node => node.props.children === 'Complete your Google profile'),
  ).toBe(false);
  await act(async () => button('Continue').props.onPress());
  expect(mockAuth.googleLogin).not.toHaveBeenCalled(); // Sex remains required.
  await act(async () => button('Female').props.onPress());
  await act(async () => button('Continue').props.onPress());
  expect(mockAuth.googleLogin).toHaveBeenLastCalledWith(
    'test-google-token',
    'Google Name',
    'Female',
    undefined,
  );
  expect(
    tree.root.findAllByType(TextInput).some(node => node.props.secureTextEntry),
  ).toBe(false);
  expect(field('Password')).toBeUndefined();
  expect(field('Confirm Password')).toBeUndefined();
  expect(mockAuth.signup).not.toHaveBeenCalled();
});
test('existing-account linking reuses the form and requires its password without duplicate profile fields', async () => {
  mockAuth.pendingGoogle = {
    needsProfile: true,
    mode: 'link',
    name: 'Google Name',
    email: 'existing@example.com',
    idToken: 'link-token',
  };
  await mount();
  expect(field('Existing Password')).toBeDefined();
  expect(
    tree.root
      .findAllByType(TextInput)
      .some(node => node.props.accessibilityLabel === 'Confirm Password'),
  ).toBe(false);
  await act(async () => button('Connect and Sign In').props.onPress());
  expect(mockAuth.googleLogin).not.toHaveBeenCalled();
  await act(async () =>
    field('Existing Password').props.onChangeText('existing-password'),
  );
  await act(async () => button('Connect and Sign In').props.onPress());
  expect(mockAuth.googleLogin).toHaveBeenCalledWith(
    'link-token',
    undefined,
    undefined,
    'existing-password',
  );
});

test('manual registration retains password and confirmation', async () => {
  await mount();
  expect(field('Password').props.secureTextEntry).toBe(true);
  expect(field('Confirm Password').props.secureTextEntry).toBe(true);
  await act(async () => button('Create Account').props.onPress());
  expect(mockAuth.signup).not.toHaveBeenCalled();
  await act(async () => {
    field('Full Name').props.onChangeText('Manual User');
    field('Email Address').props.onChangeText('manual@example.com');
    field('Password').props.onChangeText('manual-password');
    field('Confirm Password').props.onChangeText('manual-password');
    button('Male').props.onPress();
  });
  await act(async () => button('Create Account').props.onPress());
  expect(mockAuth.signup).toHaveBeenCalledWith(
    'manual@example.com',
    'manual-password',
    'Manual User',
    'Male',
  );
});
