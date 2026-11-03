import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { Text, TextInput } from 'react-native';
import { PatientInfoScreen } from '../src/screens/PatientInfoScreen';
jest.mock('../src/utils/secureId', () => ({
  secureId: () => 'abcdefgh-full-uuid',
}));
jest.mock('../src/auth/AuthContext', () => ({
  useAuth: () => ({
    state: { status: 'authenticated', user: { name: 'Sample', sex: 'Female' } },
    owner: { kind: 'user', id: 'user-1' },
  }),
}));

test('screening requires occupation and sunburn answer, preserves full ID and accepts No', async () => {
  const navigate = jest.fn();
  let tree!: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(
      <PatientInfoScreen navigation={{ navigate, goBack: jest.fn() } as any} />,
    );
  });
  const press = async (label: string) => {
    const text = tree.root
      .findAllByType(Text)
      .find(node => node.props.children === label)!;
    await act(async () => {
      let button = text.parent;
      while (button && typeof button.props.onPress !== 'function') {
        button = button.parent;
      }
      expect(button).not.toBeNull();
      button!.props.onPress();
    });
  };
  const continueButton = () =>
    tree.root.findAll(
      node =>
        node.props.accessibilityRole === 'button' &&
        node.props.onPress &&
        node.props.accessibilityState?.disabled !== undefined,
    )[0];
  try {
    expect(
      tree.root
        .findAllByType(Text)
        .filter(node => node.props.children === 'Nape'),
    ).toHaveLength(1);
    expect(
      tree.root
        .findAllByType(Text)
        .filter(node => node.props.children === 'Hand'),
    ).toHaveLength(0);
    await act(async () =>
      tree.root
        .findByProps({ accessibilityLabel: 'Age' })
        .props.onChangeText('0'),
    );
    await press('Face');
    expect(continueButton().props.disabled).toBe(true);
    await press('Other');
    expect(continueButton().props.disabled).toBe(true);
    await act(async () =>
      tree.root
        .findAllByType(TextInput)
        .find(node => node.props.accessibilityLabel === 'Specific occupation')!
        .props.onChangeText('Teacher'),
    );
    await press('No');
    expect(continueButton().props.disabled).toBe(false);
    await act(async () => continueButton().props.onPress());
    expect(navigate).toHaveBeenCalledWith('SymptomChecklist', {
      patientInfo: expect.objectContaining({
        screeningId: 'abcdefgh-full-uuid',
        age: 0,
        occupation: 'Teacher',
        sunburnHistory: false,
        lesionLocation: 'Face',
      }),
    });
  } finally {
    await act(async () => tree.unmount());
  }
});
