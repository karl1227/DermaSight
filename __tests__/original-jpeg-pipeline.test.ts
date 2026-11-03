import { Buffer } from 'buffer';
import * as jpeg from 'jpeg-js';
import RNFS from 'react-native-fs';
import { prepareCapture } from '../src/services/capturePreparationService';
import { runPreprocessing } from '../src/services/preprocessingService';
import { isOriginalJpegSource } from '../src/services/imageProcessingService';

jest.mock('react-native-fs', () => ({ read: jest.fn(), readFile: jest.fn() }));
jest.mock('react-native-image-resizer', () => ({
  __esModule: true,
  default: {
    createResizedImage: jest.fn(async () => ({
      uri: 'file:///normalized.jpg',
      path: '/normalized.jpg',
      width: 320,
      height: 320,
      size: 1000,
    })),
  },
}));
jest.mock('../src/services/skinValidationService', () => ({
  validateSkin: jest.fn(async () => 'appearance'),
}));
jest.mock('../src/services/imageProcessingService', () => ({
  ...jest.requireActual('../src/services/imageProcessingService'),
  assessImageQuality: jest.fn(async () => ({
    metrics: { width: 320, height: 320, brightness: 120, sharpness: 20 },
  })),
}));
function encodedImage(pattern: boolean) {
  const data = Buffer.alloc(320 * 320 * 4);
  for (let y = 0; y < 320; y++)
    for (let x = 0; x < 320; x++) {
      const i = (y * 320 + x) * 4;
      data[i] = pattern ? x % 256 : 220;
      data[i + 1] = pattern ? y % 256 : 110;
      data[i + 2] = pattern ? (x + y) % 256 : 50;
      data[i + 3] = 255;
    }
  return jpeg
    .encode({ data, width: 320, height: 320 }, 95)
    .data.toString('base64');
}
beforeEach(() => jest.clearAllMocks());
test('camera/gallery JPEG input is byte-for-byte identical to the earlier direct preprocessing path', async () => {
  const original = encodedImage(true);
  const normalized = encodedImage(false);
  (RNFS.read as jest.Mock).mockResolvedValue('/9j/');
  (RNFS.readFile as jest.Mock).mockImplementation(async path =>
    path === '/original.jpg' ? original : normalized,
  );
  const expected = await runPreprocessing(
    { filePath: '/original.jpg' },
    () => {},
  );
  const converted = await runPreprocessing(
    { filePath: '/normalized.jpg' },
    () => {},
  );
  const prepared = await prepareCapture(
    { filePath: 'file:///original.jpg', mimeType: 'image/jpeg' },
    { width: 320, height: 320 },
    () => {},
  );
  expect(prepared.image.path).toBe('file:///original.jpg');
  expect(prepared.cropped).toBe(false);
  expect(
    Buffer.from(prepared.preprocessing.inputTensor).equals(
      Buffer.from(expected.inputTensor),
    ),
  ).toBe(true);
  expect(
    Buffer.from(prepared.preprocessing.inputTensor).equals(
      Buffer.from(converted.inputTensor),
    ),
  ).toBe(false);
});
test('encoding is checked from JPEG bytes rather than an unreliable filename or MIME hint', async () => {
  (RNFS.read as jest.Mock).mockResolvedValue('iVBORw==');
  expect(
    await isOriginalJpegSource({
      filePath: '/claimed.jpg',
      mimeType: 'image/jpeg',
    }),
  ).toBe(false);
  (RNFS.read as jest.Mock).mockResolvedValue('/9j/');
  expect(await isOriginalJpegSource({ filePath: '/actual.jpeg' })).toBe(true);
  expect(await isOriginalJpegSource({ filePath: 'content://photos/1' })).toBe(
    false,
  );
});
