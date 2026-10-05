# DermaSight accounts, guests, and screening ownership

Implemented on 2026-10-05. Existing React Native 0.86 navigation, op-sqlite, camera/image picker, local image files, reports, symptom checklist, segmentation, and HAM10000 inference remain in use.

## What changed

- Added screenshot-based Welcome, Sign In, Create Account and Profile screens, using the existing react-native-svg dependency for line icons and gradients.
- Added Home / Records / Analytics / Profile tabs. The existing lesion guide remains accessible from Home and from result screens.
- Added an actual Node account service with SQLite accounts, salted scrypt password hashes, random bearer sessions, stored token hashes, expiry, logout, request size limits, password-derivation concurrency limits and per-address attempt limits. No demo-password bypass is implemented.
- Added secure session storage through react-native-keychain and CSPRNG UUIDs through react-native-get-random-values. Added the missing matching RN Jest preset for tests. No navigation, AI, or SQLite packages were replaced.
- Added owner-scoped history, report lookup, edit, single delete, delete-all, analytics and history preferences.
- Completed screenings automatically save after prediction if history saving is enabled. The existing Save action is retained as retry/view-report. Retries use the same screening UUID. Images remain files, not SQLite blobs.
- Registered screening forms populate name and sex from the account, read-only. Age and lesion location remain specific to each screening. Additional existing lesion locations remain available under Other locations.
- Missing images now fail saving clearly and show a report placeholder instead of a broken image. Database failures cannot silently enter the app.

## How to run on this Mac and phone

The development account URL in `/Users/emman/Documents/SIA2GIT/DermaSight/src/config/auth.ts` is `http://192.168.3.14:3001`. This is the Mac's current LAN IP. If Wi-Fi changes that address, update the development URL. Release builds deliberately require an explicitly configured HTTPS endpoint.

Terminal 1, from the repository root:

```sh
cd /Users/emman/Documents/SIA2GIT/DermaSight
AUTH_HOST=0.0.0.0 npm --prefix backend start
```

Terminal 2:

```sh
cd /Users/emman/Documents/SIA2GIT/DermaSight
npm start
```

Both services were running at handoff. Do not start a second copy if ports 3001 and 8081 are occupied. Keep the Mac and phone on the same trusted Wi-Fi and allow incoming connections if macOS asks. The LAN HTTP endpoint is for local development only.

Native security, Google Sign-In and connectivity libraries were added, so the app needs one native rebuild; Fast Refresh alone cannot install them. Pods were installed, Android Debug built, iPhone Debug built, and the new app was installed and launched on the paired iPhone. Subsequent JavaScript/UI edits can use Fast Refresh.

For another iPhone rebuild, open `/Users/emman/Documents/SIA2GIT/DermaSight/ios/SkinSense.xcworkspace`, keep the existing signing team/bundle ID, choose your actual phone and Run. For Android, run `npm run android` with the installed Android SDK and Java 17. Verification used:

```sh
cd /Users/emman/Documents/SIA2GIT/DermaSight/android
ANDROID_HOME=/Users/emman/Library/Android/sdk JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home ./gradlew assembleDebug
```

Guest inference and history work offline. Account creation/sign-in need the account service. A previously authenticated, unexpired cached session can access local data offline; restoration checks the service when reachable and rejects expired/revoked sessions. Development builds also need Metro for their JS workflow. A Release build can bundle JS and run inference without Metro.

## Database schema and migration

Mobile database remains `skinsense.db`, using op-sqlite. Initialization adds version 1 changes transactionally without dropping any existing tables:

| Table | Fields / purpose |
|---|---|
| `users` | `id`, unique `email`, `name`, `sex`, `created_at`, `updated_at`; verified profile cache, no password/token |
| `guest_sessions` | UUID `id`, `created_at`, nullable `ended_at`, nullable `migrated_user_id` foreign key |
| existing `screenings` | Keeps all original fields; adds unique `screening_id`, nullable `user_id` FK, nullable `guest_session_id` FK |
| existing `app_settings` | Existing consent plus per-owner history preference and non-secret signup recovery intent |

