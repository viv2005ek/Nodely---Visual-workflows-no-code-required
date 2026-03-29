import React, { useRef, useState } from 'react';
import { useStore } from '../store';
import { toast } from 'react-hot-toast';
import { cn } from '../utils';
import {
  Undo2,
  Redo2,
  Download,
  Upload,
  Save,
  FolderOpen,
  Search,
  ClipboardCopy,
  Scissors,
  CopyPlus,
  ClipboardPaste,
  Trash2,
  LayoutDashboard,
  MessageSquare,
  Play,
  Moon,
  Sun
} from 'lucide-react';
import { submitPipeline } from '../submit';

const ToolbarButton = ({ icon: Icon, label, onClick, disabled, danger, active }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={label}
    className={cn(
      "flex items-center justify-center p-2 rounded-md transition-all duration-200",
      disabled 
        ? "text-muted opacity-50 cursor-not-allowed"
        : danger 
          ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
          : "text-foreground hover:bg-accent/80 active:scale-95",
      active && !disabled && "bg-accent text-primary"
    )}
  >
    <Icon size={16} strokeWidth={2.5} />
  </button>
);

const ToolbarDivider = () => (
  <div className="w-[1px] h-6 bg-panel-border mx-1" />
);

const SubmitButton = ({ onClick, loading }) => (
  <button
    onClick={onClick}
    disabled={loading}
    title="Submit Pipeline (Execute)"
    className={cn(
      "flex items-center gap-1.5 px-3 py-1.5 border-none rounded-lg font-semibold text-xs ml-auto transition-all duration-200",
      loading 
        ? "bg-primary/70 text-white cursor-wait"
        : "bg-primary text-white hover:bg-blue-700 shadow-md hover:shadow-[0_4px_12px_rgba(59,130,246,0.4)] active:scale-95 border border-blue-600/20"
    )}
  >
    <Play size={14} fill={loading ? 'none' : 'currentColor'} className={loading ? 'animate-pulse' : ''} />
    <span className="font-bold tracking-tight">{loading ? 'Submitting…' : 'SUBMIT'}</span>
  </button>
);

export const Toolbar = () => {
  const fileInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);

  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const past = useStore((s) => s.past);
  const future = useStore((s) => s.future);
  const savePipeline = () => {
    useStore.getState().savePipeline();
    toast.success('Pipeline saved locally');
  };
  const loadPipeline = () => {
    useStore.getState().loadPipeline();
    toast.success('Pipeline loaded');
  };
  const exportPipeline = useStore((s) => s.exportPipeline);
  const importPipeline = (data) => {
    useStore.getState().importPipeline(data);
    toast.success('Pipeline imported');
  };
  
  const toggleSearchPalette = useStore((s) => s.toggleSearchPalette);
  const searchPaletteOpen = useStore((s) => s.searchPaletteOpen);

  const copySelectedNodes = () => {
    useStore.getState().copySelectedNodes();
    toast.success('Nodes copied to clipboard');
  };
  const cutSelectedNodes = () => {
    useStore.getState().cutSelectedNodes();
    toast.success('Nodes cut to clipboard');
  };
  const pasteNodes = useStore((s) => s.pasteNodes);
  const duplicateSelectedNodes = useStore((s) => s.duplicateSelectedNodes);
  const deleteSelectedNodes = useStore((s) => s.deleteSelectedNodes);
  const groupSelectedNodes = useStore((s) => s.groupSelectedNodes);
  
  const selectedNodes = useStore((s) => s.selectedNodes);
  const addNode = useStore((s) => s.addNode);
  const getNodeID = useStore((s) => s.getNodeID);
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);

  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const knifeMode = useStore((s) => s.knifeMode);
  const toggleKnifeMode = useStore((s) => s.toggleKnifeMode);

  const handleExport = () => {
    const json = exportPipeline();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pipeline.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      importPipeline(e.target.result);
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Map nodes and edges to match the backend Node and Edge models
      const formattedNodes = nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
      }));
      
      const formattedEdges = edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
      }));

      await submitPipeline(formattedNodes, formattedEdges);
    } catch (err) {
      console.error('Final submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddStickyNote = () => {
    const id = getNodeID('stickyNote');
    addNode({
      id,
      type: 'stickyNote',
      position: { x: 100, y: 100 },
      data: { text: '', width: 200, height: 150 },
    });
  };

  const hasSelection = selectedNodes.length > 0;

  return (
    <div className="absolute bottom-24 md:bottom-auto md:top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-full max-w-[95%] px-4 sm:px-0">
      <div 
        className="mx-auto flex items-center gap-1 p-1.5 bg-card/80 backdrop-blur-md border border-panel-border rounded-xl shadow-lg pointer-events-auto overflow-x-auto snap-x hide-scrollbar"
        style={{ width: 'fit-content' }}
      >
        <ToolbarButton icon={Undo2} label="Undo (Ctrl+Z)" onClick={undo} disabled={past.length === 0} />
        <ToolbarButton icon={Redo2} label="Redo (Ctrl+Y)" onClick={redo} disabled={future.length === 0} />
        
        <ToolbarDivider />

        <ToolbarButton icon={ClipboardCopy} label="Copy (Ctrl+C)" onClick={copySelectedNodes} disabled={!hasSelection} />
        <ToolbarButton icon={Scissors} label="Cut (Ctrl+X)" onClick={cutSelectedNodes} disabled={!hasSelection} />
        <ToolbarButton icon={ClipboardPaste} label="Paste (Ctrl+V)" onClick={() => pasteNodes(null)} />
        <ToolbarButton icon={CopyPlus} label="Duplicate (Ctrl+D)" onClick={duplicateSelectedNodes} disabled={!hasSelection} />
        <ToolbarButton icon={Trash2} label="Delete (Del)" onClick={deleteSelectedNodes} disabled={!hasSelection} danger />

        <ToolbarDivider />

        <ToolbarButton icon={LayoutDashboard} label="Group (Ctrl+G)" onClick={groupSelectedNodes} disabled={selectedNodes.length < 2} />
        <ToolbarButton icon={MessageSquare} label="Add Note" onClick={handleAddStickyNote} />
        <ToolbarButton icon={Search} label="Search Nodes (Ctrl+K)" onClick={toggleSearchPalette} active={searchPaletteOpen} />
        <ToolbarButton icon={Scissors} label="Edge Cut (Knife Mode)" onClick={toggleKnifeMode} active={knifeMode} danger={knifeMode} />

        <ToolbarDivider />

        <ToolbarButton icon={Save} label="Save Locally" onClick={savePipeline} />
        <ToolbarButton icon={FolderOpen} label="Load Locally" onClick={loadPipeline} />
        <ToolbarButton icon={Download} label="Export JSON" onClick={handleExport} />
        <ToolbarButton icon={Upload} label="Import JSON" onClick={() => fileInputRef.current?.click()} />
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />

        <ToolbarDivider />
        
        <ToolbarButton 
          icon={theme === 'dark' ? Sun : Moon} 
          label={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"} 
          onClick={toggleTheme} 
        />

        <div className="pl-1 shrink-0">
          <SubmitButton onClick={handleSubmit} loading={submitting} />
        </div>
      </div>
    </div>
  );
};
