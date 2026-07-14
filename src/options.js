let projects = [];

const container = document.getElementById("projects");
const status = document.getElementById("status");

function textInput(className, value, placeholder, onInput) {
    const input = document.createElement("input");
    input.type = "text";
    input.className = className;
    input.value = value;
    input.placeholder = placeholder;
    input.addEventListener("input", () => onInput(input.value));
    return input;
}

function smallButton(text, className, onClick) {
    const button = document.createElement("button");
    button.textContent = text;
    button.className = className;
    button.addEventListener("click", onClick);
    return button;
}

function renderSide(card, project, side) {
    const title = document.createElement("h3");
    title.textContent = SIDE_NAMES[side] + " URLs";
    card.appendChild(title);

    project[side].forEach((env, envIndex) => {
        const row = document.createElement("div");
        row.className = "env-row";
        row.appendChild(textInput("env-label", env.label, "label", (v) => env.label = v));
        row.appendChild(textInput("env-url", env.url,
            side === "local" ? "http://localhost:3000" : "https://example.com",
            (v) => env.url = v));
        row.appendChild(smallButton("✕", "danger", () => {
            project[side].splice(envIndex, 1);
            render();
        }));
        card.appendChild(row);
    });

    card.appendChild(smallButton("+ Add " + side + " URL", "", () => {
        project[side].push({label: "", url: ""});
        render();
    }));
}

function render() {
    container.textContent = "";

    projects.forEach((project, projectIndex) => {
        const card = document.createElement("fieldset");

        const header = document.createElement("div");
        header.className = "project-header";
        header.appendChild(textInput("", project.name, "Project name", (v) => project.name = v));
        header.appendChild(smallButton("Remove project", "danger", () => {
            projects.splice(projectIndex, 1);
            render();
        }));
        card.appendChild(header);

        SIDES.forEach((side) => renderSide(card, project, side));

        container.appendChild(card);
    });
}

function flash(message, isError) {
    status.textContent = message;
    status.className = isError ? "error" : "ok";
    if (!isError) {
        setTimeout(() => {
            status.textContent = "";
        }, 2000);
    }
}

function validate() {
    for (const project of projects) {
        if (!project.name.trim()) {
            return "Every project needs a name.";
        }
        for (const side of SIDES) {
            if (!project[side].length) {
                return `Project "${project.name}" needs at least one ${side} URL.`;
            }
            for (const env of project[side]) {
                if (!env.label.trim()) {
                    return `Project "${project.name}": every URL needs a label.`;
                }
                if (!/^https?:\/\/.+/.test(env.url.trim())) {
                    return `Project "${project.name}", "${env.label}": URL must start with http:// or https://`;
                }
            }
        }
    }
    return null;
}

document.getElementById("add-project").addEventListener("click", () => {
    projects.push({
        name: "",
        prod: [{label: "prod", url: ""}],
        local: [{label: "local", url: ""}]
    });
    render();
});

document.getElementById("save").addEventListener("click", () => {
    const error = validate();
    if (error) {
        flash(error, true);
        return;
    }
    projects.forEach((project) => {
        project.name = project.name.trim();
        SIDES.forEach((side) => {
            project[side].forEach((env) => {
                env.label = env.label.trim();
                env.url = normalizeBase(env.url);
            });
        });
    });
    browser.storage.sync.set({projects}).then(
        () => flash("Saved.", false),
        (e) => flash("Save failed: " + e.message, true)
    );
});

getProjects().then((stored) => {
    projects = JSON.parse(JSON.stringify(stored));
    render();
});
