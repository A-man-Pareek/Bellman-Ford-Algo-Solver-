const canvas = document.getElementById("graphCanvas");
const ctx = canvas.getContext("2d");

const resultModal = document.getElementById('resultModal');
const modalTitle = document.getElementById('modalTitle');
const modalTableContainer = document.getElementById('modalTableContainer');
const closeModalBtn = document.getElementById('closeModalBtn');

let nodes = {};
let edges = [];
let positions = {};
const nodeNames = "ABCDEF".split('');

function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function generateRandomGraph() {
  resetGraph();
  const nodeCount = 6;
  const totalEdges = getRandomInt(10, 13);
  const negativeEdgeCount = getRandomInt(1, 3);
  const shuffledNodes = [...nodeNames].sort(() => 0.5 - Math.random());
  const centerX = canvas.width / 2, centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY) * 0.75;
  shuffledNodes.forEach((name, i) => {
    const angle = (i / nodeCount) * 2 * Math.PI;
    nodes[name] = { dist: Infinity, pred: null };
    positions[name] = { x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle) };
  });
  const existingEdges = new Set();
  
  // Create a cycle to ensure strong connectivity
  for (let i = 0; i < nodeCount; i++) {
    const from = shuffledNodes[i];
    const to = shuffledNodes[(i + 1) % nodeCount];
    edges.push({ from, to, weight: getRandomInt(1, 99) });
    existingEdges.add(`${from}->${to}`);
  }

  // Add remaining random edges
  while (edges.length < totalEdges) {
    const from = shuffledNodes[Math.floor(Math.random() * nodeCount)];
    const to = shuffledNodes[Math.floor(Math.random() * nodeCount)];
    const edgeKey = `${from}->${to}`;
    const reverseKey = `${to}->${from}`; // Key for the reverse edge

    // *** BUG FIX IS HERE ***
    // Now checks if the reverse edge already exists before creating a new one.
    if (from !== to && !existingEdges.has(edgeKey) && !existingEdges.has(reverseKey)) {
      edges.push({ from, to, weight: getRandomInt(0, 99) });
      existingEdges.add(edgeKey);
    }
  }
  
  // Assign negative weights
  for (let i = 0; i < negativeEdgeCount; i++) {
    const edgeIndex = Math.floor(Math.random() * edges.length);
    if (edges[edgeIndex].weight >= 0) edges[edgeIndex].weight = getRandomInt(-10, -1);
    else i--;
  }
  
  const defaultSource = shuffledNodes[0];
  document.getElementById("sourceNode").value = defaultSource;
  drawGraph();
  updateTable();
  populateEdgeList(getTraversalOrder(defaultSource));
  document.getElementById("iterationCounter").textContent = `Iteration: 0 / ${nodeCount - 1}`;
}

function getTraversalOrder(sourceNode) {
    if (!sourceNode || Object.keys(nodes).length === 0) return edges;
    const allNodeNames = Object.keys(nodes).sort();
    const sourceIndex = allNodeNames.indexOf(sourceNode);
    const orderedNodeNames = [...allNodeNames.slice(sourceIndex), ...allNodeNames.slice(0, sourceIndex)];
    const traversalOrder = [];
    orderedNodeNames.forEach(nodeName => {
        const outgoingEdges = edges.filter(edge => edge.from === nodeName).sort((a, b) => a.to.localeCompare(b.to));
        traversalOrder.push(...outgoingEdges);
    });
    return traversalOrder;
}

async function runBellmanFord() {
    const source = document.getElementById("sourceNode").value.trim().toUpperCase();
    if (!nodes[source]) { alert("Source node must exist in the generated graph."); return; }
    
    document.querySelectorAll('.btn').forEach(btn => btn.disabled = true);
    const logBox = document.getElementById("logBox");
    const iterCounter = document.getElementById("iterationCounter");
    logBox.textContent = "";
    const traversalOrder = getTraversalOrder(source);
    populateEdgeList(traversalOrder);
    for (const node in nodes) { nodes[node].dist = Infinity; nodes[node].pred = null; }
    nodes[source].dist = 0;
    updateTable();
    logBox.textContent += `Initialization: Source '${source}' distance is 0.\n\n`;
    
    const V = Object.keys(nodes).length;
    let earlyExit = false;

    for (let i = 1; i < V; i++) {
        iterCounter.textContent = `Iteration: ${i} / ${V - 1}`;
        logBox.textContent += `--- Iteration ${i} ---\n`;
        resetEdgeListColors();
        let updatedInIteration = false;

        for (const edge of traversalOrder) {
            await sleep(1500);
            drawGraph(edge);
            document.getElementById(`edge-${edge.from}-${edge.to}`).classList.add('traversed');
            if (nodes[edge.from].dist !== Infinity && nodes[edge.from].dist + edge.weight < nodes[edge.to].dist) {
                updatedInIteration = true;
                logBox.textContent += `UPDATE: Edge ${edge.from}→${edge.to}. New path found.\n`;
                nodes[edge.to].dist = nodes[edge.from].dist + edge.weight;
                nodes[edge.to].pred = edge.from;
                updateTable(edge.to);
            } else {
                logBox.textContent += `No update for edge ${edge.from}→${edge.to}.\n`;
            }
            logBox.scrollTop = logBox.scrollHeight;
        }
        logBox.textContent += "\n";

        if (!updatedInIteration) { earlyExit = true; logBox.textContent += `No updates in iteration ${i}. Terminating early.\n`; break; }
    }
    
    let negativeCycleDetected = false;
    if (!earlyExit) {
        iterCounter.textContent = `Final Check for Negative Cycles`;
        logBox.textContent += `--- Final Check (Iteration ${V}) ---\n`;
        for (const edge of traversalOrder) {
            if (nodes[edge.from].dist !== Infinity && nodes[edge.from].dist + edge.weight < nodes[edge.to].dist) {
                logBox.textContent += `ERROR: Edge ${edge.from}→${edge.to} can still be relaxed. Negative cycle exists!\n`;
                drawEdge(edge, "#ef4444", 5);
                negativeCycleDetected = true;
                break; 
            }
        }
    }

    if (negativeCycleDetected) {
        showResultModal("Negative Weight Cycle Detected!");
    } else if (earlyExit) {
        showResultModal("Shortest Paths Found (Early Exit)!");
    } else {
        showResultModal("Final Shortest Paths Found!");
    }
    
    if (!negativeCycleDetected) drawGraph();
    document.querySelectorAll('.btn').forEach(btn => btn.disabled = false);
}

