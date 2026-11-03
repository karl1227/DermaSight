import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { AccessibilityInfo, AppState, Animated, Text } from 'react-native';
import { AIClassificationScreen } from '../src/screens/AIClassificationScreen';
import { runInference } from '../src/services/tfliteService';
jest.mock('../src/services/tfliteService', () => ({ runInference: jest.fn() }));
jest.mock('../src/utils/secureId', () => ({ secureId: () => 'test-id' }));
const navigation = {
  dispatch: jest.fn(),
  goBack: jest.fn(),
  replace: jest.fn(),
} as any;
const params = {
  imageUri: 'file:///roi.jpg',
  imagePath: '/roi.jpg',
  preprocessingId: 'prepared',
  patientInfo: { screeningId: 'screening' },
  symptoms: {},
} as any;
let tree: Renderer.ReactTestRenderer;
beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(AppState, 'currentState', {
    configurable: true,
    value: 'active',
  });
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(false);
  jest
    .spyOn(Animated, 'loop')
    .mockImplementation(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      reset: jest.fn(),
    }));
});
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  jest.restoreAllMocks();
});
async function mount() {
  await act(async () => {
    tree = Renderer.create(
      <AIClassificationScreen
        navigation={navigation}
        route={{ params } as any}
      />,
    );
  });
}
const texts = () =>
  tree.root
    .findAllByType(Text)
    .map(node =>
      Array.isArray(node.props.children)
        ? node.props.children.join('')
        : node.props.children,
    );
test('completion keeps only progress and Continue, preserving the model result handoff', async () => {
  const result = {
    confidenceScore: 42,
    predictedLesionType: 'Melanocytic Nevi',
  };
  (runInference as jest.Mock).mockResolvedValue(result);
  await mount();
  expect(texts()).toContain('100%');
  expect(texts()).toContain('Complete');
  expect(texts().join(' ')).not.toMatch(
    /Loading preprocessed|Comparing features|CNN Analysis Complete|All inference runs|HAM10000 Classes/,
  );
  expect(runInference).toHaveBeenCalledWith(
    expect.objectContaining({ filePath: '/roi.jpg' }),
    params.symptoms,
    'prepared',
  );
  const label = tree.root
    .findAllByType(Text)
    .find(node => node.props.children === 'Continue to Screening Result')!;
  let button = label.parent;
  while (button && typeof button.props.onPress !== 'function')
    button = button.parent;
  await act(async () => button!.props.onPress());
  expect(navigation.dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'RESET',
      payload: expect.objectContaining({
        routes: expect.arrayContaining([
          expect.objectContaining({
            name: 'Result',
            params: expect.objectContaining({ result }),
          }),
        ]),
      }),
    }),
  );
});
test('failure retains Back/Retry and cannot claim 100% completion', async () => {
  (runInference as jest.Mock).mockRejectedValue(
    new Error('Inference unavailable'),
  );
  await mount();
  expect(texts()).not.toContain('100%');
  expect(texts()).toContain('Unable to analyze');
  expect(texts()).toContain('Go Back');
  expect(texts()).toContain('Retry');
  expect(texts()).not.toContain('Continue to Screening Result');
});

test('completion keeps both ambient animations running until the screen is left', async () => {
  (runInference as jest.Mock).mockResolvedValue({ confidenceScore: 42 });
  await mount();
  expect(texts()).toContain('100%');
  const loops = (Animated.loop as jest.Mock).mock.results.map(
    result => result.value,
  );
  expect(loops).toHaveLength(2);
  for (const loop of loops) {
    expect(loop.start).toHaveBeenCalledTimes(1);
    expect(loop.stop).not.toHaveBeenCalled();
  }
  await act(async () => tree.unmount());
  for (const loop of loops) expect(loop.stop).toHaveBeenCalledTimes(1);
});
test('Reduce Motion keeps the completed display static', async () => {
  (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(
    true,
  );
  (runInference as jest.Mock).mockResolvedValue({ confidenceScore: 42 });
  await mount();
  expect(texts()).toContain('100%');
  expect(Animated.loop).not.toHaveBeenCalled();
});
