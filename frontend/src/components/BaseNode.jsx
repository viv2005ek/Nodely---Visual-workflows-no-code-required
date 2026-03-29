import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { cn } from '../utils';

import {
  Boxes,
  Database,
  Webhook,
  Code,
  FileText,
  Workflow,
  Settings2
} from 'lucide-react';

// Fallback icon map if string is passed or simple component
const iconMap = {
  inputNode: Boxes,
  outputNode: Database,
  functionNode: Code,
  webhookNode: Webhook,
  textNode: FileText,
  logic: Workflow,
  action: Settings2
};

const BaseNode = memo(({ id, data, selected }) => {
  const {
    nodeType = '',
    label = 'Node',
    icon = null,
    color = '#3b82f6',
    inputs = [],
    outputs = [],
    content = null,
    className = '',
  } = data;

  // Determine which icon component to use
  let IconComponent = typeof icon === 'string' ? iconMap[icon] : icon;
  if (!IconComponent && iconMap[nodeType]) {
    IconComponent = iconMap[nodeType];
  }
  if (!IconComponent) {
    IconComponent = Settings2;
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', bounce: 0.35, duration: 0.5 }}
      whileHover={{ y: -2 }}
      className={cn(
        'relative bg-card rounded-xl border border-panel-border min-w-[240px] max-w-[400px]',
        'shadow-sm transition-all duration-200 break-words',
        selected ? 'ring-2 ring-primary shadow-md scale-[1.02] z-50' : 'hover:shadow-md hover:z-40 z-10',
        className
      )}
    >
      {/* Sleek top color bar */}
      <div
        className="h-1.5 w-full bg-primary rounded-t-xl"
        style={{ backgroundColor: color }}
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-card/60 border-b border-panel-border">
        <div 
          className="flex items-center justify-center p-1.5 rounded-lg text-white shadow-sm shrink-0"
          style={{ backgroundColor: color }}
        >
          <IconComponent size={14} strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="text-xs font-semibold text-foreground truncate select-none">
            {label}
          </div>
          {nodeType && (
            <div className="text-[9px] uppercase tracking-wider text-muted font-bold truncate select-none mono">
              {nodeType}
            </div>
          )}
        </div>
      </div>

      {/* Content area */}
      <div 
        className={cn(
          "py-3 text-sm text-foreground bg-panel-bg/30 relative flex flex-col gap-2",
          inputs.length > 0 ? "pl-10" : "pl-3",
          outputs.length > 0 ? "pr-10" : "pr-3"
        )}
      >
        <div className="w-full relative z-20">
          {content && (
            typeof content === 'function' ? content({ id, data }) : content
          )}
        </div>
        {!content && <div className="h-1" />}
      </div>

      {/* Input handles (Left) */}
      {inputs.map((handle, index) => {
        const topPercent = handle.position != null
          ? handle.position
          : ((index + 1) / (inputs.length + 1)) * 100;

        return (
          <div key={handle.id} className="absolute left-0" style={{ top: `${topPercent}%` }}>
            <Handle
              type="target"
              position={Position.Left}
              id={`${id}-${handle.id}`}
              className={cn(
                "!w-3 !h-3 !border-2 !border-background !bg-primary !-ml-1.5",
                "hover:!scale-150 hover:!shadow-[0_0_12px_rgba(59,130,246,0.6)] !transition-all"
              )}
            />
            {handle.label && (
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[11px] font-bold tracking-tight whitespace-nowrap text-foreground bg-card/90 backdrop-blur-sm px-2 py-0.5 rounded-full border border-panel-border shadow-sm pointer-events-none z-30 mono uppercase">
                {handle.label}
              </span>
            )}
          </div>
        );
      })}

      {/* Output handles (Right) */}
      {outputs.map((handle, index) => {
        const topPercent = handle.position != null
          ? handle.position
          : ((index + 1) / (outputs.length + 1)) * 100;

        return (
          <div key={handle.id} className="absolute right-0" style={{ top: `${topPercent}%` }}>
            <Handle
              type="source"
              position={Position.Right}
              id={`${id}-${handle.id}`}
              className={cn(
                "!w-3 !h-3 !border-2 !border-background !bg-primary !-mr-1.5",
                "hover:!scale-150 hover:!shadow-[0_0_12px_rgba(59,130,246,0.6)] !transition-all"
              )}
            />
            {handle.label && (
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[11px] font-bold tracking-tight whitespace-nowrap text-foreground bg-card/90 backdrop-blur-sm px-2 py-0.5 rounded-full border border-panel-border shadow-sm pointer-events-none z-30 mono uppercase">
                {handle.label}
              </span>
            )}
          </div>
        );
      })}
    </motion.div>
  );
});

BaseNode.displayName = 'BaseNode';

export const createNodeComponent = (defaults) => {
  const NodeComponent = (props) => {
    const mergedData = { ...defaults, ...props.data };
    return <BaseNode {...props} data={mergedData} />;
  };
  NodeComponent.displayName = `${defaults.label || 'Custom'}Node`;
  return memo(NodeComponent);
};

export default BaseNode;