The existing complete-screening table already holds patient snapshots, age, lesion location, symptom/ABCDE JSON, image path, prediction, confidence (existing 0–100 scale), result wording, and creation time. A separate duplicate `scan_results` table is unnecessary. `full_name` and `sex` are historical snapshots; the registered profile remains their source of truth for new screenings. `patient_id` remains a compatibility/display field; for new records it matches the screening UUID, never the account or guest ID. The UI displays a shortened `SCR-...` value, while storage uses the full UUID.

Foreign keys, owner indexes and insert/update triggers enforce exactly one owner for new/updated screenings. Queries bind owner IDs as parameters. Only fixed allow-listed SQL column names are interpolated. The screening UUID and start time travel through information → symptoms → camera → preprocessing → classification → result. A new screening route gets a new UUID.

**Legacy records:** Previous scans had no ownership. They remain unchanged, with `legacy-<row id>` identifiers, and are kept unassigned. They are excluded from new session queries. No automatic assignment to the first account/guest occurs because the application cannot establish who owns them. A separately approved local import/recovery workflow is still needed if you want those old anonymous records visible in an account.

Backend SQLite database is `backend/data/auth.db` (git-ignored). Its `users` store profile fields plus salt/hash; `sessions` store SHA-256 token hashes, `user_id`, and expiry. The additional `federated_identities` table uses `(provider, subject)` as its primary key and a user foreign key; it maps verified Google subjects to permanent account UUIDs. Google-only accounts have empty salt/hash fields and password login explicitly rejects them. Backend data survives service restarts. Do not delete this directory to restart the server. Scan images/results are never uploaded to it.

## Guest flow

Welcome → Continue as Guest → new secure UUID and local guest-session row → session reference stored securely → existing onboarding/consent if not already completed → Home → screening → unchanged AI prediction → save with guest owner → only that guest's records.

Normal app restarts restore the active guest session. Explicit Exit Guest Mode clears secure session state and marks it ended. Its rows/images remain local, but are unavailable to the next guest, who receives a new UUID. Register before exiting if you want to keep access to the current guest records.

## Registered flow

Create Account validates name, sex, email, password and confirmation. The service hashes the password; the mobile app stores only profile metadata and a securely stored session. Sign In verifies credentials against the service and restores the same permanent user UUID. All new scans, reports, settings and analytics use that user ID.

Sign Out clears secure credentials and replaces the navigation tree, clearing user-specific screen memory. Backend session revocation is attempted; if offline, server-side expiry still bounds the old token. Logout never deletes account rows or scans. Signing in again on this installation restores its local history.

History is persistent **on this app installation/device**, not synchronized between phones. Uninstalling the app removes its local SQLite/images. Backend accounts alone do not back up scans.

## Guest-to-user migration and recovery

After successful signup, the verified account response is journaled in secure storage. A non-secret recovery intent is also recorded for that specific account/guest. One SQLite transaction upserts the account profile, updates only the current guest's scans (`user_id=newUser`, `guest_session_id=NULL`), marks the guest migrated, and clears the recovery intent. The original screening IDs, row IDs, images, timestamps, symptoms and predictions remain intact.

If migration fails, the transaction rolls back and the secure recovery journal remains. Retry completes it idempotently. If secure session storage fails after successful account creation, the guest scans remain and a subsequent verified sign-in to that same account can finish the recorded upgrade. Ordinary sign-in to an existing account does not implicitly adopt any guest records.

## Authentication and navigation

`AuthContext` owns loading, unauthenticated, guest and authenticated states. Route availability is conditional on session state; unauthenticated users cannot navigate into scanning/history/report screens. The navigator is keyed by session owner, so logout or switching owners discards the previous session's route state. Both guest and registered modes retain core screening, reports, guide, consent and settings. The first-run consent flow is preserved after mode selection.

## Verification performed

