import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Helper: Identify all nodes and edges that are part of any cycle
export function detectCycles(nodes, edges) {
  const adj = {};
  for (const node of nodes) adj[node.id] = [];
  for (const edge of edges) {
    if (adj[edge.source]) adj[edge.source].push(edge.target);
  }

  const cycleNodes = new Set();
  const cycleEdges = new Set();

  // For each edge, check if its target can reach its source
  for (const edge of edges) {
    const visited = new Set();
    const stack = [edge.target];
    let found = false;
    while (stack.length > 0) {
      const curr = stack.pop();
      if (curr === edge.source) {
        found = true;
        break;
      }
      if (visited.has(curr)) continue;
      visited.add(curr);
      for (const neighbor of (adj[curr] || [])) {
        if (!visited.has(neighbor)) stack.push(neighbor);
      }
    }
    if (found) {
      cycleEdges.add(edge.id);
      cycleNodes.add(edge.source);
      cycleNodes.add(edge.target);
    }
  }

  return { cycleNodes, cycleEdges };
}

