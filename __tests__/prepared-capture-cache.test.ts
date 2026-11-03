import { CAPTURE_INPUT_VERSION } from '../src/config/capture';
import {
  cachePreparedCapture,
  takePreparedCapture,
} from '../src/services/preparedCaptureCache';
const owner = { kind: 'user' as const, id: 'a' };
const prepared = {
  inputVersion: CAPTURE_INPUT_VERSION,
  preprocessing: { id: 'tensor' },
} as any;
test('prepared crops are one-use and bound to owner, source and expiry', () => {
  cachePreparedCapture('same', owner, '/photo.jpg', prepared);
  expect(
    takePreparedCapture('same', { kind: 'user', id: 'b' }, '/photo.jpg'),
  ).toBeUndefined();
  cachePreparedCapture('same', owner, '/photo.jpg', prepared);
  expect(takePreparedCapture('same', owner, '/other.jpg')).toBeUndefined();
  cachePreparedCapture('same', owner, '/photo.jpg', prepared);
  expect(takePreparedCapture('same', owner, '/photo.jpg')).toBe(prepared);
  expect(takePreparedCapture('same', owner, '/photo.jpg')).toBeUndefined();
  const clock = jest.spyOn(Date, 'now').mockReturnValue(1000);
  cachePreparedCapture('expired', owner, '/photo.jpg', prepared);
  clock.mockReturnValue(1000 + 5 * 60000 + 1);
  expect(takePreparedCapture('expired', owner, '/photo.jpg')).toBeUndefined();
  clock.mockRestore();
});

test('a cached U-Net crop from before the no-crop change is discarded', () => {
  cachePreparedCapture('old-crop', owner, '/photo.jpg', {
    ...prepared,
    cropped: true,
  });
  expect(takePreparedCapture('old-crop', owner, '/photo.jpg')).toBeUndefined();
});

test('a full-photo tensor prepared by the previous normalization pipeline is discarded', () => {
  cachePreparedCapture('old-normalized', owner, '/photo.jpg', {
    ...prepared,
    inputVersion: 'normalized-no-crop-v1',
  });
  expect(
    takePreparedCapture('old-normalized', owner, '/photo.jpg'),
  ).toBeUndefined();
});