function showResultModal(message) {
    const finalTable = document.getElementById('distanceTable').cloneNode(true);
    modalTitle.textContent = message;
    modalTableContainer.innerHTML = '';
    modalTableContainer.appendChild(finalTable);
    resultModal.classList.add('visible');
}

function drawGraph(activeEdge = null) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  edges.forEach(edge => {
    const isActive = activeEdge && edge.from === activeEdge.from && edge.to === activeEdge.to;
    drawEdge(edge, isActive ? "#22c55e" : "#333", isActive ? 4 : 2);
  });
  for (const name in positions) {
    const { x, y } = positions[name];
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, 2 * Math.PI);
    ctx.fillStyle = (activeEdge && (name === activeEdge.from || name === activeEdge.to)) ? "#fef08a" : "#93c5fd";
    ctx.fill();
    ctx.strokeStyle = "#1e40af"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "#000"; ctx.font = "bold 14px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(name, x, y);
  }
}

function drawEdge(edge, color, lineWidth) {
    const { from, to, weight } = edge;
    const posA = positions[from], posB = positions[to];
    ctx.beginPath(); ctx.moveTo(posA.x, posA.y); ctx.lineTo(posB.x, posB.y);
    ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.stroke();
    const angle = Math.atan2(posB.y - posA.y, posB.x - posA.x);
    const arrowLength = 15, arrowWidth = Math.PI / 8;
    ctx.beginPath(); ctx.moveTo(posB.x, posB.y);
    ctx.lineTo(posB.x - arrowLength * Math.cos(angle - arrowWidth), posB.y - arrowLength * Math.sin(angle - arrowWidth));
    ctx.lineTo(posB.x - arrowLength * Math.cos(angle + arrowWidth), posB.y - arrowLength * Math.sin(angle + arrowWidth));
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
    const midX = (posA.x + posB.x) / 2, midY = (posA.y + posB.y) / 2;
    const perpAngle = angle + Math.PI / 2, offset = 15;
    const textX = midX + offset * Math.cos(perpAngle), textY = midY + offset * Math.sin(perpAngle);
    ctx.font = "bold 13px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const textWidth = ctx.measureText(weight).width;
    ctx.fillStyle = "#fff"; ctx.fillRect(textX - textWidth / 2 - 2, textY - 9, textWidth + 4, 18);
    ctx.fillStyle = "#000"; ctx.fillText(weight, textX, textY);
}

function updateTable(highlightedNode = null) {
    const tbody = document.querySelector("#distanceTable tbody");
    tbody.innerHTML = "";
    for (const node in nodes) {
        const dist = nodes[node].dist === Infinity ? "∞" : nodes[node].dist;
        const pred = nodes[node].pred ?? "—";
        const row = document.createElement('tr');
        row.innerHTML = `<td class="p-2">${node}</td><td class.e="p-2">${dist}</td><td class="p-2">${pred}</td>`;
        if (node === highlightedNode) { row.classList.add('row-updated'); setTimeout(() => row.classList.remove('row-updated'), 1200); }
        tbody.appendChild(row);
    }
}

function populateEdgeList(orderedEdges) {
    const edgeListDiv = document.getElementById("edgeList");
    edgeListDiv.innerHTML = "";
    orderedEdges.forEach(({ from, to, weight }) => {
        const p = document.createElement("p");
        p.id = `edge-${from}-${to}`;
        p.className = "edge-item";
        p.textContent = `(${from} → ${to}) : ${weight}`;
        edgeListDiv.appendChild(p);
    });
}

function resetEdgeListColors() { document.querySelectorAll('.edge-item').forEach(item => item.classList.remove('traversed')); }

function resetGraph() {
  nodes = {}; edges = []; positions = {};
  drawGraph();
  updateTable();
  document.getElementById("logBox").textContent = "";
  document.getElementById("edgeList").innerHTML = "";
  document.getElementById("sourceNode").value = "";
  document.getElementById("iterationCounter").textContent = "Iteration: 0 / 0";
  document.querySelectorAll('.btn').forEach(btn => btn.disabled = false);
  resultModal.classList.remove('visible');
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

closeModalBtn.addEventListener('click', () => resultModal.classList.remove('visible'));
resultModal.addEventListener('click', (e) => {
    if (e.target === resultModal) resultModal.classList.remove('visible');
});
document.addEventListener('DOMContentLoaded', generateRandomGraph);