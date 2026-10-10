import { AppRegistry } from 'react-native';

jest.mock('react-native-get-random-values', () => ({}));
jest.mock('../App', () => ({ __esModule: true, default: () => null }));

test('current and previously installed native builds resolve the same app', () => {
  const register = jest.spyOn(AppRegistry, 'registerComponent');
  try {
    require('../index');
    const current = register.mock.calls.find(([name]) => name === 'DermaSight');
    const legacy = register.mock.calls.find(([name]) => name === 'SkinSense');
    expect(current).toBeDefined();
    expect(legacy).toBeDefined();
    expect(current![1]()).toBe(legacy![1]());
  } finally {
    register.mockRestore();
  }
});
