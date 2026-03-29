// blackboxNode.js

import React from 'react';
import { createNodeComponent } from '../components/BaseNode';
import { Layers } from 'lucide-react';

const BlackboxNodeContent = ({ id, data }) => {
  const nodeCount = data?.subPipeline?.nodes?.length || 0;
  const edgeCount = data?.subPipeline?.edges?.length || 0;

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Visual preview area */}
      <div className="rounded-lg bg-slate-900 dark:bg-slate-950 border border-slate-700 p-3 flex flex-col items-center gap-2">
        <Layers size={20} className="text-slate-400" strokeWidth={1.5} />
        <div className="text-[11px] text-slate-300 font-medium text-center">
          Double-click to edit
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <span className="bg-slate-800 px-2 py-0.5 rounded-full font-mono">
            {nodeCount} node{nodeCount !== 1 ? 's' : ''}
          </span>
          <span className="bg-slate-800 px-2 py-0.5 rounded-full font-mono">
            {edgeCount} edge{edgeCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

export const BlackboxNode = createNodeComponent({
  label: 'Blackbox',
  color: '#334155',
  nodeType: 'blackbox',
  inputs: [{ id: 'input', label: 'Input', type: 'any' }],
  outputs: [{ id: 'output', label: 'Output', type: 'any' }],
  content: (props) => <BlackboxNodeContent {...props} />,
});
