import { inspectSkinAppearance } from '../src/services/skinAppearance';
function pixels(color: number[]) {
  return Uint8Array.from(Array.from({ length: 16 * 16 }, () => color).flat());
}
test.each([
  [230, 170, 135],
  [150, 100, 75],
  [65, 38, 25],
])(
  'prototype accepts skin-like chroma %j without a light-skin cutoff',
  (r, g, b) => {
    expect(inspectSkinAppearance(pixels([r, g, b]), 16).accepted).toBe(true);
  },
);
test.each([
  [240, 240, 240],
  [50, 50, 50],
  [0, 0, 255],
  [0, 255, 0],
  [0, 0, 0],
])('obvious non-skin colour %j is rejected', (r, g, b) => {
  expect(inspectSkinAppearance(pixels([r, g, b]), 16).accepted).toBe(false);
});
test('a small skin-like patch alone does not qualify an image', () => {
  const rgb = pixels([255, 255, 255]);
  rgb.set([230, 170, 135], (8 * 16 + 8) * 3);
  expect(inspectSkinAppearance(rgb, 16).accepted).toBe(false);
});
test('documents limitation: an object with identical skin-like colours also passes', () => {
  expect(inspectSkinAppearance(pixels([150, 100, 75]), 16).accepted).toBe(true);
});
test('malformed pixels are rejected', () => {
  expect(() => inspectSkinAppearance(new Uint8Array(2), 16)).toThrow('Invalid');
});
