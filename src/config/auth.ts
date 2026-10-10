// Public URL only. LAN HTTP is allowed only in development; release needs your HTTPS endpoint.
export const AUTH_API_URL: string = __DEV__ ? 'http://192.168.3.14:3001' : '';

// Public OAuth client IDs only; never put a client secret here. See GOOGLE_SIGN_IN_SETUP.md.
export const GOOGLE_WEB_CLIENT_ID: string =
  '425767066017-co93d0o27chvd6tod4l4rsrq4on14fjm.apps.googleusercontent.com';
export const GOOGLE_IOS_CLIENT_ID: string =
  '425767066017-uepc5ess1qu51ggppa5kg5rrnkb3qfgp.apps.googleusercontent.com';
