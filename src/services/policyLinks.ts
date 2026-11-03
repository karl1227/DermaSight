import { Alert, Linking } from 'react-native';
import { POLICY_BASE_URL, POLICY_PAGE_PATHS } from '../config/policies';

export async function openPolicy(
  kind: 'privacy' | 'medical-disclaimer' | 'about',
  anchor?: 'references',
) {
  if (!POLICY_BASE_URL) {
    Alert.alert(
      'Page unavailable',
      'The full policy website has not been configured. Please contact the project team.',
    );
    return;
  }
  try {
    await Linking.openURL(
      `${POLICY_BASE_URL.replace(/\/$/, '')}${POLICY_PAGE_PATHS[kind]}${
        anchor ? `#${anchor}` : ''
      }`,
    );
  } catch {
    Alert.alert(
      'Could not open browser',
      'Please try again. The information website requires an internet connection.',
    );
  }
}
