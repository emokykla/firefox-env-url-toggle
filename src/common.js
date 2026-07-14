// Shared between background, popup and options pages.

// Chrome exposes the (promise-based, MV3) API as `chrome`.
if (typeof browser === "undefined") {
    globalThis.browser = chrome;
}

const DEFAULT_PROJECTS = [
    {
        name: "Example",
        prod: [
            {label: "prod", url: "https://example.com"}
        ],
        local: [
            {label: "local", url: "http://localhost:3000"}
        ]
    }
];

const SIDES = ["prod", "local"];

const SIDE_NAMES = {prod: "Production", local: "Local"};

function normalizeBase(url) {
    return url.trim().replace(/\/+$/, "");
}

// v2.0 stored a flat environments list with a default index; split it into
// prod (the default) and local (the rest).
function migrateProject(project) {
    if (project.prod && project.local) {
        return project;
    }
    if (project.environments) {
        const def = project.defaultIndex ?? 0;
        return {
            name: project.name,
            prod: project.environments.filter((env, i) => i === def),
            local: project.environments.filter((env, i) => i !== def)
        };
    }
    return {name: project.name || "", prod: project.prod || [], local: project.local || []};
}

async function getProjects() {
    const stored = await browser.storage.sync.get("projects");
    const projects = stored.projects ?? DEFAULT_PROJECTS;
    return projects.map(migrateProject);
}

// Longest matching base wins, so overlapping bases (e.g. a path-based
// environment under the same origin) resolve to the most specific one.
function matchEnvironment(projects, url) {
    let best = null;
    projects.forEach((project) => {
        SIDES.forEach((side) => {
            (project[side] || []).forEach((env, index) => {
                const base = normalizeBase(env.url);
                if (base && (url === base || url.startsWith(base + "/"))) {
                    if (!best || base.length > best.base.length) {
                        best = {project, side, index, base};
                    }
                }
            });
        });
    });
    return best;
}

function oppositeSide(side) {
    return side === "prod" ? "local" : "prod";
}

// The environments offered for switching: the other side's list.
function targetsFor(match) {
    return match.project[oppositeSide(match.side)] || [];
}

function usageKey(projectName, side) {
    return projectName + "|" + side;
}

// Remember which URL was switched to, per project side, so the popup can
// show it on top of its list next time.
async function recordUsage(project, side, env) {
    const stored = await browser.storage.local.get("lastUsed");
    const lastUsed = stored.lastUsed || {};
    lastUsed[usageKey(project.name, side)] = normalizeBase(env.url);
    await browser.storage.local.set({lastUsed});
}

async function getLastUsed() {
    const stored = await browser.storage.local.get("lastUsed");
    return stored.lastUsed || {};
}

function orderByLastUsed(list, lastUrl) {
    const index = lastUrl ? list.findIndex((env) => normalizeBase(env.url) === lastUrl) : -1;
    if (index <= 0) {
        return list;
    }
    return [list[index], ...list.slice(0, index), ...list.slice(index + 1)];
}

// Preserve path/query/hash when the current URL matches an environment.
function switchUrl(currentUrl, match, targetEnv) {
    const target = normalizeBase(targetEnv.url);
    return match ? target + currentUrl.slice(match.base.length) : target + "/";
}
