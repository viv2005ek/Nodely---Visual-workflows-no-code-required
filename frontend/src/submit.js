import { toast } from 'react-hot-toast';
import React from 'react';
import { CheckCircle2, XCircle, Box, Activity, Share2, ShieldAlert } from 'lucide-react';
import { detectCycles, cn } from './utils';

/**
 * Sends the pipeline structure to the backend for analysis.
 * If the backend is unavailable, it performs a local calculation as a fallback.
 * @param {Array} nodes - List of nodes in the current pipeline.
 * @param {Array} edges - List of edges in the current pipeline.
 */
export const submitPipeline = async (nodes, edges) => {
  const loadingToast = toast.loading('Analyzing pipeline data...');
  
  let result = null;
  let isFallback = false;

  try {
    const response = await fetch('http://localhost:8000/pipelines/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nodes, edges }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Server error: ${response.status}`);
    }

    result = await response.json();
  } catch (error) {
    console.warn('Backend unavailable, falling back to local calculation:', error);
    isFallback = true;
    
    // Calculate locally
    const { cycleEdges } = detectCycles(nodes, edges);
    result = {
      num_nodes: nodes.length,
      num_edges: edges.length,
      is_dag: cycleEdges.size === 0
    };

    toast.error('Backend unreachable. Using local engine.', {
      duration: 3000,
      icon: <ShieldAlert size={16} className="text-amber-500" />,
    });
  }

  toast.dismiss(loadingToast);

  // Custom Rich Toast for results
  toast((t) => (
    <div className="flex flex-col gap-3 min-w-[300px] p-1">
      <div className="flex items-center justify-between border-b border-panel-border pb-2 mb-1">
        <div className="flex items-center gap-2">
          <Share2 className={cn("transition-colors", isFallback ? "text-amber-500" : "text-primary")} size={18} />
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-foreground">
              Pipeline Analysis {isFallback ? '(Local)' : ''}
            </span>
            {isFallback && <span className="text-[9px] text-amber-500 font-bold uppercase tracking-widest">Offline Mode</span>}
          </div>
        </div>
        <button 
          onClick={() => toast.dismiss(t.id)}
          className="text-muted hover:text-foreground transition-colors"
        >
          <XCircle size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-accent/50 p-2 rounded-lg flex flex-col items-center justify-center border border-panel-border/50 shadow-sm transition-all hover:bg-accent hover:border-panel-border">
          <Box size={16} className="text-blue-500 mb-1" />
          <span className="text-[10px] uppercase font-bold text-muted">Nodes</span>
          <span className="text-lg font-bold text-foreground mono tracking-tight">{result.num_nodes}</span>
        </div>
        <div className="bg-accent/50 p-2 rounded-lg flex flex-col items-center justify-center border border-panel-border/50 shadow-sm transition-all hover:bg-accent hover:border-panel-border">
          <Activity size={16} className="text-indigo-500 mb-1" />
          <span className="text-[10px] uppercase font-bold text-muted">Edges</span>
          <span className="text-lg font-bold text-foreground mono tracking-tight">{result.num_edges}</span>
        </div>
      </div>

      <div className={cn(
        "flex items-center gap-3 p-3 rounded-xl border transition-all shadow-sm ring-1",
        result.is_dag 
          ? "bg-green-500/5 border-green-500/20 text-green-600 dark:text-green-400 ring-green-500/10" 
          : "bg-red-500/5 border-red-500/20 text-red-600 dark:text-red-400 ring-red-500/10"
      )}>
        <div className={cn(
          "p-2 rounded-full",
          result.is_dag ? "bg-green-500/10" : "bg-red-500/10"
        )}>
          {result.is_dag ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold uppercase tracking-wider">
            {result.is_dag ? 'Valid Pipeline' : 'Cycle Detected'}
          </span>
          <span className="text-[10px] opacity-80 leading-tight">
            {result.is_dag 
              ? 'Your graph is a valid Directed Acyclic Graph.' 
              : 'Warning: Infinite loop detected in logic flow.'}
          </span>
        </div>
      </div>
    </div>
  ), {
    duration: 8000,
    position: 'bottom-center',
    style: {
      background: 'var(--card)',
      color: 'var(--foreground)',
      border: '1px solid var(--panel-border)',
      borderRadius: '16px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      padding: '8px',
    }
  });

  return result;
};


