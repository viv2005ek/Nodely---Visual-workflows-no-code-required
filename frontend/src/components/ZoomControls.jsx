import React from 'react';
import { useReactFlow, useViewport, Panel } from 'reactflow';
import { Plus, Minus, Maximize } from 'lucide-react';

export const ZoomControls = () => {
  const { zoomIn, zoomOut, fitView, zoomTo } = useReactFlow();
  const { zoom } = useViewport();

  const roundedZoom = Math.round(zoom * 100);

  return (
    <Panel position="bottom-right" className="!m-4">
      <div className="flex items-center bg-card/90 backdrop-blur border border-panel-border rounded-lg shadow-lg overflow-hidden h-9">
        <button
          onClick={() => zoomOut({ duration: 300 })}
          className="h-full px-2.5 text-foreground hover:bg-accent hover:text-primary transition-colors flex items-center justify-center border-r border-panel-border"
          title="Zoom Out (Ctrl+-)"
          aria-label="Zoom out"
        >
          <Minus size={16} strokeWidth={2.5} />
        </button>
        
        <button
          onClick={() => zoomTo(1, { duration: 300 })}
          className="h-full px-3 text-[11px] font-bold text-foreground hover:bg-accent hover:text-primary transition-colors flex items-center justify-center border-r border-panel-border cursor-pointer select-none min-w-[50px]"
          title="Zoom to 100% (Ctrl+0)"
          aria-label="Reset zoom to 100%"
        >
          {roundedZoom}%
        </button>

        <button
          onClick={() => zoomIn({ duration: 300 })}
          className="h-full px-2.5 text-foreground hover:bg-accent hover:text-primary transition-colors flex items-center justify-center border-r border-panel-border"
          title="Zoom In (Ctrl++)"
          aria-label="Zoom in"
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>

        <button
          onClick={() => fitView({ duration: 400 })}
          className="h-full px-2.5 text-foreground hover:bg-accent hover:text-primary transition-colors flex items-center justify-center"
          title="Fit View"
          aria-label="Fit all nodes in view"
        >
          <Maximize size={14} strokeWidth={2.5} />
        </button>
      </div>
    </Panel>
  );
};
