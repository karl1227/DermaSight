import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { LesionExplanationCard } from '../src/components/LesionExplanationCard';
import { CLASSIFIER_LABELS } from '../src/config/classifier';

async function renderExplanation(lesion: string, confidence: number) {
  let tree!: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(
      <LesionExplanationCard lesion={lesion} confidence={confidence} />,
    );
  });
  const text = tree.root
    .findAllByType(Text)
    .map(node => React.Children.toArray(node.props.children).join(''))
    .join('\n');
  await act(async () => tree.unmount());
  return text;
}

test.each(CLASSIFIER_LABELS)(
  '%s has education without claiming observed image features',
  async lesion => {
    const text = await renderExplanation(lesion, 90);
    expect(text).toContain(lesion);
    expect(text).toContain('Description');
    expect(text).toContain(
      'general reference features, not findings confirmed in your photo',
    );
    expect(text).toContain('not the probability');
    expect(text).toContain('does not report which specific features');
    expect(text).not.toContain('not available');
    expect(text).not.toContain('Treat this prediction as uncertain');
  },
);

test('low confidence remains uncertain and does not become a confident diagnosis', async () => {
  const text = await renderExplanation('Melanocytic Nevi', 49);
  expect(text).toContain('Treat this prediction as uncertain');
  expect(text).toContain('49');
  expect(text).toContain('See a dermatologist');
});

test('unrecognised saved labels do not get an unrelated lesion description', async () => {
  const text = await renderExplanation('Unknown legacy label', 30);
  expect(text).toContain('not available for this saved label');
  expect(text).not.toContain('Common features of this lesion type');
});
