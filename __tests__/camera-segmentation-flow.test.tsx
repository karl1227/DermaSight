import { CAPTURE_INPUT_VERSION } from '../src/config/capture';
import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { Alert, AppState } from 'react-native';
import { CameraScreen } from '../src/screens/CameraScreen';
import { prepareCapture } from '../src/services/capturePreparationService';
import { takePreparedCapture } from '../src/services/preparedCaptureCache';
import { LesionRegionPreview } from '../src/components/LesionRegionPreview';

let mockCameraFocused = true;
const mockTakePhoto = jest.fn(async () => ({
  path: '/captured.jpg',
  width: 1000,
  height: 800,
}));
jest.mock('react-native-vision-camera', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');
  const Camera = ReactModule.forwardRef((props: any, ref: any) => {
    ReactModule.useImperativeHandle(ref, () => ({ takePhoto: mockTakePhoto }));
    return ReactModule.createElement(View, props);
  });
  Camera.getCameraPermissionStatus = () => 'granted';
  return {
    Camera,
    useCameraDevice: () => ({ hasFlash: true, hasTorch: true }),
    useCameraFormat: jest.fn(() => undefined),
    useFrameProcessor: (fn: any) => fn,
    runAtTargetFps: (_fps: number, fn: any) => fn(),
  };
});
jest.mock('react-native-worklets-core', () => {
  const ReactModule = require('react');
  return {
    useSharedValue: (value: any) => ReactModule.useRef({ value }).current,
    useRunOnJS: (fn: any, deps: any) => ReactModule.useCallback(fn, deps),
  };
});
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useIsFocused: () => mockCameraFocused,
}));
jest.mock('vision-camera-resize-plugin', () => ({
  useResizePlugin: () => ({
    resize: () => new Uint8Array(64 * 64 * 3).fill(120),
  }),
}));
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0 }),
}));
jest.mock('../src/utils/secureId', () => ({
  secureId: () => 'capture-test-id',
}));
jest.mock('../src/services/capturePreparationService', () => ({
  prepareCapture: jest.fn(),
}));
jest.mock('../src/components/LesionRegionPreview', () => ({
  LesionRegionPreview: (props: any) =>
    require('react').createElement(require('react-native').View, props),
}));
const owner = { kind: 'guest' as const, id: 'guest-test' };
const params = {
  patientInfo: { owner, fullName: 'Test', lesionLocation: 'Hand' },
  symptoms: {},
} as any;
const navigation = { push: jest.fn(), goBack: jest.fn() } as any;
const prepared = {
  inputVersion: CAPTURE_INPUT_VERSION,
  originalImage: { uri: 'file:///normalized.jpg' },
  image: { uri: 'file:///normalized.jpg', path: '/normalized.jpg' },
  cropped: false,
  preprocessing: { id: 'camera-tensor' },
} as any;
let tree: Renderer.ReactTestRenderer;
beforeEach(() => {
  jest.clearAllMocks();
  mockCameraFocused = true;
  Object.defineProperty(AppState, 'currentState', {
    configurable: true,
    value: 'active',
    writable: true,
  });
});
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
});
async function mount() {
  await act(async () => {
    tree = Renderer.create(
      <CameraScreen navigation={navigation} route={{ params } as any} />,
    );
  });
}
const button = (label: string) =>
  tree.root.findAll(
    node =>
      node.props.accessibilityLabel === label &&
      typeof node.props.onPress === 'function',
  )[0];
test('capture validates the full photo and hands Review the unchanged prepared image', async () => {
  (prepareCapture as jest.Mock).mockResolvedValue(prepared);
  await mount();
  await act(async () => button('Capture image').props.onPress());
  expect(prepareCapture).toHaveBeenCalledWith(
    expect.objectContaining({ filePath: '/captured.jpg' }),
    expect.any(Object),
    expect.any(Function),
    expect.any(Function),
  );
  expect(navigation.push).not.toHaveBeenCalled();
  expect(tree.root.findByType(LesionRegionPreview).props.selected).toBe(
    prepared.image,
  );
  await act(async () =>
    tree.root.findByType(LesionRegionPreview).props.onComplete(),
  );
  expect(navigation.push).toHaveBeenCalledWith(
    'ConfirmImage',
    expect.objectContaining({ captureId: 'capture-test-id' }),
  );
  expect(takePreparedCapture('capture-test-id', owner, '/captured.jpg')).toBe(
    prepared,
  );
});
test('non-skin capture stays on Skin Scan and Retake validates again', async () => {
  (prepareCapture as jest.Mock)
    .mockRejectedValueOnce(new Error('Human skin could not be confirmed.'))
    .mockResolvedValueOnce(prepared);
  await mount();
  await act(async () => button('Capture image').props.onPress());
  expect(navigation.push).not.toHaveBeenCalled();
  const { AppButton } = require('../src/components/AppButton');
  await act(async () =>
    tree.root
      .findAllByType(AppButton)
      .find((node: any) => node.props.label === 'Retake Image')!
      .props.onPress(),
  );
  await act(async () => button('Capture image').props.onPress());
  expect(prepareCapture).toHaveBeenCalledTimes(2);
  expect(navigation.push).not.toHaveBeenCalled();
  expect(tree.root.findByType(LesionRegionPreview)).toBeTruthy();
});

