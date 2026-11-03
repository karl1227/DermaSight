import { prepareCapture } from '../src/services/capturePreparationService';
import { validateSkin } from '../src/services/skinValidationService';
import {
  assessImageQuality,
  isOriginalJpegSource,
} from '../src/services/imageProcessingService';
import { createAutomaticAreaOfInterest } from '../src/services/segmentationService';
import { runPreprocessing } from '../src/services/preprocessingService';

jest.mock('react-native-image-resizer', () => ({
  __esModule: true,
  default: {
    createResizedImage: jest.fn(async () => ({
      uri: 'file:///normalized.jpg',
      path: '/normalized.jpg',
      width: 1024,
      height: 768,
      size: 100000,
    })),
  },
}));
jest.mock('../src/services/skinValidationService', () => ({
  validateSkin: jest.fn(async () => {}),
}));
jest.mock('../src/services/imageProcessingService', () => ({
  assessImageQuality: jest.fn(),
  isOriginalJpegSource: jest.fn(),
}));
jest.mock('../src/services/segmentationService', () => ({
  createAutomaticAreaOfInterest: jest.fn(),
}));
jest.mock('../src/services/preprocessingService', () => ({
  runPreprocessing: jest.fn(),
}));
const quality = assessImageQuality as jest.Mock;
const skin = validateSkin as jest.Mock;
const aoi = createAutomaticAreaOfInterest as jest.Mock;
const preprocessing = runPreprocessing as jest.Mock;
const source = { filePath: '/original.jpg' };
beforeEach(() => {
  jest.clearAllMocks();
  skin.mockResolvedValue('model');
  (isOriginalJpegSource as jest.Mock).mockResolvedValue(true);
  quality.mockResolvedValue({
    metrics: { brightness: 120, sharpness: 20, width: 1024, height: 768 },
  });
  aoi.mockResolvedValue({ segmentation: { lesionDetected: false } });
  preprocessing.mockResolvedValue({
    id: 'tensor-id',
    width: 224,
    height: 224,
    channels: 3,
    inputRange: '0-255',
  });
});
test('skin rejection blocks preprocessing without running U-Net', async () => {
  skin.mockRejectedValue(new Error('Human skin could not be confirmed.'));
  await expect(prepareCapture(source, undefined, jest.fn())).rejects.toThrow(
    'Human skin',
  );
  expect(quality).toHaveBeenCalledTimes(1);
  expect(aoi).not.toHaveBeenCalled();
  expect(preprocessing).not.toHaveBeenCalled();
});
test.each([
  [{ brightness: 10 }, 'dark'],
  [{ brightness: 250 }, 'glare'],
  [{ sharpness: 0.5 }, 'blurred'],
  [{ width: 100 }, 'small'],
])(
  'unusable quality blocks ROI and preprocessing: %j',
  async (metrics, message) => {
    quality.mockResolvedValue({
      metrics: {
        brightness: 120,
        sharpness: 20,
        width: 1024,
        height: 768,
        ...metrics,
      },
    });
    await expect(prepareCapture(source, undefined, jest.fn())).rejects.toThrow(
      message,
    );
    expect(aoi).not.toHaveBeenCalled();
    expect(preprocessing).not.toHaveBeenCalled();
  },
);
test.each(['/camera.jpg', '/gallery.jpg'])(
  'full photo is preprocessed without U-Net for %s',
  async filePath => {
    // Even a model that could propose a crop must never be called in this flow.
    aoi.mockResolvedValue({
      image: { path: '/roi.jpg', width: 500, height: 500 },
    });
    const stages: string[] = [];
    const result = await prepareCapture({ filePath }, undefined, stage =>
      stages.push(stage),
    );
    expect(result.cropped).toBe(false);
    expect(result.lesionBounds).toBeUndefined();
    expect(result.image).toBe(result.originalImage);
    expect(result.image.path).toBe(filePath);
    expect(aoi).not.toHaveBeenCalled();
    expect(skin).toHaveBeenCalledTimes(1);
    expect(skin).toHaveBeenCalledWith(
      { filePath: '/normalized.jpg', mimeType: 'image/jpeg' },
      'capture',
    );
    expect(preprocessing).toHaveBeenCalledWith(
      { filePath, mimeType: 'image/jpeg' },
      expect.any(Function),
    );
    expect(stages).toEqual([
      'Preparing image',
      'Checking image quality',
      'Checking for skin',
      'Preparing for analysis',
    ]);
  },
);
test('retake cancellation during validation prevents preprocessing', async () => {
  let cancelled = false;
  skin.mockImplementationOnce(async () => {
    cancelled = true;
  });
  await expect(
    prepareCapture(source, undefined, jest.fn(), () => cancelled),
  ).rejects.toThrow('cancelled');
  expect(quality).toHaveBeenCalledTimes(1);
  expect(preprocessing).not.toHaveBeenCalled();
});
test('a retaken non-skin image is checked again after a previous accepted image', async () => {
  await prepareCapture(source, undefined, jest.fn());
  jest.clearAllMocks();
  skin.mockRejectedValueOnce(new Error('Skin could not be confirmed.'));
  await expect(
    prepareCapture({ filePath: '/retake.jpg' }, undefined, jest.fn()),
  ).rejects.toThrow('Skin');
  expect(skin).toHaveBeenCalledTimes(1);
  expect(preprocessing).not.toHaveBeenCalled();
  expect(aoi).not.toHaveBeenCalled();
});

test('non-JPEG or inaccessible original keeps native format conversion', async () => {
  (isOriginalJpegSource as jest.Mock).mockResolvedValue(false);
  const result = await prepareCapture(
    { filePath: '/gallery.heic', mimeType: 'image/heic' },
    undefined,
    jest.fn(),
  );
  expect(result.image.path).toBe('/normalized.jpg');
  expect(preprocessing).toHaveBeenCalledWith(
    { filePath: '/normalized.jpg', mimeType: 'image/jpeg' },
    expect.any(Function),
  );
});
