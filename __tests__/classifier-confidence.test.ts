import { loadTensorflowModel } from 'react-native-fast-tflite';
import { loadResizedImageRgb } from '../src/services/imageProcessingService';
import { getPreprocessedResult } from '../src/services/preprocessingService';
import { runInference } from '../src/services/tfliteService';
const mockRun = jest.fn();
const mockInputs = [{ dataType: 'float32', shape: [1, 224, 224, 3] }];
const mockOutputs = [{ dataType: 'float32', shape: [1, 7] }];
jest.mock('react-native-fast-tflite', () => ({
  loadTensorflowModel: jest.fn(async () => ({
    run: mockRun,
    inputs: mockInputs,
    outputs: mockOutputs,
  })),
}));
jest.mock('react-native-fs', () => ({}));
jest.mock('../src/assets/models/efficientnet_ham10000.tflite', () => 99);
jest.mock('../src/services/imageProcessingService', () => ({
  loadResizedImageRgb: jest.fn(),
}));
jest.mock('../src/services/preprocessingService', () => ({
  getPreprocessedResult: jest.fn(),
}));
const symptoms = {} as any;
beforeEach(() => {
  jest.clearAllMocks();
  (getPreprocessedResult as jest.Mock).mockReturnValue(undefined);
});
test('uses the EfficientNet asset, raw RGB float32 input, and an unmodified top probability', async () => {
  const rgb = new Uint8Array(224 * 224 * 3);
  rgb.set([0, 128, 255]);
  (loadResizedImageRgb as jest.Mock).mockResolvedValue(rgb);
  mockRun.mockResolvedValue([
    Float32Array.from([0.01, 0.01, 0.01, 0.01, 0.01, 0.94, 0.01]).buffer,
  ]);
  const result = await runInference({ filePath: '/original.jpg' }, symptoms);
  expect(loadTensorflowModel).toHaveBeenCalledWith(99, []);
  expect(loadResizedImageRgb).toHaveBeenCalledWith(
    { filePath: '/original.jpg' },
    224,
  );
  const input = new Float32Array(mockRun.mock.calls[0][0][0]);
  expect(Array.from(input.slice(0, 3))).toEqual([0, 128, 255]);
  expect(input.length).toBe(224 * 224 * 3);
  expect(result.predictedLesionType).toBe('Melanocytic Nevi');
  expect(result.confidenceScore).toBe(94);
});
test('a low model probability stays low and the exact prepared crop tensor is used', async () => {
  const tensor = new ArrayBuffer(224 * 224 * 3 * 4);
  (getPreprocessedResult as jest.Mock).mockReturnValue({ inputTensor: tensor });
  mockRun.mockResolvedValue([
    Float32Array.from([0.12, 0.18, 0.05, 0.03, 0.22, 0.35, 0.05]).buffer,
  ]);
  const result = await runInference(
    { filePath: '/roi.jpg' },
    symptoms,
    'prepared-roi',
  );
  expect(mockRun.mock.calls[0][0][0]).toBe(tensor);
  expect(loadResizedImageRgb).not.toHaveBeenCalled();
  expect(result.confidenceScore).toBe(35);
  expect(result.thresholdStatus).toBe('Below Threshold');
});

test.each([
  [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
  [2, -1, 0, 0, 0, 0, 0],
  [NaN, 0, 0, 0, 0, 0, 1],
])(
  'invalid probabilities are rejected, never converted into confidence: %j',
  async (...scores) => {
    (getPreprocessedResult as jest.Mock).mockReturnValue({
      inputTensor: new ArrayBuffer(224 * 224 * 3 * 4),
    });
    mockRun.mockResolvedValue([Float32Array.from(scores).buffer]);
    await expect(
      runInference({ filePath: '/roi.jpg' }, symptoms, 'prepared'),
    ).rejects.toThrow('Unexpected model output');
  },
);
test('invalid input values are blocked before native inference', async () => {
  const input = new Float32Array(224 * 224 * 3);
  input[0] = NaN;
  (getPreprocessedResult as jest.Mock).mockReturnValue({
    inputTensor: input.buffer,
  });
  await expect(
    runInference({ filePath: '/roi.jpg' }, symptoms, 'prepared'),
  ).rejects.toThrow('image tensor is invalid');
  expect(mockRun).not.toHaveBeenCalled();
});
test('incompatible native tensor metadata is rejected before inference', async () => {
  const previous = mockInputs[0].shape;
  mockInputs[0].shape = [1, 256, 256, 3];
  try {
    await expect(
      runInference({ filePath: '/roi.jpg' }, symptoms),
    ).rejects.toThrow('classifier format is incompatible');
  } finally {
    mockInputs[0].shape = previous;
  }
  expect(mockRun).not.toHaveBeenCalled();
});
