# Google Sign-In setup for DermaSight

The app uses the existing DermaSight account server plus Google's native Sign-In SDK. You do not need Firebase, a Google client secret, PHP mail, or a new database service. The supplied Web and iOS client IDs are now configured, and the iOS callback URL scheme has been added. Add your sign-in email as a Google test user and verify the flow on the rebuilt phone app. Android OAuth configuration and test users have also been supplied; Google sign-in has been reported working on the phone.

## 1. Create your Google project

1. Open https://console.cloud.google.com/ and sign in to your Google account.
2. Use the project selector at the top → New project. Name it **DermaSight** and create it.
3. Open **Google Auth Platform** (or APIs & Services → OAuth consent screen if the console shows that menu).
4. Complete **Branding**: app name DermaSight, your support email, and your developer contact email.
5. Choose **External** audience for ordinary Gmail accounts. While testing, keep Testing status and add your own Google email under **Audience → Test users**.
6. Only basic sign-in identity is needed: OpenID, email, profile. Do not request Drive, Gmail, or health scopes.

Console labels can change. Google's configuration guide is linked below.

## 2. Create the Web client ID (required even for iPhone)

1. Open **Clients → Create client** (or Credentials → Create credentials → OAuth client ID).
2. Select **Web application** and name it **DermaSight account server**.
3. This native ID-token integration does not use a browser redirect route. Leave authorized JavaScript origins and redirect URIs empty.
4. Create it and copy the **Client ID**, which ends in `.apps.googleusercontent.com`.
5. Save it as `GOOGLE_WEB_CLIENT_ID` in `src/config/auth.ts`.
6. The same public ID must be passed to the backend as the environment variable `GOOGLE_WEB_CLIENT_ID`. The SDK requests an ID token for this audience, and the server verifies it.

Do not paste a client secret into the app, this chat, or Git. This implementation does not use one.

## 3. Create the iOS client ID

1. Create another OAuth client of type **iOS**.
2. Name it **DermaSight iPhone**.
3. Enter this project's current bundle ID exactly: **com.emman.dermasight**.
4. Create the client. Copy its **Client ID** into `GOOGLE_IOS_CLIENT_ID` in `src/config/auth.ts`.
5. Copy its **iOS URL scheme / reversed client ID**. It usually starts with `com.googleusercontent.apps.`. Use the value displayed by Google, not the Web client's ID.
6. Open `ios/SkinSense.xcworkspace` in Xcode. Select the SkinSense target → **Info → URL Types** → **+**. Put the reversed client ID in **URL Schemes**. Use role Editor. Keep any existing URL types.
7. Save. The existing Swift AppDelegate now forwards the Google callback to Google's SDK.

The URL scheme is required. The provided Google Web/iOS IDs and the reversed iOS callback scheme are now set in this checkout. The setup check remains for installations without client IDs.

## 4. Add Android configuration when testing Android

1. Create another OAuth client of type **Android**.
2. Package name: **com.skinsense** (this is the existing Android application ID; do not rename it just to match the UI).
3. For this repository's current debug keystore, enter SHA-1:

   `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`

4. Create the client. Its existence registers the package/signing certificate; its ID is not used in `GOOGLE_WEB_CLIENT_ID`.
5. When distributing a release or Play Store build, register the corresponding release/Play signing SHA-1 separately. The value above applies only to the current debug keystore.

No `google-services.json`, Firebase plugin, or `GoogleService-Info.plist` is required for this configuration.

## 5. Start the backend with Google enabled

Stop the old account-server terminal using Ctrl+C. From the project folder:

```sh
cd /Users/emman/Documents/SIA2GIT/DermaSight
AUTH_HOST=0.0.0.0 npm --prefix backend start
```

The start command automatically loads the public Web client ID from the ignored `backend/.env` file. No client secret is stored or used. Leave this terminal running. Do not delete `backend/data`: it contains the existing accounts. The phone must reach the Mac on the same network; `AUTH_API_URL` must match your Mac's current LAN IP. Release builds require a deployed HTTPS account-server URL. A development LAN backend is not a public deployment.

## 6. Rebuild the iPhone app

Native libraries were added, so saving JavaScript alone is insufficient for this first update.

```sh
cd /Users/emman/Documents/SIA2GIT/DermaSight/ios
PATH=/opt/homebrew/opt/ruby/bin:$PATH bundle exec pod install
```

In a separate terminal:

```sh
cd /Users/emman/Documents/SIA2GIT/DermaSight
npm start
```

Open `ios/SkinSense.xcworkspace`. Keep your Personal Team signing configuration, select your actual connected iPhone at the top, then press Run (⌘R). An emulator is not required. The physical phone's Debug app needs Metro for development; a Release build bundles JavaScript and does not use Metro.

## 7. Test the flow

1. Open Sign In → Google's sign-in button.
2. Choose your test Google account. Cancel once and check that the guest/welcome flow remains usable.
3. For a new account, confirm your full name and select sex, then tap Continue to enter the app. Set a DermaSight password later under Settings → Security → Add Password if you want manual login. Sex is not guessed from Google data.
4. If you started as a guest, its current scans are transferred to this newly created account transactionally.
5. Sign out, then sign in with the same Google account. Check its history.
6. Try a second Google account: the first account's history must remain hidden.
7. Turn off the internet. Local screening/history remain available with a valid cached session; new Google sign-in requires internet.

If the verified Google email belongs to an existing password account, the same form asks for that account’s current password before linking Google. Both methods then use the same permanent account ID. Email matching alone never grants access. Existing Google-only users can add a DermaSight password in Settings → Security after confirming their Google identity again.

## Two-step verification

Users can enable Google's own 2-Step Verification at https://myaccount.google.com/security. Google controls challenges during Google Sign-In. DermaSight does not currently require app-level MFA, and Google ID tokens are not treated as proof of a second factor. Email/password accounts do not have MFA. No OTP secrets or verification codes are stored in the app database. App-enforced MFA needs an additional supported authentication-provider integration and corresponding enrollment/recovery flows.

## References

- [SDK client configuration](https://react-native-google-signin.github.io/docs/setting-up/get-config-file)
- [SDK iOS setup](https://react-native-google-signin.github.io/docs/setting-up/ios)
- [Google's iOS client/server ID and URL scheme guide](https://developers.google.com/identity/sign-in/ios/start-integrating)
- [Google's backend ID-token verification guide](https://developers.google.com/identity/sign-in/web/backend-auth)
- [Google account 2-Step Verification](https://support.google.com/accounts/answer/185839)
