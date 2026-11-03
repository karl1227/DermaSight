import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { AccessibilityInfo, InteractionManager, Text } from 'react-native';
import { ConfirmImageScreen } from '../src/screens/ConfirmImageScreen';
import { AppButton } from '../src/components/AppButton';
import { prepareCapture } from '../src/services/capturePreparationService';
jest.mock('../src/services/capturePreparationService', () => ({
  prepareCapture: jest.fn(),
}));
const prepare = prepareCapture as jest.Mock;
const navigation = { push: jest.fn(), goBack: jest.fn() } as any;
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
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(true);
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
  expect(navigation.push).not.toHaveBeenCalled();
});
test('accepted upload sends the full-photo tensor to classification without crop controls', async () => {
  prepare.mockResolvedValue({
    image: { uri: 'file:///original.jpg', path: '/original.jpg' },
    originalImage: { uri: 'file:///original.jpg', width: 600, height: 450 },
    cropped: false,
    preprocessing: { id: 'prepared-upload' },
    validationMethod: 'appearance',
  });
  await mount();
  expect(
    tree.root
      .findAllByType(Text)
      .some(node => node.props.children === 'Review Uploaded Image'),
  ).toBe(true);
  expect(
    tree.root
      .findAllByType(AppButton)
      .some(node => /Lesion Highlight|Selected ROI/.test(node.props.label)),
  ).toBe(false);
  const analyze = tree.root
    .findAllByType(AppButton)
    .find(node => node.props.label === 'Analyze Image')!;
  expect(analyze.props.disabled).toBe(false);
  await act(async () => analyze.props.onPress());
  expect(navigation.push).toHaveBeenCalledWith('AIClassification', {
    patientInfo: params.patientInfo,
    symptoms: params.symptoms,
    imageUri: 'file:///original.jpg',
    imagePath: '/original.jpg',
    imageType: 'image/jpeg',
    preprocessingId: 'prepared-upload',
  });
});

test('retake invalidates an accepted image and rechecks even a reused image path', async () => {
  prepare.mockResolvedValueOnce({
    image: { uri: 'file:///roi.jpg', path: '/roi.jpg' },
    preprocessing: { id: 'old-tensor' },
    validationMethod: 'appearance',
  });
  await mount();
  const buttons = () => tree.root.findAllByType(AppButton);
  expect(
    buttons().some(node => /Zoom In|Zoom Out/.test(node.props.label)),
  ).toBe(false);
  const oldAnalyze = buttons().find(
    node => node.props.label === 'Analyze Image',
  )!;
  const retake = buttons().find(
    node => node.props.label === 'Back to Camera / Gallery',
  )!;
  await act(async () => retake.props.onPress());
  await act(async () => oldAnalyze.props.onPress());
  expect(navigation.push).not.toHaveBeenCalled();
  prepare.mockRejectedValueOnce(new Error('Skin could not be confirmed.'));
  await act(async () => {
    tree.update(
      <ConfirmImageScreen
        navigation={navigation}
        route={{ params: { ...params, captureId: 'retaken-image' } } as any}
      />,
    );
  });
  expect(prepare).toHaveBeenCalledTimes(2);
  const analyze = buttons().find(node => node.props.label === 'Analyze Image')!;
  expect(analyze.props.disabled).toBe(true);
  await act(async () => analyze.props.onPress());
  expect(navigation.push).not.toHaveBeenCalled();
});

test('a late preparation completion after Retake cannot enable Analyze', async () => {
  let complete!: (value: any) => void;
  prepare.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        complete = resolve;
      }),
  );
  await mount();
  const retake = tree.root
    .findAllByType(AppButton)
    .find(node => node.props.label === 'Back to Camera / Gallery')!;
  await act(async () => retake.props.onPress());
  await act(async () =>
    complete({
      image: { uri: 'file:///old.jpg' },
      preprocessing: { id: 'old' },
    }),
  );
  expect(
    tree.root
      .findAllByType(AppButton)
      .find(node => node.props.label === 'Analyze Image')!.props.disabled,
  ).toBe(true);
});

test('Review omits the two requested notes while keeping validated Analyze available', async () => {
  prepare.mockResolvedValue({
    image: { uri: 'file:///original.jpg', path: '/original.jpg' },
    preprocessing: { id: 'original-tensor' },
    cropped: false,
    validationMethod: 'appearance',
  });
  await mount();
  const content = tree.root
    .findAllByType(Text)
    .map(node => node.props.children)
    .join(' ');
  expect(content).not.toContain('Automatic cropping was unavailable');
  expect(content).not.toContain('Confirm that the preview shows skin');
  const analyze = tree.root
    .findAllByType(AppButton)
    .find(node => node.props.label === 'Analyze Image')!;
  expect(analyze.props.disabled).toBe(false);
});
