// When the current URL matches an environment and the other side has exactly
// one URL, the icon toggles straight to it (no popup) — e.g. local -> prod.
// Everywhere else it opens the environment-selection popup.
async function updateAction(tab) {
    if (!tab || !tab.id || !tab.url) {
        return;
    }
    const projects = await getProjects();
    const match = matchEnvironment(projects, tab.url);
    const directToggle = match && targetsFor(match).length === 1;
    browser.action.setPopup({tabId: tab.id, popup: directToggle ? "" : "popup.html"});
}

browser.action.onClicked.addListener(async (tab) => {
    const projects = await getProjects();
    const match = matchEnvironment(projects, tab.url);
    if (!match) {
        return;
    }
    const targets = targetsFor(match);
    if (targets.length === 1) {
        recordUsage(match.project, oppositeSide(match.side), targets[0]);
        browser.tabs.update(tab.id, {url: switchUrl(tab.url, match, targets[0])});
    }
});

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url || changeInfo.status === "loading") {
        updateAction(tab);
    }
});

browser.tabs.onActivated.addListener((activeInfo) => {
    browser.tabs.get(activeInfo.tabId).then(updateAction);
});

browser.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.projects) {
        browser.tabs.query({}).then((tabs) => tabs.forEach(updateAction));
    }
});

browser.runtime.onInstalled.addListener(async () => {
    const stored = await browser.storage.sync.get("projects");
    if (stored.projects === undefined) {
        await browser.storage.sync.set({projects: DEFAULT_PROJECTS});
    } else {
        await browser.storage.sync.set({projects: stored.projects.map(migrateProject)});
    }
});

// Initialize for already-open tabs whenever the event page wakes up.
browser.tabs.query({}).then((tabs) => tabs.forEach(updateAction));