- TypeScript: `npx tsc --noEmit` passed.
- ESLint: `npm run lint` passed with 0 errors and 41 warnings (mainly inline styles/nested components). One pre-existing unused type import was removed; inference behavior is unchanged.
- App tests: `npm test -- --runInBand --watchman=false` — 4 suites, 14 tests passed. Tests use real SQLite through a Node-backed test adapter to execute the app's migrations and SQL; native Keychain/network calls are mocked for session-state tests.
- Backend: `npm --prefix backend test` — 3 tests passed: real SQLite/password/session persistence; Google identity/profile isolation; real Google-library JWT signature and claim verification.
- Android Debug: **BUILD SUCCESSFUL**, 23s (incremental build with Google/NetInfo included). The op-sqlite CMake stage passed; its native configuration was not changed. Gradle/native deprecation warnings remain.
- iPhone Debug: **BUILD SUCCEEDED** with 2 compile jobs. The expanded build passed and was installed on the paired iPhone. Live OAuth still needs test-user/device verification.
- Account service `/health` and Metro `/status` responded. Metro also bundled the final iOS JavaScript with HTTP 200.

Coverage maps to the requested scenarios: guest ownership and save/read; multiple scans; guest adoption/rollback/retry; account credentials/session restoration/logout; A/B reads/edits/deletes; two guest sessions; restart/expiry; plus initialization failure, legacy-data preservation and secure-storage failure. A complete camera/model scan on the physical device and visual screenshot comparison still require hands-on verification; automated tests do not prove that interaction.

## Remaining work / limits

- Public deployment with a domain, TLS reverse proxy and explicitly configured release HTTPS URL is not performed. `NODE_ENV=production` refuses requests without trusted HTTPS forwarding. Use a trusted proxy that overwrites forwarding headers, restrict access to its private listener, and add backups/monitoring and a shared rate limiter before scaling across workers.
- Forgot Password shows an honest help message. Email reset delivery and verification are not configured; no fake recovery email is sent.
- Node 22's built-in SQLite prints an experimental warning. Use a supported Node runtime and validate the hosting environment before deployment.
- Profile editing is exposed in Profile and Settings. Name/sex updates require reaching the account service; completed screenings retain historical snapshots.
- The Basic Screening Information screenshot was not among the four attachments. That existing screen was adapted from the written specification; it needs comparison when that image is available.
- Old anonymous scans are retained but need explicit ownership recovery, as explained above.
- The existing empty iOS location usage description still generates a warning; unrelated native permission settings were left intact.

## Files created

- `backend/package.json`, `backend/auth.mjs`, `backend/server.mjs`, `backend/auth.test.mjs`
- `src/auth/types.ts`, `src/auth/api.ts`, `src/auth/AuthContext.tsx`
- `src/config/auth.ts`, `src/utils/secureId.ts`
- `src/components/AccountUI.tsx`
- `src/screens/AuthScreens.tsx`, `src/screens/ProfileScreen.tsx`, `src/screens/AnalyticsScreen.tsx`
- `__tests__/database.test.js`, `__tests__/auth-session.test.tsx`, `__tests__/fixtures/legacy-schema.sql`
- `AUTH_IMPLEMENTATION.md`

## Files modified in this implementation

- `App.tsx`, `index.js`, `.gitignore`, `package.json`, `package-lock.json`
- `src/types/index.ts`, `src/navigation/index.tsx`, `src/database/database.ts`
- `src/screens/HomeScreen.tsx`, `src/screens/PatientInfoScreen.tsx`, `src/screens/PrivacyConsentScreen.tsx`
- `src/screens/ResultScreen.tsx`, `src/screens/HistoryScreen.tsx`, `src/screens/ReportScreen.tsx`, `src/screens/SettingsScreen.tsx`
- `src/services/imageStorageService.ts`
- `src/services/tfliteService.ts` (unused type import only)
- `__tests__/App.test.tsx`, `ios/Podfile.lock` (new security pods)

Existing user changes in `.vscode/settings.json`, the iOS project signing settings, `Info.plist`, `PrivacyInfo.xcprivacy`, and the earlier `PROJECT_CONTEXT.md` were preserved. Model assets, inference logic and op-sqlite native/CMake settings were not modified.

