import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { SelectedSymptoms } from '../src/components/SelectedSymptoms';

test.each([
  [{}, {}, [], ['Selected Symptoms', 'ABCDE Criteria', 'Other Signs']],
  [
    { asymmetry: true, evolution: false },
    {},
    ['Selected Symptoms', 'A - Asymmetry'],
    ['E - Evolution', 'Other Signs'],
  ],
  [
    {},
    { itching: true, bleedingOrCrusting: false },
    ['Selected Symptoms', 'Itching', 'Other Signs'],
    ['ABCDE Criteria', 'Bleeding or crusting'],
  ],
])(
  'only selected symptoms and nonempty groups are visible',
  async (abcde, other, included, excluded) => {
    let tree!: Renderer.ReactTestRenderer;
    await act(async () => {
      tree = Renderer.create(<SelectedSymptoms abcde={abcde} other={other} />);
    });
    const content = JSON.stringify(tree.toJSON());
    included.forEach(label => expect(content).toContain(label));
    excluded.forEach(label => expect(content).not.toContain(label));
    expect(content).not.toContain('None selected');
    await act(async () => tree.unmount());
  },
);
