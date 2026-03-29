import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
  Panel,
} from 'reactflow';
import { useStore } from '../store';
import { getNodeTypes, getNodeDefaults, getNodeCategories, NODE_REGISTRY } from '../nodes/nodeRegistry';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Save,
  ChevronDown,
  ChevronRight,
  Search,
  Pencil,
  Check,
} from 'lucide-react';
import { detectCycles } from '../utils';
import { toast } from 'react-hot-toast';

import 'reactflow/dist/style.css';

const nodeTypes = getNodeTypes();
const proOptions = { hideAttribution: true };

// ─── Sidebar Node Draggable Item ───────────────────────────────────────────
const SidebarNode = ({ type, label, icon: Icon, color, description }) => {
  const onDragStart = (event) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ nodeType: type }));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex items-center gap-2.5 p-2.5 rounded-lg cursor-grab border border-panel-border bg-card hover:shadow-md hover:-translate-y-px active:cursor-grabbing transition-all duration-150 group"
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = color; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--panel-border)'; }}
      title={description}
    >
      <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
        style={{ background: `${color}18`, color }}>
        {Icon && <Icon size={14} strokeWidth={2.5} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-foreground truncate">{label}</div>
        <div className="text-[9px] text-muted truncate">{description}</div>
      </div>
    </div>
  );
};

