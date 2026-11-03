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

test('skin around a central non-skin object cannot pass on global coverage alone', () => {
  const rgb = pixels([150, 100, 75]);
  for (let y = 5; y < 11; y++) {
    for (let x = 5; x < 11; x++) rgb.set([30, 60, 180], (y * 16 + x) * 3);
  }
  const result = inspectSkinAppearance(rgb, 16);
  expect(result.coverage).toBeGreaterThan(0.6);
  expect(result.accepted).toBe(false);
});

test('a scattered minority of skin-like pixels is not sufficient', () => {
  const rgb = pixels([220, 220, 220]);
  for (let i = 0; i < 16 * 16; i += 2) rgb.set([150, 100, 75], i * 3);
  expect(inspectSkinAppearance(rgb, 16).accepted).toBe(false);
  expect(inspectSkinAppearance(rgb, 16, 'capture').accepted).toBe(false);
});

test('a centered connected hand area can pass capture despite a large non-skin background', () => {
  const rgb = pixels([235, 235, 235]);
  for (let y = 4; y < 12; y++)
    for (let x = 3; x < 12; x++) rgb.set([150, 100, 75], (y * 16 + x) * 3);
  const result = inspectSkinAppearance(rgb, 16, 'capture');
  expect(result.coverage).toBeLessThan(0.6);
  expect(result.accepted).toBe(true);
});

test('a dark lesion in the center does not invalidate its surrounding skin', () => {
  const rgb = pixels([150, 100, 75]);
  for (let y = 5; y < 11; y++)
    for (let x = 5; x < 11; x++) rgb.set([20, 18, 17], (y * 16 + x) * 3);
  const result = inspectSkinAppearance(rgb, 16, 'roi');
  expect(result.centerCoverage).toBeLessThan(0.65);
  expect(result.surroundingCoverage).toBe(1);
  expect(result.accepted).toBe(true);
});

test.each([
  [0, 0, 255],
  [0, 255, 0],
  [240, 240, 240],
  [20, 20, 20],
])('obvious non-skin stays rejected in capture mode: %j', (r, g, b) => {
  expect(inspectSkinAppearance(pixels([r, g, b]), 16, 'capture').accepted).toBe(
    false,
  );
});

test('a grey central object cannot use skin-coloured surroundings as skin proof', () => {
  const rgb = pixels([150, 100, 75]);
  for (let y = 6; y < 10; y++)
    for (let x = 6; x < 10; x++) rgb.set([125, 125, 125], (y * 16 + x) * 3);
  expect(inspectSkinAppearance(rgb, 16, 'capture').accepted).toBe(false);
  expect(inspectSkinAppearance(rgb, 16, 'roi').accepted).toBe(false);
});
