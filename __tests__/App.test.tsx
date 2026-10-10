import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { initDatabase } from '../src/database/database';
import App from '../App';
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => () => {}),
}));
jest.mock('../src/database/database', () => ({ initDatabase: jest.fn() }));
jest.mock('../src/screens/SplashScreen', () => ({
  SplashScreen: ({ onFinished }: { onFinished: () => void }) => {
    const ReactModule = require('react');
    ReactModule.useEffect(onFinished, [onFinished]);
    return null;
  },
}));
jest.mock('../src/navigation', () => ({
  AppNavigator: () => {
    const ReactModule = require('react');
    const { Text: NativeText } = require('react-native');
    return ReactModule.createElement(NativeText, null, 'Welcome route');
  },
}));
jest.mock('../src/auth/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    state: { status: 'unauthenticated' },
    error: null,
    consentCompleted: false,
  }),
}));
jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: 'View',
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: 'View',
}));
const initialize = initDatabase as jest.Mock;
test('opens welcome only after database initialization succeeds', async () => {
  initialize.mockResolvedValue(undefined);
  let tree!: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(<App />);
  });
  expect(
    tree.root
      .findAllByType(Text)
      .some(node => node.props.children === 'Welcome route'),
  ).toBe(true);
  await act(async () => tree.unmount());
});
test('database failure shows recovery information and does not enter navigation', async () => {
  initialize.mockRejectedValue(new Error('simulated disk failure'));
  let tree!: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(<App />);
  });
  const content = tree.root
    .findAllByType(Text)
    .map(node => node.props.children)
    .join(' ');
  expect(content).toContain('Could not open the local database');
  expect(content).not.toContain('Welcome route');
  await act(async () => tree.unmount());
});
