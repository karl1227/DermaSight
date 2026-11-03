import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { AccessibilityInfo, Animated, Image, StyleSheet } from 'react-native';
import {
  LesionRegionPreview,
  validLesionBounds,
} from '../src/components/LesionRegionPreview';

const original = {
  uri: 'file:///original.jpg',
  path: '/original.jpg',
  width: 600,
  height: 450,
  fileSize: 50000,
};
const selected = {
  uri: 'file:///crop.jpg',
  path: '/crop.jpg',
  width: 300,
  height: 300,
  fileSize: 20000,
};
const bounds = { left: 0.25, top: 0.2, right: 0.75, bottom: 0.8 };
let tree: Renderer.ReactTestRenderer;
beforeEach(() => {
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(false);
});
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  jest.restoreAllMocks();
});
async function mount(region: typeof bounds | undefined = bounds) {
  await act(async () => {
    tree = Renderer.create(
      <LesionRegionPreview
        original={original}
        selected={selected}
        bounds={region}
        cropped={!!region}
        size={300}
        mode="crop"
      />,
    );
  });
}
test('highlights actual bounds with letterboxing and transitions only after both images load', async () => {
  let complete!: (result: { finished: boolean }) => void;
  const start = jest.fn(callback => {
    complete = callback;
  });
  const stop = jest.fn();
  jest
    .spyOn(Animated, 'sequence')
    .mockReturnValue({ start, stop, reset: jest.fn() });
  await mount();
  expect(start).not.toHaveBeenCalled();
  const outline = tree.root.findAll(
    node => node.props.testID === 'lesion-region-outline',
  )[0];
  const box = StyleSheet.flatten(outline.props.style);
  expect(box).toMatchObject({
    left: 75,
    top: 82.5,
    width: 150,
  });
  expect(box.height).toBeCloseTo(135);
  await act(async () =>
    tree.root.findAllByType(Image).forEach(image => image.props.onLoad()),
  );
  expect(start).toHaveBeenCalledTimes(1);
  await act(async () => complete({ finished: true }));
  expect(tree.root.findByType(Image).props.source.uri).toBe(selected.uri);
  expect(stop).toHaveBeenCalled();
});
test('Reduce Motion reveals the real crop immediately', async () => {
  (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(
    true,
  );
  await mount();
  expect(tree.root.findByType(Image).props.source.uri).toBe(selected.uri);
});
test('no detected bounds means no fabricated highlight', async () => {
  await act(async () => {
    tree = Renderer.create(
      <LesionRegionPreview
        original={original}
        selected={original}
        cropped={false}
        size={300}
        mode="crop"
      />,
    );
  });
  expect(
    tree.root.findAll(node => node.props.testID === 'lesion-region-outline'),
  ).toHaveLength(0);
  expect(tree.root.findByType(Image).props.source.uri).toBe(original.uri);
});
test('invalid or inverted coordinates cannot draw a misleading region', () => {
  expect(
    validLesionBounds({ left: 0.8, top: 0.1, right: 0.2, bottom: 0.9 }),
  ).toBe(false);
  expect(validLesionBounds({ ...bounds, left: NaN })).toBe(false);
});

test('the original-photo fallback completes without inventing a detected region', async () => {
  const onComplete = jest.fn();
  await act(async () => {
    tree = Renderer.create(
      <LesionRegionPreview
        original={original}
        selected={original}
        cropped={false}
        size={300}
        mode="crop"
        onComplete={onComplete}
      />,
    );
  });
  await act(async () => tree.root.findByType(Image).props.onLoad());
  expect(onComplete).toHaveBeenCalledTimes(1);
  expect(
    tree.root.findAll(node => node.props.testID === 'lesion-region-outline'),
  ).toHaveLength(0);
});
