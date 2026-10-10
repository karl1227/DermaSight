import { connectivityStatus } from '../src/connectivity/ConnectivityContext';
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
}));
test('network availability and internet reachability are distinct; unknown is not falsely online', () => {
  expect(
    connectivityStatus({ isConnected: null, isInternetReachable: null }),
  ).toBe('checking');
  expect(
    connectivityStatus({ isConnected: true, isInternetReachable: null }),
  ).toBe('checking');
  expect(
    connectivityStatus({ isConnected: false, isInternetReachable: null }),
  ).toBe('offline');
  expect(
    connectivityStatus({ isConnected: true, isInternetReachable: false }),
  ).toBe('offline');
  expect(
    connectivityStatus({ isConnected: true, isInternetReachable: true }),
  ).toBe('online');
});
