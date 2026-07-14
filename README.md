# Env URL Toggle

Browser extension (Firefox + Chrome) to switch the current tab between
environment URLs of your projects — production, feature branches, staging,
local dev instances — preserving the current path, query and hash.

Projects are fully configurable in the extension's options page and synced
via your browser profile. Each project has two lists: **production URLs**
(prod, feature branches, staging) and **local URLs** (dev instances on
different ports):

- On a local URL, clicking the toolbar icon offers the production list;
  on a production URL, the local list.
- When the other side has exactly one URL, a single click switches straight
  to it without a popup (e.g. local → prod).
- The popup only ever shows the matched project; on pages that don't match
  any configured URL it just offers the settings shortcut.
- Within each list, the most recently used URL is shown on top.

## Repository layout

```
src/       shared code (identical for both browsers)
firefox/   Firefox-specific files (manifest)
chrome/    Chrome-specific files (manifest, service-worker loader)
dist/      signed Firefox .xpi, ready to install (latest version only)
build.sh   assembles installable build/firefox and build/chrome
sign.sh    builds and signs the Firefox extension via AMO (Docker)
```

## Install

Clone the repository first (Chrome loads the extension from the clone, so
keep it in a permanent location):

```sh
git clone git@github.com:emokykla/env-url-toggle.git ~/dev/env-url-toggle
```

### Firefox

1. Open `about:addons` → gear icon → *Install Add-on From File…*
2. Select `dist/env-url-toggle-<version>.xpi` from the clone.

The xpi is signed by Mozilla, installs in regular Firefox and survives
restarts. To update later: `git pull` and install the newer xpi the same way.

### Chrome

1. Run `./build.sh` in the clone (plain shell script, no dependencies).
2. Open `chrome://extensions`, enable **Developer mode** (top right).
3. Click **Load unpacked** and select `build/chrome`.

Unpacked extensions persist across Chrome restarts, but Chrome keeps loading
from that directory — don't delete the clone. To update later: `git pull`,
`./build.sh`, then click the reload icon on the extension card.

## Development

`./build.sh` assembles both targets. For Firefox, signing is required for a
persistent install:

1. Get AMO API credentials at
   <https://addons.mozilla.org/developers/addon/api/key/> (free Firefox
   account) and put them in `.env` (copy `.env.example`; gitignored).
2. Bump `version` in `firefox/manifest.json` (AMO rejects re-uploads of the
   same version) and run `./sign.sh` — it builds, signs via AMO (through
   Docker, `node:22-alpine`; nothing installed locally) and drops the xpi
   into `dist/`, replacing the previous one.

Unsigned builds can be tested temporarily via `about:debugging` → *Load
Temporary Add-on*, or permanently on Firefox Developer Edition/Nightly/ESR
with `xpinstall.signatures.required=false` in `about:config`.

## Publish

- **AMO (Firefox)**: change `--channel=unlisted` to `--channel=listed` in
  `sign.sh`; the first listed submission asks for listing details on
  addons.mozilla.org.
- **Chrome Web Store**: register at
  <https://chrome.google.com/webstore/devconsole> (one-time 5 USD fee),
  zip `build/chrome` and upload it in the developer console.

## License

[MIT](LICENSE)