test('live preview checks quality without starting photo segmentation or inference', async () => {
  await mount();
  const frame = tree.root.findAll(
    node => typeof node.props.frameProcessor === 'function',
  )[0];
  await act(async () => frame.props.frameProcessor({}));
  expect(prepareCapture).not.toHaveBeenCalled();
  expect(mockTakePhoto).not.toHaveBeenCalled();
  expect(navigation.push).not.toHaveBeenCalled();
});

test('Auto light does not force the torch on and capture prioritizes photo quality', async () => {
  await mount();
  const camera = () =>
    tree.root.findAll(
      node =>
        node.props.photo === true &&
        typeof node.props.frameProcessor === 'function',
    )[0];
  expect(camera().props.torch).toBe('off');
  expect(camera().props.photoQualityBalance).toBe('quality');
  const { Text } = require('react-native');
  const label = tree.root
    .findAllByType(Text)
    .find((node: any) => node.props.children === 'Light Auto')!;
  let control = label.parent;
  while (control && typeof control.props.onPress !== 'function')
    control = control.parent;
  await act(async () => control!.props.onPress());
  expect(camera().props.torch).toBe('on');
});

test('camera and torch remain stable until the native photo finishes; duplicate captures are blocked', async () => {
  let finish!: (photo: any) => void;
  mockTakePhoto.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finish = resolve;
      }),
  );
  (prepareCapture as jest.Mock).mockResolvedValue(prepared);
  await mount();
  const { Text } = require('react-native');
  const label = tree.root
    .findAllByType(Text)
    .find((node: any) => node.props.children === 'Light Auto')!;
  let control = label.parent;
  while (control && typeof control.props.onPress !== 'function')
    control = control.parent;
  await act(async () => control!.props.onPress());
  const camera = () => tree.root.findAll(node => node.props.photo === true)[0];
  await act(async () => {
    button('Capture image').props.onPress();
  });
  expect(camera().props.isActive).toBe(true);
  expect(camera().props.torch).toBe('on');
  expect(typeof camera().props.frameProcessor).toBe('function');
  await act(async () => {
    button('Capture image').props.onPress();
  });
  expect(mockTakePhoto).toHaveBeenCalledTimes(1);
  expect(mockTakePhoto).toHaveBeenCalledWith(
    expect.objectContaining({ flash: 'off' }),
  );
  await act(async () =>
    finish({ path: '/captured.jpg', width: 1000, height: 800 }),
  );
  expect(tree.root.findAll(node => node.props.photo === true)).toHaveLength(0);
});

test('native capture failure recovers and shows a friendly message without AVFoundation details', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  mockTakePhoto.mockRejectedValueOnce(
    new Error(
      'AVFoundationErrorDomain Code=-11800 NSOSStatusErrorDomain -16800',
    ),
  );
  await mount();
  await act(async () => button('Capture image').props.onPress());
  expect(alert).toHaveBeenCalledWith(
    'Capture Failed',
    expect.stringContaining('Try again'),
  );
  expect(String(alert.mock.calls[0][1])).not.toContain('AVFoundation');
  expect(button('Capture image').props.disabled).toBe(false);
  alert.mockRestore();
});

test('Auto lights the native photo only and Off disables capture lighting', async () => {
  (prepareCapture as jest.Mock).mockResolvedValue(prepared);
  await mount();
  await act(async () => button('Capture image').props.onPress());
  expect(mockTakePhoto).toHaveBeenLastCalledWith(
    expect.objectContaining({ flash: 'on' }),
  );
  expect(tree.root.findAll(node => node.props.photo === true)).toHaveLength(0);
  await act(async () => tree.unmount());
  await mount();
  const { Text } = require('react-native');
  for (const text of ['Light Auto', 'Light ON']) {
    const label = tree.root
      .findAllByType(Text)
      .find((node: any) => node.props.children === text)!;
    let control = label.parent;
    while (control && typeof control.props.onPress !== 'function')
      control = control.parent;
    await act(async () => control!.props.onPress());
  }
  await act(async () => button('Capture image').props.onPress());
  expect(mockTakePhoto).toHaveBeenLastCalledWith(
    expect.objectContaining({ flash: 'off' }),
  );
});

test('continuous light remains off after opening Review and camera releases when hidden', async () => {
  (prepareCapture as jest.Mock).mockResolvedValue(prepared);
  await mount();
  const { Text } = require('react-native');
  const label = tree.root
    .findAllByType(Text)
    .find((node: any) => node.props.children === 'Light Auto')!;
  let control = label.parent;
  while (control && typeof control.props.onPress !== 'function')
    control = control.parent;
  await act(async () => control!.props.onPress());
  await act(async () => button('Capture image').props.onPress());
  await act(async () =>
    tree.root.findByType(LesionRegionPreview).props.onComplete(),
  );
  expect(
    tree.root.findAll(node => node.props.photo === true)[0].props.torch,
  ).toBe('off');
  mockCameraFocused = false;
  await act(async () =>
    tree.update(
      <CameraScreen navigation={navigation} route={{ params } as any} />,
    ),
  );
  expect(tree.root.findAll(node => node.props.photo === true)).toHaveLength(0);
});
