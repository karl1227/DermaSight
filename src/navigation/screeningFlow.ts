import {
  CommonActions,
  type NavigationProp,
  type NavigationAction,
} from '@react-navigation/native';
import type { RootStackParamList, TabParamList } from '../types';
import { secureId } from '../utils/secureId';

type Navigation = { dispatch: (action: NavigationAction) => void };
function resetStack(
  navigation: Navigation,
  state: Parameters<NavigationProp<RootStackParamList>['reset']>[0],
) {
  navigation.dispatch(CommonActions.reset(state));
}

export function returnToDashboard(
  navigation: Navigation,
  screen: keyof TabParamList = 'Home',
) {
  resetStack(navigation, {
    index: 0,
    routes: [{ name: 'MainTabs', params: { screen } }],
  });
}

export function startNewScreening(navigation: Navigation) {
  // Never leave a completed result or report underneath a new assessment.
  resetStack(navigation, {
    index: 1,
    routes: [
      { name: 'MainTabs', params: { screen: 'Home' } },
      { name: 'PatientInfo' },
    ],
  });
}

export function retakeScreeningImage(
  navigation: Navigation,
  result: RootStackParamList['Result'],
) {
  const id = secureId();
  // Keep the entered context, but never overwrite the already saved assessment.
  const patientInfo = {
    ...result.patientInfo,
    patientId: id,
    screeningId: id,
    createdAt: new Date().toISOString(),
  };
  resetStack(navigation, {
    index: 1,
    routes: [
      { name: 'MainTabs', params: { screen: 'Home' } },
      { name: 'Camera', params: { patientInfo, symptoms: result.symptoms } },
    ],
  });
}

export function showScreeningResult(
  navigation: Navigation,
  params: RootStackParamList['Result'],
) {
  resetStack(navigation, {
    index: 1,
    routes: [
      { name: 'MainTabs', params: { screen: 'Home' } },
      { name: 'Result', params },
    ],
  });
}

export function showSavedReport(navigation: Navigation, recordId: number) {
  resetStack(navigation, {
    index: 1,
    routes: [
      { name: 'MainTabs', params: { screen: 'History' } },
      { name: 'Report', params: { recordId } },
    ],
  });
}
