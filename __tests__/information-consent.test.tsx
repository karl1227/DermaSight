import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { Alert, Text } from 'react-native';
import { MedicalDisclaimerScreen } from '../src/screens/MedicalDisclaimerScreen';
import { PrivacyConsentScreen } from '../src/screens/PrivacyConsentScreen';
import { markFirstRunCompleted } from '../src/database/database';

const mockCompleteConsent = jest.fn();
jest.mock('../src/auth/AuthContext', () => ({
  useAuth: () => ({ completeConsent: mockCompleteConsent }),
}));
jest.mock('../src/database/database', () => ({
  markFirstRunCompleted: jest.fn(),
}));
jest.mock('../src/components/PolicyLink', () => ({ PolicyLink: () => null }));
const navigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
} as any;
let tree: Renderer.ReactTestRenderer;
beforeEach(() => {
  jest.clearAllMocks();
  (markFirstRunCompleted as jest.Mock).mockResolvedValue(undefined);
});
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  jest.restoreAllMocks();
});
function button(label: string) {
  const text = tree.root
    .findAllByType(Text)
    .find(node => node.props.children === label)!;
  let node = text.parent;
  while (node && typeof node.props.onPress !== 'function') node = node.parent;
  return node!;
}
async function check() {
  const box = tree.root.findAll(
    node =>
      node.props.accessibilityRole === 'checkbox' &&
      typeof node.props.onPress === 'function',
  )[0];
  await act(async () => box.props.onPress());
}
test('medical acknowledgment is required before entering Privacy Consent', async () => {
  await act(async () => {
    tree = Renderer.create(<MedicalDisclaimerScreen navigation={navigation} />);
  });
  expect(button('I Understand').props.disabled).toBe(true);
  await act(async () => button('I Understand').props.onPress());
  expect(navigation.navigate).not.toHaveBeenCalled();
  await check();
  expect(button('I Understand').props.disabled).toBe(false);
  await act(async () => button('I Understand').props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('PrivacyConsent');
});
test('screening consent is required before saving the first-use acknowledgment', async () => {
  await act(async () => {
    tree = Renderer.create(<PrivacyConsentScreen navigation={navigation} />);
  });
  await act(async () => button('Agree and Continue').props.onPress());
  expect(markFirstRunCompleted).not.toHaveBeenCalled();
  expect(mockCompleteConsent).not.toHaveBeenCalled();
  await check();
  await act(async () => button('Agree and Continue').props.onPress());
  expect(markFirstRunCompleted).toHaveBeenCalledTimes(1);
  expect(mockCompleteConsent).toHaveBeenCalledTimes(1);
  expect(navigation.dispatch).toHaveBeenCalled();
});
test('a failed consent save does not enter the dashboard and remains retryable', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  (markFirstRunCompleted as jest.Mock).mockRejectedValue(
    new Error('disk unavailable'),
  );
  await act(async () => {
    tree = Renderer.create(<PrivacyConsentScreen navigation={navigation} />);
  });
  await check();
  await act(async () => button('Agree and Continue').props.onPress());
  expect(alert).toHaveBeenCalledWith(
    'Could not save consent',
    'Please try again.',
  );
  expect(mockCompleteConsent).not.toHaveBeenCalled();
  expect(navigation.dispatch).not.toHaveBeenCalled();
  expect(button('Agree and Continue').props.disabled).toBe(false);
});
