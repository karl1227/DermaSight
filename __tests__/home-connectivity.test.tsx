import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import {
  AccessibilityInfo,
  Alert,
  Animated,
  AppState,
  Text,
  RefreshControl,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { ConnectivityProvider } from '../src/connectivity/ConnectivityContext';
import { HomeScreen } from '../src/screens/HomeScreen';

jest.mock('@react-native-community/netinfo', () => ({
  configure: jest.fn(),
  refresh: jest.fn(async () => ({})),
  addEventListener: jest.fn(),
}));
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useIsFocused: () => true,
}));
jest.mock('../src/auth/AuthContext', () => ({
  useAuth: () => ({ state: { status: 'guest' } }),
}));

let tree: Renderer.ReactTestRenderer;
let network: (state: any) => void;
let appListeners: ((state: any) => void)[];
const unsubscribe = jest.fn();
const loops: { start: jest.Mock; stop: jest.Mock }[] = [];
beforeEach(() => {
  jest.clearAllMocks();
  appListeners = [];
  loops.length = 0;
  Object.defineProperty(AppState, 'currentState', {
    configurable: true,
    value: 'active',
    writable: true,
  });
  (NetInfo.addEventListener as jest.Mock).mockImplementation(listener => {
    network = listener;
    return unsubscribe;
  });
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_type, listener) => {
      appListeners.push(listener);
      return { remove: jest.fn() };
    });
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(true);
  jest
    .spyOn(AccessibilityInfo, 'addEventListener')
    .mockReturnValue({ remove: jest.fn() } as unknown as ReturnType<
      typeof AccessibilityInfo.addEventListener
    >);
  jest.spyOn(Animated, 'loop').mockImplementation(() => {
    const loop = { start: jest.fn(), stop: jest.fn(), reset: jest.fn() };
    loops.push(loop);
    return loop;
  });
});
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  jest.restoreAllMocks();
  jest.useRealTimers();
});
async function mount() {
  await act(async () => {
    tree = Renderer.create(
      <ConnectivityProvider>
        <HomeScreen
          navigation={{ dispatch: jest.fn(), navigate: jest.fn() } as any}
        />
      </ConnectivityProvider>,
    );
  });
}
const text = () =>
  tree.root.findAllByType(Text).map(node => node.props.children);

test('Home follows internet reachability over Wi-Fi or mobile data and keeps offline screening enabled', async () => {
  await mount();
  expect(text()).toContain('Checking connection…');
  await act(async () =>
    network({ type: 'wifi', isConnected: true, isInternetReachable: true }),
  );
  expect(text()).toContain('Online');
  await act(async () =>
    network({ type: 'wifi', isConnected: true, isInternetReachable: false }),
  );
  expect(text()).toContain('Offline');
  const button = tree.root.findAll(
    node =>
      node.props.accessibilityLabel === 'Start New Screening' &&
      typeof node.props.onPress === 'function',
  )[0];
  expect(button.props.disabled).not.toBe(true);
  await act(async () =>
    network({ type: 'cellular', isConnected: true, isInternetReachable: true }),
  );
  expect(text()).toContain('Online');
  expect(NetInfo.configure).toHaveBeenCalledWith(
    expect.objectContaining({ useNativeReachability: false }),
  );
  expect(text()).toContain('About DermaSight');
});
test('returning to the app refreshes connectivity and Reduce Motion keeps the CTA static', async () => {
  await mount();
  expect(loops).toHaveLength(0);
  await act(async () => appListeners.forEach(listener => listener('active')));
  expect(NetInfo.refresh).toHaveBeenCalledTimes(1);
});
test('eye-catching animation stops when the application enters the background', async () => {
  (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(
    false,
  );
  await mount();
  expect(loops).toHaveLength(3);
  expect(loops.every(loop => loop.start.mock.calls.length === 1)).toBe(true);
  await act(async () =>
    appListeners.forEach(listener => listener('background')),
  );
  expect(loops.every(loop => loop.stop.mock.calls.length === 1)).toBe(true);
});

test('pull-to-refresh shows a spinner, prevents duplicate requests and completes', async () => {
  jest.useFakeTimers();
  let complete!: () => void;
  (NetInfo.refresh as jest.Mock).mockImplementationOnce(
    () =>
      new Promise<void>(resolve => {
        complete = resolve;
      }),
  );
  await mount();
  const control = () => tree.root.findByType(RefreshControl);
  await act(async () => {
    control().props.onRefresh();
  });
  expect(control().props.refreshing).toBe(true);
  await act(async () => {
    control().props.onRefresh();
  });
  expect(NetInfo.refresh).toHaveBeenCalledTimes(1);
  await act(async () => complete());
  await act(async () => jest.advanceTimersByTime(650));
  expect(control().props.refreshing).toBe(false);
});

test('failed refresh stops the spinner and leaves screening available', async () => {
  jest.useFakeTimers();
  (NetInfo.refresh as jest.Mock).mockRejectedValueOnce(
    new Error('Network check failed'),
  );
  const alert = jest.spyOn(Alert, 'alert');
  await mount();
  await act(async () => {
    tree.root.findByType(RefreshControl).props.onRefresh();
  });
  await act(async () => jest.advanceTimersByTime(650));
  expect(tree.root.findByType(RefreshControl).props.refreshing).toBe(false);
  expect(alert).toHaveBeenCalledWith('Could not refresh', expect.any(String));
  expect(
    tree.root.findAll(
      node => node.props.accessibilityLabel === 'Start New Screening',
    )[0].props.disabled,
  ).not.toBe(true);
});

test('an immediate connection response still leaves time to display Home spinner', async () => {
  jest.useFakeTimers();
  (NetInfo.refresh as jest.Mock).mockResolvedValueOnce({});
  await mount();
  await act(async () => {
    tree.root.findByType(RefreshControl).props.onRefresh();
  });
  expect(tree.root.findByType(RefreshControl).props.refreshing).toBe(true);
  await act(async () => jest.advanceTimersByTime(650));
  expect(tree.root.findByType(RefreshControl).props.refreshing).toBe(false);
});
