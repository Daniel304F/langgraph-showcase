const API_URL = "http://localhost:8000";

const NODE_LABELS = {
    understand_topic: "Thema verstehen",
    evaluate_sources: "Quellen bewerten",
    check_quality: "Qualität prüfen",
    refine_topic: "Thema verfeinern",
    summarize: "Zusammenfassen",
    generate_report: "Report erstellen",
};

const questionInput = document.getElementById("question-input");
const startBtn = document.getElementById("start-btn");
const outputContainer = document.getElementById("output-container");
const iterationBadge = document.getElementById("iteration-badge");
const iterationCount = document.getElementById("iteration-count");

startBtn.addEventListener("click", startResearch);
questionInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") startResearch();
});

function startResearch() {
    const question = questionInput.value.trim();
    if (!question) return;

    resetUI();
    startBtn.disabled = true;

    const url = `${API_URL}/research?question=${encodeURIComponent(question)}`;
    const eventSource = new EventSource(url);

    eventSource.addEventListener("node_update", (e) => {
        const data = JSON.parse(e.data);
        handleNodeUpdate(data);
    });

    eventSource.addEventListener("done", () => {
        eventSource.close();
        startBtn.disabled = false;
        clearActiveNodes();
    });

    eventSource.onerror = (err) => {
        eventSource.close();
        startBtn.disabled = false;
        clearActiveNodes();
        addErrorBlock("Verbindungsfehler zum Backend. Läuft der Server auf Port 8000?");
    };
}

function resetUI() {
    outputContainer.innerHTML = "";
    iterationBadge.hidden = true;

    document.querySelectorAll(".node").forEach((node) => {
        node.classList.remove("active", "completed", "skipped");
    });
}

function handleNodeUpdate(data) {
    const { node, status, iteration, output } = data;

    // Update iteration badge
    if (iteration > 1) {
        iterationBadge.hidden = false;
        iterationCount.textContent = iteration;
    }

    // Update pipeline visualization
    setNodeState(node, status);

    // Add output block
    addOutputBlock(node, output, iteration);
}

function setNodeState(nodeName, status) {
    // Clear active state from all nodes
    document.querySelectorAll(".node.active").forEach((n) => {
        if (n.dataset.node !== nodeName) {
            n.classList.remove("active");
            n.classList.add("completed");
        }
    });

    const nodeEl = document.querySelector(`.node[data-node="${nodeName}"]`);
    if (!nodeEl) return;

    nodeEl.classList.remove("active", "skipped");

    if (status === "completed") {
        nodeEl.classList.remove("active");
        nodeEl.classList.add("completed");
    } else if (status === "running") {
        nodeEl.classList.add("active");
    } else if (status === "skipped") {
        nodeEl.classList.add("skipped");
    }
}

function clearActiveNodes() {
    document.querySelectorAll(".node.active").forEach((n) => {
        n.classList.remove("active");
        n.classList.add("completed");
    });
}

function addOutputBlock(nodeName, output, iteration) {
    const block = document.createElement("div");
    block.className = "output-block";

    const iterTag = iteration > 0 ? `<span class="iter-tag">Iteration ${iteration}</span>` : "";

    block.innerHTML = `
        <div class="output-block-header">
            <span class="node-name">${NODE_LABELS[nodeName] || nodeName}</span>
            ${iterTag}
        </div>
        <div class="output-block-body">${escapeHtml(output)}</div>
    `;

    outputContainer.appendChild(block);
    block.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function addErrorBlock(message) {
    const block = document.createElement("div");
    block.className = "output-block error-block";
    block.innerHTML = `
        <div class="output-block-header">
            <span class="node-name">Fehler</span>
        </div>
        <div class="output-block-body">${escapeHtml(message)}</div>
    `;
    outputContainer.appendChild(block);
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
