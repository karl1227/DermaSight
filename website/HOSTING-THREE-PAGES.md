# DermaSight: upload these three public pages

Hosting is currently deferred. The app uses the local development server. The previously supplied public domain is https://dermasight.free.nf; no hosted files were changed in this update.

Extract `DermaSight-3-Pages.zip` directly inside `htdocs`, replacing the old versions. The ZIP contains exactly:

```
index.html
privacy.html
medical-disclaimer.html
styles.css
```

Do not put these files in a `policies` subfolder. All three pages link back to `index.html`; there are no remaining `about.html` links. Keep the shared CSS beside the pages.

## Public URLs

- About: https://dermasight.free.nf/index.html (also the domain homepage)
- Privacy: https://dermasight.free.nf/privacy.html
- Medical disclaimer: https://dermasight.free.nf/medical-disclaimer.html

When hosting resumes, set `PUBLISHED_POLICY_BASE_URL` in `src/config/policies.ts` to your final public HTTPS origin. It is currently blank, so development browser links use the local server. Reload the development app to use them. Release builds need to be rebuilt to pick up JavaScript changes.

## Fix just the two return links manually

In your hosting file manager, edit `privacy.html` and `medical-disclaimer.html`. Replace **every** `href="about.html"` with `href="index.html"`, including the DermaSight brand link. Save both files. The replacement package already contains this correction for all pages.

After upload, open each page and tap About and the DermaSight brand name. If the browser keeps an old version, reload the page or try a private browser tab.

Only public static files are packaged. Do not upload the backend, account database, mobile repository, credentials, or signing files. Publishing these pages does not deploy the account service or create cloud storage.

## Rebuild the ZIP after editing

From the project root:

```sh
python3 - <<'PY'
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root = Path('website')
with ZipFile(root / 'DermaSight-3-Pages.zip', 'w', ZIP_DEFLATED) as archive:
    for name in ('index.html', 'privacy.html', 'medical-disclaimer.html', 'styles.css'):
        archive.write(root / name, name)
PY
```
