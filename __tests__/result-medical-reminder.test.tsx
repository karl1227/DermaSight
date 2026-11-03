import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { Text, Image } from 'react-native';
import { ResultScreen } from '../src/screens/ResultScreen';
import { ReportScreen } from '../src/screens/ReportScreen';
import { DisclaimerCard } from '../src/components/DisclaimerCard';
import { getScreeningById, insertScreening } from '../src/database/database';

const mockOwner = { kind: 'guest', id: 'guest' };
jest.mock('../src/auth/AuthContext', () => ({
  useAuth: () => ({ owner: mockOwner }),
}));
jest.mock('../src/database/database', () => ({
  historyEnabledFor: jest.fn(async () => false),
  insertScreening: jest.fn(),
  getScreeningById: jest.fn(),
  deleteScreening: jest.fn(),
  updatePatientInfo: jest.fn(),
}));
jest.mock('../src/services/imageStorageService', () => ({
  saveImageLocally: jest.fn(),
  deleteLocalImage: jest.fn(),
  toImageUri: (value: string) => value,
}));
const navigation = { navigate: jest.fn(), dispatch: jest.fn() } as any;
const patientInfo = {
  screeningId: 'screening',
  patientId: 'screening',
  fullName: 'Test',
  age: 24,
  sex: 'Female',
  owner: { kind: 'guest', id: 'guest' },
};
let tree: Renderer.ReactTestRenderer;
beforeEach(() => jest.clearAllMocks());
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
});
const content = () =>
  tree.root
    .findAllByType(Text)
    .map(node => node.props.children)
    .join(' ');
function expectSectionOrder() {
  const nodes = tree.root.findAll(
    node => node.type === Text || node.type === Image,
  );
  const index = (title: string) =>
    nodes.findIndex(
      node => node.type === Text && node.props.children === title,
    );
  const patient = index('Patient Information');
  const classification = index('Classification Result');
  const explanation = index('Lesion Information');
  const disclaimer = index('Unsure? See a dermatologist');
  expect(patient).toBeGreaterThanOrEqual(0);
  expect(classification).toBeGreaterThan(patient);
  expect(explanation).toBeGreaterThan(classification);
  expect(disclaimer).toBeGreaterThan(explanation);
  const image = nodes.findIndex(node => node.type === Image);
  if (image >= 0) expect(image).toBeLessThan(patient);
  expect(content()).not.toContain('None selected');
  expect(content()).not.toContain('Selected Symptoms');
}
test.each([
  ['High Risk', 95],
  ['Medium Risk', 85],
  ['Low Risk', 99],
  ['Low Confidence', 40],
])(
  'every %s result shows the same professional-assessment reminder at %s%% confidence',
  async (screeningStatus, confidenceScore) => {
    const result = {
      predictedLesionType: 'Melanocytic Nevi',
      confidenceScore,
      screeningStatus,
      thresholdStatus:
        confidenceScore < 70 ? 'Below Threshold' : 'Above Threshold',
      matchingVisualFeatures: [],
      assessmentMessage: 'Model estimate',
    };
    await act(async () => {
      tree = Renderer.create(
        <ResultScreen
          navigation={navigation}
          route={
            {
              params: {
                patientInfo,
                symptoms: { other: {}, abcde: {} },
                imageUri: '/image.jpg',
                result,
              },
            } as any
          }
        />,
      );
    });
    expectSectionOrder();
    expect(tree.root.findAllByType(DisclaimerCard)).toHaveLength(1);
    expect(content()).toContain('regardless of the result or confidence score');
    expect(content()).toContain('even if it says Low Risk');
    expect(content()).toContain('not a diagnosis');
    expect(navigation.navigate).not.toHaveBeenCalled();
    await act(async () =>
      tree.root.findByType(DisclaimerCard).props.onReadMore(),
    );
    expect(navigation.navigate).toHaveBeenCalledWith(
      'SettingsMedicalDisclaimer',
    );
    expect(insertScreening).not.toHaveBeenCalled();
  },
);
test('the reminder is also displayed when opening an existing saved report', async () => {
  (getScreeningById as jest.Mock).mockResolvedValue({
    id: 4,
    full_name: 'Test',
    age: 24,
    sex: 'Female',
    patient_id: 'old-screening',
    lesion_location: 'Forearm',
    screening_status: 'Generally Benign',
    predicted_lesion_type: 'Melanocytic Nevi',
    confidence_score: 99,
    threshold_status: 'Above Threshold',
    created_at: '2026-10-30T00:00:00Z',
    image_path: '',
    abcde_answers: '{}',
    selected_symptoms: '{}',
    matching_visual_features: '[]',
  });
  await act(async () => {
    tree = Renderer.create(
      <ReportScreen
        navigation={navigation}
        route={{ params: { recordId: 4 } } as any}
      />,
    );
  });
  expectSectionOrder();
  expect(tree.root.findAllByType(DisclaimerCard)).toHaveLength(1);
  expect(content()).toContain('regardless of the result or confidence score');
  await act(async () =>
    tree.root.findByType(DisclaimerCard).props.onReadMore(),
  );
  expect(navigation.navigate).toHaveBeenCalledWith('SettingsMedicalDisclaimer');
});
