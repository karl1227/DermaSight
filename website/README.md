# DermaSight information pages — local development

Hosting is deferred. The mobile browser links use the Mac LAN origin configured in `src/config/auth.ts`, through `src/config/policies.ts`. On the Mac itself, open:

- http://localhost:3001/index.html
- http://localhost:3001/privacy.html
- http://localhost:3001/medical-disclaimer.html

On the physical phone, use the Mac’s LAN address instead of localhost. Both devices must be able to reach the local server. From `backend`, run `AUTH_HOST=0.0.0.0 npm start` if it is not already running.

Brief app summaries are maintained in `src/content/information.ts`. Full browser content is in the three HTML files in this directory. The project team’s supplied text is used, with cloud-upload/Firebase claims described as future features because the app currently stores screening records locally. No cloud consent checkbox is active.

The About page includes the project team and capstone details. Privacy includes the supplied contact and address. All three pages include reference links. The first-use app screens require the screening-consent and medical-acknowledgment checkboxes before continuing; Settings screens remain readable without taking consent again. The existing local first-run acknowledgment is preserved; this is not a server-side consent audit log.

`DermaSight-3-Pages.zip` is refreshed for a future hosting handoff only; nothing has been uploaded or published. The public-site setting is blank until hosting is requested again.

## Development network changes

The app now derives the local backend host from the running Metro bundle URL when possible. If a debug build uses an embedded bundle, the fallback address is in `src/config/developmentServer.ts` and must match the Mac's current LAN address. The server must listen on `0.0.0.0`, and the phone must be able to reach that Mac over the network. `localhost:3001` is for browsers on the Mac only.
