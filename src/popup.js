function shortUrl(url) {
    return normalizeBase(url).replace(/^https?:\/\//, "");
}

function heading(text) {
    const h = document.createElement("h2");
    h.textContent = text;
    return h;
}

function envButton(env, isCurrent, onClick) {
    const button = document.createElement("button");
    button.textContent = env.label;
    if (isCurrent) {
        button.classList.add("current");
        button.title = "Current environment";
    }

    const url = document.createElement("span");
    url.className = "url";
    url.textContent = shortUrl(env.url);
    button.appendChild(url);

    if (!isCurrent) {
        button.addEventListener("click", onClick);
    }
    return button;
}

function render(container, projects, lastUsed, tab) {
    const match = matchEnvironment(projects, tab.url);

    function ordered(project, side) {
        return orderByLastUsed(project[side], lastUsed[usageKey(project.name, side)]);
    }

    function switchTo(project, side, env) {
        recordUsage(project, side, env).then(() => {
            browser.tabs.update(tab.id, {url: switchUrl(tab.url, match, env)});
            window.close();
        });
    }

    if (match) {
        // Offer the other side's URLs first, e.g. on prod -> the local list.
        const other = oppositeSide(match.side);
        container.appendChild(heading(SIDE_NAMES[other]));
        ordered(match.project, other).forEach((env) => {
            container.appendChild(envButton(env, false, () => switchTo(match.project, other, env)));
        });

        // Same side too, when there is something to switch to (e.g. another
        // local instance), with the current environment highlighted.
        if (match.project[match.side].length > 1) {
            container.appendChild(heading(SIDE_NAMES[match.side]));
            ordered(match.project, match.side).forEach((env) => {
                const isCurrent = normalizeBase(env.url) === match.base;
                container.appendChild(envButton(env, isCurrent, () => switchTo(match.project, match.side, env)));
            });
        }
        return;
    }

    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = projects.length
        ? "No project matches this page."
        : "No projects configured yet.";
    container.appendChild(empty);
}

document.getElementById("manage").addEventListener("click", () => {
    browser.runtime.openOptionsPage();
    window.close();
});

Promise.all([
    getProjects(),
    getLastUsed(),
    browser.tabs.query({active: true, currentWindow: true})
]).then(([projects, lastUsed, [tab]]) => {
    render(document.getElementById("content"), projects, lastUsed, tab);
});
