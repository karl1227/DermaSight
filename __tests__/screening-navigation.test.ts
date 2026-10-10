import { CommonActions } from '@react-navigation/native';
import { StackRouter, TabRouter } from '@react-navigation/routers';
import {
  startNewScreening,
  returnToDashboard,
  showSavedReport,
  showScreeningResult,
  retakeScreeningImage,
} from '../src/navigation/screeningFlow';
import { RootStackParamList } from '../src/types';
jest.mock('../src/utils/secureId', () => ({
  secureId: () => 'new-screening-id',
}));
const options = {
  routeNames: ['MainTabs', 'PatientInfo', 'Camera', 'Result', 'Report'],
  routeParamList: {},
  routeGetIdList: {},
};
const router = StackRouter({ initialRouteName: 'MainTabs' });
const result = {
  patientInfo: {
    screeningId: 'old-id',
    patientId: 'old-id',
    createdAt: 'old-date',
    fullName: 'Sample',
    age: 21,
    sex: 'Female',
    lesionLocation: 'Arm',
    owner: { kind: 'guest', id: 'guest' },
  },
  symptoms: {},
  imageUri: 'file://image',
  result: {},
} as RootStackParamList['Result'];
function setup() {
  let state = router.getRehydratedState(
    {
      stale: true,
      index: 2,
      routes: [
        { name: 'MainTabs' },
        { name: 'Result', params: result },
        { name: 'Report', params: { recordId: 10 } },
      ],
    },
    options,
  );
  const dispatch = jest.fn(action => {
    const next = router.getStateForAction(state, action, options);
    if (next) state = router.getRehydratedState(next, options);
  });
  return {
    navigation: { dispatch },
    state: () => state,
    back: () => dispatch(CommonActions.goBack()),
  };
}
test('new screening removes old result/report; Back reaches Home, and reset bubbles out of tabs', () => {
  const flow = setup();
  startNewScreening(flow.navigation);
  const tabs = TabRouter({ initialRouteName: 'Home' });
  const tabOptions = {
    routeNames: ['Home', 'History', 'Profile'],
    routeParamList: {},
    routeGetIdList: {},
  };
  expect(
    tabs.getStateForAction(
      tabs.getInitialState(tabOptions),
      flow.navigation.dispatch.mock.calls[0][0],
      tabOptions,
    ),
  ).toBeNull();
  expect(flow.state().routes.map(route => route.name)).toEqual([
    'MainTabs',
    'PatientInfo',
  ]);
  flow.back();
  expect(flow.state().routes).toHaveLength(1);
  expect(flow.state().routes[0].params).toEqual({ screen: 'Home' });
});
test('completed result goes back Home; saved report goes back Records; Home clears old screens', () => {
  const flow = setup();
  showScreeningResult(flow.navigation, result);
  flow.back();
  expect(flow.state().routes[0].params).toEqual({ screen: 'Home' });
  showSavedReport(flow.navigation, 20);
  expect(flow.state().routes[1].params).toEqual({ recordId: 20 });
  flow.back();
  expect(flow.state().routes[0].params).toEqual({ screen: 'History' });
  returnToDashboard(flow.navigation);
  expect(flow.state().routes).toHaveLength(1);
  expect(flow.state().routes[0].params).toEqual({ screen: 'Home' });
});
test('retake opens Camera with retained context and a fresh assessment ID', () => {
  const flow = setup();
  retakeScreeningImage(flow.navigation, result);
  expect(flow.state().routes.map(route => route.name)).toEqual([
    'MainTabs',
    'Camera',
  ]);
  const params = flow.state().routes[1].params as RootStackParamList['Camera'];
  expect(params.patientInfo.fullName).toBe(result.patientInfo.fullName);
  expect(params.patientInfo.screeningId).toBe('new-screening-id');
  expect(result.patientInfo.screeningId).toBe('old-id');
  flow.back();
  expect(flow.state().routes).toHaveLength(1);
});
