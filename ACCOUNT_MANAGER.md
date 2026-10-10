# Manage development accounts

Open [DermaSight account manager](http://127.0.0.1:3002) on this Mac. It is separate from Google Cloud: Google OAuth clients/test users configure who can sign in; registered DermaSight accounts live in `backend/data/auth.db`.

If the page is unavailable, open another terminal:

```sh
cd /Users/emman/Documents/SIA2GIT/DermaSight
npm --prefix backend run accounts
```

Keep the normal account server running too. Stop this manager with Ctrl+C when finished.

1. Find an account by email.
2. Edit Full name or Sex and click **Save**. Sign in again to refresh the phone’s profile.
3. To test registration again, sign out on the phone, click **Delete** for the intended account and confirm. This removes its server account, Google mapping and login sessions.
4. Register again with the same email or Google account. The new account receives a new ID.

Every deletion first saves `backend/data/accounts-backup-*.db`. These backups contain private account data and should remain local and uncommitted. No accounts are deleted just by opening the manager.

Phone scan history lives in a separate local SQLite database. Deleting a server account does not erase those scans, and recreating an email does not grant access to the old account ID’s records. Avoid deleting an account whose scan history you need to retain; use profile editing instead.

For new Google signup, the app fills the existing name/email fields. Select sex and tap Continue to enter the app. Google signup has no password fields. Add a DermaSight password later through Settings → Security → Add Password. Both Google and email/password login use the same ID. For an existing Google-only account, use Settings → Security → Add Password, confirming the same Google identity. This password belongs to DermaSight, not your Google account.

Email and credential changes use authentication flows rather than direct row edits. The manager displays neither password hashes nor tokens. It binds only to this Mac’s loopback address and is not a hosted administration service.