Security library references: [Keychain/Keystore](https://github.com/oblador/react-native-keychain), [native secure random values](https://github.com/LinusU/react-native-get-random-values).


## Expanded implementation report (Google, connectivity and settings)

1. **Summary of changes:** Integrated native Google Sign-In with the existing account server; added profile editing, centralized live connectivity, About and Account Security screens; grouped Settings and corrected privacy descriptions; disabled incomplete screening submissions.
2. **Files created in this extension:** `src/auth/google.ts`, `src/components/GoogleEntry.tsx`, `src/connectivity/ConnectivityContext.tsx`, `src/screens/AccountSettingsScreens.tsx`, `backend/google.mjs`, `backend/google.test.mjs`, `backend/package-lock.json`, `__tests__/connectivity.test.tsx`, `GOOGLE_SIGN_IN_SETUP.md`. The original account implementation's created files are listed above.
3. **Files modified in this extension:** `App.tsx`; `src/auth/{AuthContext,api,types}.tsx/ts`; `src/config/auth.ts`; navigation/types; Home, Auth, Profile, Settings, PatientInfo and both PrivacyConsent screens; backend auth/server/package/tests; app/session tests; root package manifests; iOS Podfile/lock and AppDelegate. Existing signing/Info.plist/user changes are preserved. The real callback scheme derived from the provided iOS ID was added to Info.plist.
4. **Authentication architecture:** The same AuthContext and Node account server support email/password and verified Google identities. App sessions still use Keychain/Keystore, not SQLite tokens. Google's ID token is kept in UI memory only during profile completion and exchanged for the existing server's opaque session. Google is an identity provider; DermaSight remains the session issuer.
5. **Google implementation:** Native SDK button on Sign In and Create Account; cancellation handled; server verifies Google's JWT signature, audience, issuer and expiry using `google-auth-library`, then requires verified email/subject. Google `sub` maps to permanent user ID. New users confirm name and sex; Google sex is never inferred. The server validates the ID token again on completion. Matching email alone never links existing accounts. The supplied public Web and iOS IDs are configured, and the callback URL scheme is added. The user has reported Google sign-in working on the phone; the revised single-form completion still needs device visual verification.
6. **2FA:** App-enforced MFA is **not implemented**. Google controls its own account 2-Step Verification and challenges. The app does not treat a Google token as evidence of a second factor, or claim email/password MFA. Settings explains this limitation and opens Google's security settings. No homemade OTP/PHP Mailer flow was added. Enforced MFA would need a provider with supported enrollment, challenge and recovery APIs plus appropriate app/backend integration.
7. **Guest sessions:** Unchanged secure UUID sessions, local history, no email/password/provider requirement. Explicit exit closes the session while preserving rows; next guest is isolated.
8. **Schema:** Mobile users/guest_sessions/existing screenings/app_settings remain as described above. Backend adds only federated identities; existing accounts/sessions and password hashes remain usable. No tables are dropped, and no duplicate scan/symptom database is introduced.
9. **Screening model:** A single UUID assessment carries owner, age, location, profile snapshots, symptoms, file path and AI result through all steps. Inference results retain the existing confidence scale. Every new screening route creates a new assessment UUID.
10. **Profile model:** Permanent user UUID, email, full name, sex, created/updated timestamps. Account methods are returned by the server for security information. Email is not editable through this profile endpoint. Age and lesion location remain screening fields. Profile edits populate future screenings without changing saved reports.
11. **Guest adoption:** Successful new Google account creation invokes the same transaction and secure recovery journal as password signup. Existing Google account sign-in never implicitly adopts guest scans. An unfinished verified signup may resume its recorded adoption.
12. **Isolation:** All mobile history/report/analytics/delete operations remain owner scoped. Provider identities use verified subjects; email collisions return a conflict instead of assigning another user's account/history. Profile update requires a valid server session and updates only its user ID.
13. **Connectivity/offline:** One NetInfo listener reports checking/online/offline, including unknown internet reachability. Home badge reflects actual state. Connectivity never changes auth state. Google requires internet; account service/profile updates require a connection to the server. Valid cached sessions restore during network failure and 5xx outages until expiry; explicit server 401 clears authentication. Local image inference and owner-scoped history remain available offline. Local records are not cloud synchronized.
14. **About:** Added a Settings destination describing preliminary educational purpose, EfficientNet/HAM10000/TensorFlow Lite, intended use, model limits and local data/account connections. Existing medical wording is preserved.
15. **Settings/privacy/legal:** Added Account/Profile, Security, About and Session groups while retaining history preference/deletion and privacy/disclaimer destinations. Removed inaccurate zero-external-transfers wording: no scan uploads, but account information and Google identity tokens do reach the server. No compliance certification is claimed.
16. **Basic screening form:** Generated assessment ID, profile name/sex read-only for registered users, guest manual fields, editable age, current location selection. Continue is disabled until requirements are met; visible messages identify missing fields. Existing six primary locations and additional options are retained. The missing Basic Information screenshot remains a visual-verification limitation.
17. **HAM10000:** Model assets, seven-class prediction, preprocessing, quality checks, segmentation and inference behavior are preserved. Authentication wraps the existing flow; no model retraining or inference changes occurred.
18. **Tests:** 14 app tests across 4 suites plus 3 backend tests pass. Coverage includes guest/user CRUD isolation, database migration/adoption rollback, secure-session storage recovery, Google profile completion/adoption boundaries, account/cache update, offline/server-outage restore, connectivity unknown/reachable states, password/session persistence and actual JWT signature/audience/issuer/expiry/email verification. Camera/model interactions, visual fidelity and live Google provider login still need device testing.
19. **Android:** Debug build **passed** with Google Sign-In and NetInfo, 23 seconds incremental build, 644 tasks. No op-sqlite CMake/native configuration change. TypeScript passed; lint passed with 0 errors and 41 warnings. iOS dependency installation completed with 102 pods; iPhone Debug build **passed** with two compile jobs, including the Google callback and all new pods.
20. **Remaining issues:** Web/iOS OAuth configuration is now supplied; add the Google test user and complete real provider/device verification. Android OAuth registration has been supplied. App-enforced MFA, password recovery/email verification, public HTTPS deployment, scan synchronization and legacy ownership import are not implemented. Existing local image/model/device limits remain as above. The LAN server is a development setup, not a hosted production account service.

### Failures encountered and classification

- **Environment restriction, resolved:** npm initially failed `ENOTFOUND registry.npmjs.org`; downloads succeeded with network approval. CocoaPods initially failed `Couldn't resolve host name` for its CDN; approved network execution resolved it.
- **Introduced dependency integration requirement, resolved:** `AppCheckCore` Swift pod depends on `GoogleUtilities` and `RecaptchaInterop`, which did not define modules. Added modular headers only for these two dependencies as directed by the Google Sign-In SDK setup guide; pod installation completed. op-sqlite settings were not changed.
- **Environment restriction, resolved:** Android Gradle could not open its wrapper `.zip.lck` (`Operation not permitted`). Approved build with access to the Gradle cache passed.
- **Existing environment/test runner issue, resolved for verification:** Watchman could not create `/Users/emman/.local/state/watchman/emman-state` (`Operation not permitted` / `Permission denied`). Running Jest with `--watchman=false` passed; Watchman directory permissions themselves were not changed.
- **Environment restriction, resolved:** Local server bind initially failed `listen EPERM 0.0.0.0:3001`. Restart with approved network access succeeded. Account `/health` and Metro final iOS bundle returned HTTP 200.
- **Remaining warnings:** Node built-in SQLite experimental warning, native/Gradle deprecations, 41 lint warnings and the pre-existing empty location permission description. These are not reported as test/build failures.

See [GOOGLE_SIGN_IN_SETUP.md](GOOGLE_SIGN_IN_SETUP.md) for the full console steps and exact project identifiers. Sources: [Google token verification](https://developers.google.com/identity/sign-in/web/backend-auth), [SDK iOS modular-header requirement](https://react-native-google-signin.github.io/docs/setting-up/ios), [SDK OAuth configuration](https://react-native-google-signin.github.io/docs/setting-up/get-config-file), [Google 2-Step Verification](https://support.google.com/accounts/answer/185839).

Latest iPhone verification: `xcodebuild -workspace ios/SkinSense.xcworkspace -scheme SkinSense -configuration Debug -destination generic/platform=iOS -jobs 2 -allowProvisioningUpdates build` returned **BUILD SUCCEEDED**. Web/iOS Google OAuth IDs and callback scheme are now configured; the user has reported live Google sign-in working.

Device installation: the first attempt failed with CoreDevice error 4000 / `Connection reset by peer` (a transient device transport failure, not a build failure). The phone then reported available; retry successfully installed the new Debug app on the paired iPhone 14 Plus. Live OAuth sign-in is still not verified. The supplied Web/iOS IDs and callback scheme are now configured.

Launch attempt: CoreDevice error 10002 / `Locked` — iOS refused to launch because the phone was locked. This is an unresolved device-state requirement, not a compile/install failure. Unlock the iPhone and open SkinSense, or Run from Xcode. Installation succeeded, but runtime UI/camera/Google login is not claimed verified.


## Single signup form and local account manager (latest changes)

- Google profile completion now reuses the existing Create Account fields and button. Verified name/email are filled automatically; email is read-only. Name and sex remain profile fields. The duplicate bottom form is removed. No AI, image processing, SQLite screening ownership, or native dependency changes were needed.
- Google signup omits password and confirmation fields; Continue creates the account and opens the app. Password setup happens later inside Settings → Security. Google and password login resolve to the same permanent user ID and history. A Google-only user can add a password under Settings → Security using a current server session and a fresh verified Google identity for that exact user. Existing passwords are never replaced by this flow.
- Google sign-in to an existing password email requires the current password before attaching the verified Google subject. It preserves the existing user ID/profile and does not adopt guest scans merely because of sign-in. New account creation retains the existing transactional guest adoption.
- Pending Google signup data, including the ID token, is centralized in AuthContext memory and cleared on completion/cancellation; it is not written to mobile SQLite, navigation parameters, or the stored app session.
- The new local account manager at http://127.0.0.1:3002 lists account metadata, edits name/sex, and deletes accounts after confirmation. Each deletion backs up the server database first, then transactionally removes the account, its credential mappings and sessions. It uses loopback binding, a Host allowlist, same-origin mutation checks and a process-specific CSRF token. It is separate from the phone-facing account API.
- Created: `backend/admin.mjs`, `backend/admin.html`, `backend/admin.test.mjs`, `__tests__/signup-form.test.tsx`, `ACCOUNT_MANAGER.md`. Modified: `backend/auth.mjs`, `backend/server.mjs`, `backend/package.json`, `backend/auth.test.mjs`, `src/auth/types.ts`, `src/auth/api.ts`, `src/auth/AuthContext.tsx`, `src/components/GoogleEntry.tsx`, `src/screens/AuthScreens.tsx`, `src/screens/AccountSettingsScreens.tsx`, `__tests__/auth-session.test.tsx`, and setup/report documentation.
- Schema: no new tables or dropped data. Existing backend users/sessions/federated_identities support optional password credentials and identity linking. Mobile users/guest_sessions/screenings remain unchanged.
- Verification: 16 app tests and 6 backend tests pass. Tests cover the single form, optional passwords, same-ID Google/password login, password-proven linking, wrong-account refusal, existing-password preservation, admin profile edits, deletion/session revocation, backups and cross-site rejection. TypeScript passes; lint has 0 errors and 41 existing warnings. Android Debug passes in 6 seconds (644 tasks). Real accounts were only listed, not deleted or edited during verification.
- Limitations: revised phone UI and camera/model flow have not been visually exercised this turn. Deleting and recreating an account gives a new ID; old device scans stay under the old ID, not the recreated account. Local account management is for this Mac’s development server. Public HTTPS hosting, recovery/email verification, app-enforced MFA and cloud scan synchronization remain unfinished.

## Account-specific onboarding and transitions

App startup now shows the existing animated splash before session routing. Unauthenticated users enter Welcome/Sign In; new password or Google accounts enter the existing three onboarding slides, then the dashboard. Returning registered accounts go straight to the dashboard after sign-in. Pending onboarding is stored in `app_settings` under `onboarding:<user ID>` and survives restart until completion or Skip. Existing accounts without a pending marker skip onboarding. Guest onboarding retains its existing landing/disclaimer/consent flow; privacy and medical screens remain accessible in Settings for registered users.

Auth-driven navigation changes fade in over 220 ms; native stack screens keep consistent slide transitions and forward replacements. No dependencies, model changes or record ownership changes were introduced. Verification: 20 app tests passed, TypeScript passed, lint has no errors (39 warnings). Actual transition timing and visual appearance still need iPhone verification.
