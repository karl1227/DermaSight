import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { InteractionManager, Text } from 'react-native';
import { ConfirmImageScreen } from '../src/screens/ConfirmImageScreen';
import { AppButton } from '../src/components/AppButton';
import { prepareCapture } from '../src/services/capturePreparationService';
jest.mock('../src/services/capturePreparationService', () => ({
  prepareCapture: jest.fn(),
}));
const prepare = prepareCapture as jest.Mock;
const navigation = { replace: jest.fn(), goBack: jest.fn() } as any;
const params = {
  imageEntry: 'gallery',
  imageUri: 'file:///picked.png',
  imagePath: 'file:///picked.png',
  imageType: 'image/png',
  patientInfo: {
    fullName: 'Test',
    patientId: 'screening-id',
    lesionLocation: 'Arm',
  },
  symptoms: {},
} as any;
let tree: Renderer.ReactTestRenderer;
beforeEach(() => {
  jest.clearAllMocks();
  jest
    .spyOn(InteractionManager, 'runAfterInteractions')
    .mockImplementation((callback: any) => {
      callback();
      return { cancel: jest.fn(), then: jest.fn(), done: jest.fn() } as any;
    });
});
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  jest.restoreAllMocks();
});
async function mount() {
  await act(async () => {
    tree = Renderer.create(
      <ConfirmImageScreen navigation={navigation} route={{ params } as any} />,
    );
  });
}
test('non-skin upload shows error and blocks Analyze even if its handler is invoked', async () => {
  prepare.mockRejectedValue(new Error('Skin was not detected clearly.'));
  await mount();
  expect(prepare).toHaveBeenCalledWith(
    {
      filePath: 'file:///picked.png',
      base64: undefined,
      mimeType: 'image/png',
    },
    undefined,
    expect.any(Function),
    expect.any(Function),
    1,
  );
  expect(
    tree.root
      .findAllByType(Text)
      .some(node => node.props.children === 'Skin was not detected clearly.'),
  ).toBe(true);
  const analyze = tree.root
    .findAllByType(AppButton)
    .find(node => node.props.label === 'Analyze Image')!;
  expect(analyze.props.disabled).toBe(true);
  await act(async () => analyze.props.onPress());
  expect(navigation.replace).not.toHaveBeenCalled();
});
test('accepted upload sends the prepared ROI tensor to existing classification', async () => {
  prepare.mockResolvedValue({
    image: { uri: 'file:///roi.jpg', path: '/roi.jpg' },
    preprocessing: { id: 'prepared-upload' },
    maxZoom: 1,
    validationMethod: 'appearance',
  });
  await mount();
  expect(
    tree.root
      .findAllByType(Text)
      .some(node => node.props.children === 'Review Uploaded Image'),
  ).toBe(true);
  const analyze = tree.root
    .findAllByType(AppButton)
    .find(node => node.props.label === 'Analyze Image')!;
  expect(analyze.props.disabled).toBe(false);
  await act(async () => analyze.props.onPress());
  expect(navigation.replace).toHaveBeenCalledWith('AIClassification', {
    patientInfo: params.patientInfo,
    symptoms: params.symptoms,
    imageUri: 'file:///roi.jpg',
    imagePath: '/roi.jpg',
    imageType: 'image/jpeg',
    preprocessingId: 'prepared-upload',
  });
});
