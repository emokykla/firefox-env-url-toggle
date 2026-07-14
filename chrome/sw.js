// Chrome MV3 runs the background as a single service worker; Firefox loads
// the same files via the manifest's background.scripts list instead.
importScripts("common.js", "background.js");
