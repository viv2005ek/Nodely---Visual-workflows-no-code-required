// store.js

import { create } from "zustand";
import { toast } from 'react-hot-toast';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from "reactflow";
import { detectCycles } from "./utils";
import { PipelineSchema } from "./validationSchema";



const MAX_HISTORY = 50;

export const useStore = create((set, get) => ({
  // ── Core state ──────────────────────────────────────────────
  nodes: [],
  edges: [],
  nodeIDs: {},
  viewport: { x: 0, y: 0, zoom: 1 },

  // ── Selection state ─────────────────────────────────────────
  selectedNodes: [],

  // ── Clipboard ───────────────────────────────────────────────
  copiedNodes: [],
  copiedEdges: [],
  cutMode: false,

  // ── Undo / Redo ─────────────────────────────────────────────
  past: [],
  future: [],
  maxHistory: MAX_HISTORY,

  // ── UI state ────────────────────────────────────────────────
  searchPaletteOpen: false,
  searchPalettePosition: null, // {x, y} relative to canvas
  contextMenu: null, // { x, y, nodeId } or null
  propertiesPanelNodeId: null,
  theme: "light", // 'light' or 'dark'
  knifeMode: false, // When true, clicking an edge deletes it

  // ── Actions ─────────────────────────────────────────────────

  // ID generation: produces incremental IDs like 'type-1', 'type-2', …
  getNodeID: (type) => {
    const newIDs = { ...get().nodeIDs };
    if (newIDs[type] === undefined) {
      newIDs[type] = 0;
    }
    newIDs[type] += 1;
    set({ nodeIDs: newIDs });
    return `${type}-${newIDs[type]}`;
  },

  // ── History helpers ─────────────────────────────────────────
  pushToHistory: () => {
    const { nodes, edges, past, maxHistory } = get();
    const snapshot = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };
    const newPast = [...past, snapshot];
    if (newPast.length > maxHistory) {
      newPast.shift();
    }
    set({ past: newPast, future: [] });
  },

  undo: () => {
    const { past, future, nodes, edges } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);
    const currentSnapshot = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };
    set({
      past: newPast,
      future: [...future, currentSnapshot],
      nodes: previous.nodes,
      edges: previous.edges,
    });
  },

  redo: () => {
    const { past, future, nodes, edges } = get();
    if (future.length === 0) return;
    const next = future[future.length - 1];
    const newFuture = future.slice(0, -1);
    const currentSnapshot = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };
    set({
      future: newFuture,
      past: [...past, currentSnapshot],
      nodes: next.nodes,
      edges: next.edges,
    });
  },

  // ── Node / Edge mutations ───────────────────────────────────

  addNode: (node) => {
    get().pushToHistory();
    set({
      nodes: [...get().nodes, node],
    });
  },

  onNodesChange: (changes) => {
    const { nodes, edges } = get();
    const newNodes = applyNodeChanges(changes, nodes);
    const { cycleNodes, cycleEdges } = detectCycles(newNodes, edges);
    
    set({
      nodes: newNodes.map(n => ({
        ...n,
        className: cycleNodes.has(n.id) ? 'cycle-node warning-shake' : ''
      })),
      edges: edges.map(e => ({
        ...e,
        className: cycleEdges.has(e.id) ? 'cycle-edge warning-pulse' : ''
      }))
    });
  },

  onEdgesChange: (changes) => {
    const { nodes, edges } = get();
    const newEdges = applyEdgeChanges(changes, edges);
    const { cycleNodes, cycleEdges } = detectCycles(nodes, newEdges);
    
    set({
      edges: newEdges.map(e => ({
        ...e,
        className: cycleEdges.has(e.id) ? 'cycle-edge warning-pulse' : ''
      })),
      nodes: nodes.map(n => ({
        ...n,
        className: cycleNodes.has(n.id) ? 'cycle-node warning-shake' : ''
      }))
    });
  },

  onConnect: (connection) => {
    const { nodes, edges } = get();
    // Validate: no self-connections
    if (connection.source === connection.target) return;

    const proposedEdge = { 
      ...connection, 
      id: `e-${connection.source}-${connection.target}-${Date.now()}`,
      type: "smoothstep",
      animated: true,
      markerEnd: {
        type: MarkerType.Arrow,
        height: "20px",
        width: "20px",
      },
    };

    const newEdges = addEdge(proposedEdge, edges);
    
    // Recalculate all cycles in the graph
    const { cycleNodes, cycleEdges } = detectCycles(nodes, newEdges);
    
    if (cycleEdges.size > 0 && !edges.some(e => cycleEdges.has(e.id))) {
      toast.error('Cycle detected! Highlighted in yellow.', {
        icon: '⚠️',
        duration: 4000,
      });
    }

    set({
      edges: newEdges.map(e => ({
        ...e,
        className: cycleEdges.has(e.id) ? 'cycle-edge warning-pulse' : ''
      })),
      nodes: nodes.map(n => ({
        ...n,
        className: cycleNodes.has(n.id) ? 'cycle-node warning-shake' : ''
      }))
    });
  },

  updateNodeField: (nodeId, fieldName, fieldValue) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, [fieldName]: fieldValue } };
        }
        return node;
      }),
    });
  },

  // ── Delete ──────────────────────────────────────────────────

  deleteSelectedNodes: () => {
    const { nodes, edges, selectedNodes } = get();
    if (selectedNodes.length === 0) return;
    get().pushToHistory();
    const selectedSet = new Set(selectedNodes);
    const newNodes = nodes.filter((n) => !selectedSet.has(n.id));
    const newEdges = edges.filter(
      (e) => !selectedSet.has(e.source) && !selectedSet.has(e.target)
    );
    
    const { cycleNodes, cycleEdges } = detectCycles(newNodes, newEdges);

    set({
      nodes: newNodes.map(n => ({
        ...n,
        className: cycleNodes.has(n.id) ? 'cycle-node warning-shake' : ''
      })),
      edges: newEdges.map(e => ({
        ...e,
        className: cycleEdges.has(e.id) ? 'cycle-edge warning-pulse' : ''
      })),
      selectedNodes: [],
    });
  },

  // ── Selection ───────────────────────────────────────────────

  selectAllNodes: () => {
    set({ selectedNodes: get().nodes.map((n) => n.id) });
  },

  deselectAllNodes: () => {
    set({ selectedNodes: [] });
  },

  setSelectedNodes: (ids) => {
    set({ selectedNodes: ids });
  },

  // ── Clipboard ───────────────────────────────────────────────

  copySelectedNodes: () => {
    const { nodes, edges, selectedNodes } = get();
    if (selectedNodes.length === 0) return;
    const selectedSet = new Set(selectedNodes);
    const copiedNodes = nodes
      .filter((n) => selectedSet.has(n.id))
      .map((n) => JSON.parse(JSON.stringify(n)));
    // Copy only edges that are fully internal to the selection
    const copiedEdges = edges
      .filter((e) => selectedSet.has(e.source) && selectedSet.has(e.target))
      .map((e) => JSON.parse(JSON.stringify(e)));
    set({ copiedNodes, copiedEdges, cutMode: false });
  },

  cutSelectedNodes: () => {
    const { selectedNodes } = get();
    if (selectedNodes.length === 0) return;
    // Copy first, then delete
    get().copySelectedNodes();
    set({ cutMode: true });
    get().deleteSelectedNodes();
  },

  pasteNodes: (position) => {
    const { copiedNodes, copiedEdges } = get();
    if (copiedNodes.length === 0) return;
    get().pushToHistory();

    // Build old→new ID mapping
    const idMap = {};
    for (const node of copiedNodes) {
      const type = node.type || "node";
      const newId = get().getNodeID(type);
      idMap[node.id] = newId;
    }

    // Compute bounding box of copied nodes to determine offset
    const minX = Math.min(...copiedNodes.map((n) => n.position.x));
    const minY = Math.min(...copiedNodes.map((n) => n.position.y));

    const offsetX = position ? position.x - minX : 50;
    const offsetY = position ? position.y - minY : 50;

    const newNodes = copiedNodes.map((node) => ({
      ...JSON.parse(JSON.stringify(node)),
      id: idMap[node.id],
      position: {
        x: node.position.x + offsetX,
        y: node.position.y + offsetY,
      },
    }));

    const newEdges = copiedEdges.map((edge) => ({
      ...JSON.parse(JSON.stringify(edge)),
      id: `${idMap[edge.source]}->${idMap[edge.target]}`,
      source: idMap[edge.source],
      target: idMap[edge.target],
    }));

    set({
      nodes: [...get().nodes, ...newNodes],
      edges: [...get().edges, ...newEdges],
      selectedNodes: newNodes.map((n) => n.id),
    });
  },

  duplicateSelectedNodes: () => {
    const { selectedNodes, nodes } = get();
    if (selectedNodes.length === 0) return;
    // Copy the currently selected nodes to clipboard
    get().copySelectedNodes();
    // Compute a position offset of (50, 50) relative to the top-left of selection
    const selectedSet = new Set(selectedNodes);
    const selected = nodes.filter((n) => selectedSet.has(n.id));
    const minX = Math.min(...selected.map((n) => n.position.x));
    const minY = Math.min(...selected.map((n) => n.position.y));
    // Paste with an offset of 50,50 from original position
    get().pasteNodes({ x: minX + 50, y: minY + 50 });
  },

  // ── Persistence ─────────────────────────────────────────────

  savePipeline: () => {
    const { nodes, edges, viewport } = get();
    const data = JSON.stringify({ nodes, edges, viewport });
    localStorage.setItem("pipeline-save", data);
  },

  loadPipeline: () => {
    const raw = localStorage.getItem("pipeline-save");
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      set({
        nodes: data.nodes || [],
        edges: data.edges || [],
        viewport: data.viewport || { x: 0, y: 0, zoom: 1 },
      });
    } catch (e) {
      console.error("Failed to load pipeline:", e);
    }
  },

  exportPipeline: () => {
    const { nodes, edges, viewport } = get();
    return JSON.stringify({ nodes, edges, viewport });
  },

  importPipeline: (json) => {
    try {
      const rawData = JSON.parse(json);
      
      // VALIDATE SCHEMA before setting state
      const result = PipelineSchema.safeParse(rawData);
      
      if (!result.success) {
        console.error("Invalid pipeline schema:", result.error);
        toast.error("Failed to import: Invalid pipeline structure.", { id: 'import-err' });
        return;
      }

      const data = result.data;
      get().pushToHistory();
      const { cycleNodes, cycleEdges } = detectCycles(data.nodes || [], data.edges || []);
      
      set({
        nodes: (data.nodes || []).map(n => ({
          ...n,
          className: cycleNodes.has(n.id) ? 'cycle-node warning-shake' : ''
        })),
        edges: (data.edges || []).map(e => ({
          ...e,
          className: cycleEdges.has(e.id) ? 'cycle-edge warning-pulse' : ''
        })),
        viewport: data.viewport || { x: 0, y: 0, zoom: 1 },
      });
      
      toast.success("Pipeline imported successfully!");
    } catch (e) {
      console.error("Failed to parse JSON:", e);
      toast.error("Failed to import: Malformed JSON file.");
    }
  },

  // ── Viewport ────────────────────────────────────────────────

  setViewport: (viewport) => {
    set({ viewport });
  },

  // ── UI state ────────────────────────────────────────────────

  toggleTheme: () => {
    set({ theme: get().theme === "light" ? "dark" : "light" });
  },

  toggleSearchPalette: (position) => {
    const isOpen = !get().searchPaletteOpen;
    set({ 
      searchPaletteOpen: isOpen,
      searchPalettePosition: isOpen ? (position || null) : null
    });
  },

  setContextMenu: (menu) => {
    set({ contextMenu: menu });
  },

  setPropertiesPanelNode: (nodeId) => {
    set({ propertiesPanelNodeId: nodeId });
  },

  toggleKnifeMode: () => {
    set({ knifeMode: !get().knifeMode });
  },

  deleteEdge: (edgeId) => {
    const { nodes, edges } = get();
    const newEdges = edges.filter((e) => e.id !== edgeId);
    const { cycleNodes, cycleEdges } = detectCycles(nodes, newEdges);
    
    set({
      edges: newEdges.map(e => ({
        ...e,
        className: cycleEdges.has(e.id) ? 'cycle-edge warning-pulse' : ''
      })),
      nodes: nodes.map(n => ({
        ...n,
        className: cycleNodes.has(n.id) ? 'cycle-node warning-shake' : ''
      }))
    });
  },

  // ── Grouping ────────────────────────────────────────────────

  groupSelectedNodes: () => {
    const { nodes, selectedNodes } = get();
    if (selectedNodes.length === 0) return;
    get().pushToHistory();

    const selectedSet = new Set(selectedNodes);
    const selected = nodes.filter((n) => selectedSet.has(n.id));

    // Compute bounding box of selected nodes
    const padding = 40;
    const minX = Math.min(...selected.map((n) => n.position.x)) - padding;
    const minY = Math.min(...selected.map((n) => n.position.y)) - padding;
    const maxX =
      Math.max(...selected.map((n) => n.position.x + (n.width || 150))) +
      padding;
    const maxY =
      Math.max(...selected.map((n) => n.position.y + (n.height || 50))) +
      padding;

    const groupId = get().getNodeID("group");

    const groupNode = {
      id: groupId,
      type: "group",
      position: { x: minX, y: minY },
      data: {
        label: "Group",
        childNodeIds: [...selectedNodes],
      },
      style: {
        width: maxX - minX,
        height: maxY - minY,
        backgroundColor: "rgba(208, 192, 255, 0.2)",
        borderRadius: 8,
        border: "2px dashed #9b87f5",
      },
    };

    // Re-parent selected nodes: make their positions relative to the group
    const updatedNodes = nodes.map((node) => {
      if (selectedSet.has(node.id)) {
        return {
          ...node,
          parentNode: groupId,
          extent: "parent",
          position: {
            x: node.position.x - minX,
            y: node.position.y - minY,
          },
        };
      }
      return node;
    });

    // Group node must appear before its children in the array
    set({
      nodes: [groupNode, ...updatedNodes],
      selectedNodes: [groupId],
    });
  },

  ungroupNode: (groupId) => {
    const { nodes, edges } = get();
    const groupNode = nodes.find((n) => n.id === groupId);
    if (!groupNode || groupNode.type !== "group") return;
    get().pushToHistory();

    const childIds = new Set(groupNode.data?.childNodeIds || []);

    // Convert children back to absolute positions and remove parentNode
    const updatedNodes = nodes
      .filter((n) => n.id !== groupId)
      .map((node) => {
        if (childIds.has(node.id)) {
          return {
            ...node,
            parentNode: undefined,
            extent: undefined,
            position: {
              x: node.position.x + groupNode.position.x,
              y: node.position.y + groupNode.position.y,
            },
          };
        }
        return node;
      });

    // Remove any edges connected to the group node itself
    const updatedEdges = edges.filter(
      (e) => e.source !== groupId && e.target !== groupId
    );

    set({
      nodes: updatedNodes,
      edges: updatedEdges,
      selectedNodes: [...childIds],
    });
  },
}));