// ─── Sidebar ────────────────────────────────────────────────────────────────
const BlackboxSidebar = () => {
  const categories = getNodeCategories();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(
    Object.fromEntries(categories.map((c) => [c.key, true]))
  );

  const filtered = categories
    .map((cat) => ({
      ...cat,
      nodes: cat.nodes.filter(
        (n) =>
          n.type !== 'group' &&
          (search === '' ||
            n.label.toLowerCase().includes(search.toLowerCase()) ||
            n.description.toLowerCase().includes(search.toLowerCase()))
      ),
    }))
    .filter((c) => c.nodes.length > 0);

  return (
    <div className="w-[220px] h-full bg-panel-bg border-r border-panel-border flex flex-col shrink-0">
      <div className="p-3 border-b border-panel-border sticky top-0 bg-panel-bg z-10">
        <div className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Node Palette</div>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nodes..."
            className="w-full pl-7 pr-2 py-1.5 border border-panel-border rounded-md text-[11px] bg-card text-foreground outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {filtered.map((cat) => (
          <div key={cat.key}>
            <div
              className="flex items-center justify-between py-1 cursor-pointer select-none group"
              onClick={() => setExpanded((p) => ({ ...p, [cat.key]: !p[cat.key] }))}
            >
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider group-hover:text-foreground transition-colors">
                {cat.label}
              </span>
              {expanded[cat.key] ? <ChevronDown size={12} className="text-muted" /> : <ChevronRight size={12} className="text-muted" />}
            </div>
            <AnimatePresence>
              {expanded[cat.key] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="flex flex-col gap-1.5 mt-1 overflow-hidden"
                >
                  {cat.nodes.map((n) => <SidebarNode key={n.type} {...n} />)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main Editor ─────────────────────────────────────────────────────────────
export const BlackboxEditor = ({ nodeId, onClose }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const mainNodes = useStore((s) => s.nodes);
  const parentNode = mainNodes.find((n) => n.id === nodeId);
  const subPipeline = parentNode?.data?.subPipeline || { nodes: [], edges: [] };

  const [nodes, setNodes] = useState(subPipeline.nodes);
  const [edges, setEdges] = useState(subPipeline.edges);
  const [name, setName] = useState(parentNode?.data?.label || 'Blackbox');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(name);

  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const theme = useStore((s) => s.theme);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => {
      const next = applyNodeChanges(changes, nds);
      const { cycleNodes } = detectCycles(next, edges);
      return next.map(n => ({
        ...n,
        className: cycleNodes.has(n.id) ? 'cycle-node warning-shake' : ''
      }));
    }),
    [edges]
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => {
      const next = applyEdgeChanges(changes, eds);
      const { cycleNodes, cycleEdges } = detectCycles(nodes, next);
      setNodes(nds => nds.map(n => ({
        ...n,
        className: cycleNodes.has(n.id) ? 'cycle-node warning-shake' : ''
      })));
      return next.map(e => ({
        ...e,
        className: cycleEdges.has(e.id) ? 'cycle-edge warning-pulse' : ''
      }));
    }),
    [nodes]
  );

  const onConnect = useCallback(
    (connection) =>
      setEdges((eds) => {
        const proposedEdge = {
          ...connection,
          id: `e-sub-${Date.now()}`,
          type: 'smoothstep',
          animated: true,
          style: { strokeWidth: 2 },
          markerEnd: { type: MarkerType.Arrow, height: '20px', width: '20px' },
        };
        const next = addEdge(proposedEdge, eds);
        const { cycleNodes, cycleEdges } = detectCycles(nodes, next);
        
        if (cycleEdges.size > 0 && !eds.some(e => cycleEdges.has(e.id))) {
          toast.error('Cycle detected in Sub-Pipeline!', { icon: '⚠️' });
        }

        setNodes(nds => nds.map(n => ({
          ...n,
          className: cycleNodes.has(n.id) ? 'cycle-node warning-shake' : ''
        })));

        return next.map(e => ({
          ...e,
          className: cycleEdges.has(e.id) ? 'cycle-edge warning-pulse' : ''
        }));
      }),
    [nodes]
  );

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      if (!reactFlowInstance || !reactFlowWrapper.current) return;
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const raw = event.dataTransfer.getData('application/reactflow');
      if (!raw) return;
      const { nodeType } = JSON.parse(raw);
      if (!nodeType) return;

      const position = reactFlowInstance.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const id = `${nodeType}-sub-${Date.now()}`;
      const defaults = getNodeDefaults(nodeType);
      setNodes((nds) => [
        ...nds,
        { id, type: nodeType, position, data: { id, nodeType, ...defaults } },
      ]);
      toast.success(`Added ${nodeType} node`);
    },
    [reactFlowInstance]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onEdgeDoubleClick = useCallback((event, edge) => {
    setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    toast.success('Edge removed');
  }, []);

  const handleSaveName = () => {
    const trimmed = nameInput.trim() || 'Blackbox';
    setName(trimmed);
    setEditingName(false);
    // Also update the node label live
    updateNodeField(nodeId, 'label', trimmed);
  };

  const handleSave = () => {
    updateNodeField(nodeId, 'subPipeline', { nodes, edges });
    updateNodeField(nodeId, 'label', name);
    toast.success(`"${name}" saved`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
        className="relative w-[95vw] h-[90vh] max-w-6xl bg-background rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-panel-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 bg-card border-b border-panel-border shrink-0">
          {/* Editable Name */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
                  className="px-2 py-1 text-sm font-bold bg-panel-bg border border-primary rounded-md text-foreground outline-none"
                />
                <button onClick={handleSaveName} className="p-1 rounded text-green-500 hover:bg-accent" title="Save name">
                  <Check size={14} />
                </button>
                <button onClick={() => setEditingName(false)} className="p-1 rounded text-muted hover:bg-accent" title="Cancel">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => { setNameInput(name); setEditingName(true); }}>
                <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{name}</span>
                <Pencil size={12} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>

          <div className="text-xs text-muted font-mono shrink-0">{nodeId}</div>

          {/* Breadcrumb hint */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-muted px-2 py-1 bg-panel-bg rounded-md border border-panel-border shrink-0">
            <span className="text-foreground font-medium">Main</span>
            <span>/</span>
            <span className="text-primary font-semibold">{name}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <div className="text-[11px] text-muted hidden sm:block">
              {nodes.length} node{nodes.length !== 1 ? 's' : ''} · {edges.length} edge{edges.length !== 1 ? 's' : ''}
            </div>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
            >
              <Save size={13} />
              Save & Close
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-accent transition-colors"
              title="Discard changes"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body: Sidebar + Canvas */}
        <div className="flex flex-1 min-h-0">
          <BlackboxSidebar />

          <div ref={reactFlowWrapper} className="flex-1 h-full bg-background">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onEdgeDoubleClick={onEdgeDoubleClick}
              onInit={setReactFlowInstance}
              nodeTypes={nodeTypes}
              proOptions={proOptions}
              snapGrid={[20, 20]}
              snapToGrid={true}
              connectionLineType="smoothstep"
              defaultEdgeOptions={{
                type: 'smoothstep',
                animated: true,
                style: { strokeWidth: 2, stroke: theme === 'dark' ? '#94a3b8' : '#64748b' },
              }}
              deleteKeyCode="Delete"
              selectionOnDrag={true}
              panOnScroll={true}
              zoomOnPinch={true}
              fitView
              fitViewOptions={{ maxZoom: 0.84, padding: 0.2 }}
              minZoom={0.1}
              maxZoom={2.0}
              className="pipeline-flow"
            >
              <Background color={theme === 'dark' ? '#334155' : '#e2e8f0'} gap={20} size={1} />
              <Controls
                showInteractive={false}
                className="!bg-card !border !border-panel-border !rounded-lg !shadow-md overflow-hidden"
              />
              <MiniMap
                nodeStrokeWidth={2}
                nodeBorderRadius={12}
                zoomable
                pannable
                className="!bg-card/70 !backdrop-blur-md !border !border-panel-border !shadow-2xl !rounded-xl overflow-hidden hidden sm:block !mb-6 !mr-6 pointer-events-auto transition-all"
                nodeColor={(node) => {
                  const type = node.type;
                  const meta = NODE_REGISTRY[type];
                  if (meta) return meta.color;
                  if (node.data?.color) return node.data.color;
                  return theme === 'dark' ? '#475569' : '#cbd5e1';
                }}
                nodeStrokeColor={(node) => theme === 'dark' ? '#1e293b' : '#ffffff'}
                maskColor={theme === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.4)'}
                maskStrokeColor={theme === 'dark' ? '#3b82f6' : '#2563eb'}
                maskStrokeWidth={2}
                position="bottom-right"
              />
              <Panel position="top-right" className="!m-3">
                <div className="text-[10px] uppercase font-bold tracking-wider text-muted bg-card/80 backdrop-blur border border-panel-border px-2 py-1 rounded-md">
                  Double-click edge to delete
                </div>
              </Panel>
            </ReactFlow>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
