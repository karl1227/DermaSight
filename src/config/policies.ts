import { AUTH_API_URL } from './auth';

// Hosting is deferred. On a physical phone, use the Mac's LAN address from
// AUTH_API_URL rather than localhost (which would refer to the phone itself).
export const PUBLISHED_POLICY_BASE_URL: string = '';
export const POLICY_BASE_URL =
  PUBLISHED_POLICY_BASE_URL || (__DEV__ ? AUTH_API_URL : '');
export const POLICY_PAGE_PATHS = {
  about: '/index.html',
  privacy: '/privacy.html',
  'medical-disclaimer': '/medical-disclaimer.html',
};
