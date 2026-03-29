import React from 'react';
import { useStore } from '../store';
import { NODE_REGISTRY } from '../nodes/nodeRegistry';
import { cn } from '../utils';

const FIELD_CONFIGS = {
  customInput: [
    { key: 'inputName', label: 'Name', type: 'text', placeholder: 'input_1' },
    { key: 'inputType', label: 'Type', type: 'select', options: ['Text', 'File'] },
  ],
  customOutput: [
    { key: 'outputName', label: 'Name', type: 'text', placeholder: 'output_1' },
    { key: 'outputType', label: 'Type', type: 'select', options: ['Text', 'Image'] },
  ],
  llm: [
    { key: 'model', label: 'Model', type: 'select', options: ['gpt-4', 'gpt-3.5-turbo', 'claude-3'] },
  ],
  text: [
    { key: 'text', label: 'Text', type: 'textarea', placeholder: '{{variable}}', rows: 5 },
  ],
  apiRequest: [
    { key: 'method', label: 'Method', type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
    { key: 'url', label: 'URL', type: 'text', placeholder: 'https://api.example.com' },
    { key: 'headers', label: 'Headers', type: 'textarea', placeholder: '{"Content-Type": "application/json"}', rows: 3 },
    { key: 'body', label: 'Body', type: 'textarea', placeholder: '{"key": "value"}', rows: 4 },
  ],
  webhook: [
    { key: 'path', label: 'Path', type: 'text', placeholder: '/webhook' },
    { key: 'method', label: 'Method', type: 'select', options: ['POST', 'GET', 'PUT'] },
  ],
  httpResponse: [
    { key: 'statusCode', label: 'Status Code', type: 'number', placeholder: '200' },
    { key: 'contentType', label: 'Content-Type', type: 'select', options: ['application/json', 'text/plain', 'text/html', 'application/xml'] },
    { key: 'body', label: 'Body', type: 'textarea', placeholder: '{"message": "OK"}', rows: 4 },
  ],
  functionNode: [
    { key: 'code', label: 'Code', type: 'code', placeholder: '// Write your code here', rows: 8 },
  ],
  condition: [
    { key: 'field', label: 'Field', type: 'text', placeholder: 'e.g. data.status' },
    { key: 'operator', label: 'Operator', type: 'select', options: ['equals', 'not equals', 'contains', 'greater than', 'less than', 'is empty', 'is not empty'] },
    { key: 'value', label: 'Value', type: 'text', placeholder: 'comparison value' },
  ],
  delay: [
    { key: 'duration', label: 'Duration', type: 'number', placeholder: '1000' },
    { key: 'unit', label: 'Unit', type: 'select', options: ['ms', 'seconds', 'minutes'] },
  ],
  fileNode: [
    { key: 'operation', label: 'Operation', type: 'select', options: ['read', 'write', 'append', 'delete'] },
    { key: 'path', label: 'Path', type: 'text', placeholder: '/path/to/file' },
  ],
  database: [
    { key: 'connection', label: 'Connection', type: 'text', placeholder: 'postgresql://user:pass@host/db' },
    { key: 'query', label: 'Query', type: 'code', placeholder: 'SELECT * FROM table', rows: 5 },
  ],
  email: [
    { key: 'to', label: 'To', type: 'text', placeholder: 'recipient@example.com' },
    { key: 'subject', label: 'Subject', type: 'text', placeholder: 'Email subject' },
    { key: 'body', label: 'Body', type: 'textarea', placeholder: 'Email body...', rows: 4 },
  ],
  notification: [
    { key: 'channel', label: 'Channel', type: 'select', options: ['slack', 'teams', 'discord', 'custom'] },
    { key: 'message', label: 'Message', type: 'textarea', placeholder: 'Notification message...', rows: 4 },
  ],
  blackbox: [
    { key: '_info', label: 'Sub-Pipeline', type: 'info', render: (data) => `${data?.subPipeline?.nodes?.length || 0} nodes inside` },
  ],
  stickyNote: [
    { key: 'text', label: 'Note', type: 'textarea', placeholder: 'Type a note...', rows: 6 },
  ],
  group: [
    { key: 'label', label: 'Label', type: 'text', placeholder: 'Group label' },
  ],
};

const inputClass = "w-full px-3 py-2 border border-[var(--input-border)] rounded-lg text-xs bg-[var(--input-bg)] text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm";

const FieldRenderer = ({ field, value, onChange }) => {
  switch (field.type) {
    case 'text':
      return (
        <input
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={inputClass}
        />
      );
    case 'number':
      return (
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(Number(e.target.value))}
          placeholder={field.placeholder}
          className={inputClass}
        />
      );
    case 'select':
      return (
        <div className="relative">
          <select
            value={value ?? field.options?.[0] ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={cn(inputClass, "appearance-none pr-8 cursor-pointer")}
          >
            {(field.options || []).map((opt) => (
              <option key={opt} value={opt} className="bg-[var(--card)] text-foreground">{opt}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
      );
    case 'textarea':
      return (
        <textarea
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={field.rows || 3}
          className={cn(inputClass, "resize-y min-h-[60px]")}
        />
      );
    case 'code':
      return (
        <textarea
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={field.rows || 5}
          className={cn(inputClass, "font-mono text-[11px] resize-y min-h-[80px]")}
        />
      );
    case 'info':
      return (
        <div className="text-xs text-muted py-1">
          {field.render ? field.render(value) : String(value ?? '')}
        </div>
      );
    default:
      return (
        <input
          type="text"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );
  }
};

export const PropertiesPanel = () => {
  const selectedNodes = useStore((s) => s.selectedNodes);
  const nodes = useStore((s) => s.nodes);
  const updateNodeField = useStore((s) => s.updateNodeField);

  if (selectedNodes.length !== 1) {
    return (
      <div className="w-[280px] h-full bg-panel-bg flex flex-col items-center justify-center shrink-0 border-l border-panel-border z-10 hidden lg:flex">
        <div className="px-6 text-center text-[13px] text-muted font-medium">
          {selectedNodes.length === 0
            ? 'Select a node to view its properties'
            : `${selectedNodes.length} nodes selected`}
        </div>
      </div>
    );
  }

  const nodeId = selectedNodes[0];
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const registryEntry = NODE_REGISTRY[node.type];
  const Icon = registryEntry?.icon;
  const color = registryEntry?.color || '#3b82f6';
  const label = registryEntry?.label || node.type;
  const fields = FIELD_CONFIGS[node.type] || [];

  return (
    <div className="w-[300px] h-full bg-panel-bg flex flex-col shrink-0 border-l border-panel-border overflow-y-auto z-10 hidden lg:flex">
      <div className="p-4 border-b border-panel-border bg-panel-bg sticky top-0 z-20">
        <span className="font-bold text-sm text-foreground">Properties</span>
      </div>

      {/* Node identity */}
      <div className="p-4 border-b border-panel-border">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
            style={{ background: `${color}15`, color: color }}
          >
            {Icon && <Icon size={20} strokeWidth={2} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm text-foreground truncate">{label}</div>
            <div className="text-[10px] text-muted font-mono truncate">{node.id}</div>
          </div>
        </div>
        <div className="h-1 rounded-full w-full opacity-60" style={{ background: color }} />
      </div>

      {/* Dynamic fields */}
      {fields.length > 0 && (
        <div className="p-4 border-b border-panel-border">
          <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-4">
            Configuration
          </div>
          <div className="flex flex-col gap-4">
            {fields.map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-semibold text-muted mb-1.5">{field.label}</label>
                <FieldRenderer
                  field={field}
                  value={field.type === 'info' ? node.data : node.data?.[field.key]}
                  onChange={(val) => updateNodeField(nodeId, field.key, val)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Node position */}
      <div className="p-4 border-b border-panel-border">
        <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-3">
          Position
        </div>
        <div className="flex gap-3">
          <div className="flex-1 border border-[var(--input-border)] rounded-lg bg-[var(--input-bg)] px-3 py-2 flex justify-between items-center shadow-sm">
            <span className="text-xs font-semibold text-muted">X</span>
            <span className="text-xs text-foreground font-mono">{Math.round(node.position?.x ?? 0)}</span>
          </div>
          <div className="flex-1 border border-[var(--input-border)] rounded-lg bg-[var(--input-bg)] px-3 py-2 flex justify-between items-center shadow-sm">
            <span className="text-xs font-semibold text-muted">Y</span>
            <span className="text-xs text-foreground font-mono">{Math.round(node.position?.y ?? 0)}</span>
          </div>
        </div>
      </div>

      {/* Connected edges info */}
      <ConnectedEdgesInfo nodeId={nodeId} />
    </div>
  );
};

const ConnectedEdgesInfo = ({ nodeId }) => {
  const edges = useStore((s) => s.edges);
  const incomingEdges = edges.filter((e) => e.target === nodeId);
  const outgoingEdges = edges.filter((e) => e.source === nodeId);

  if (incomingEdges.length === 0 && outgoingEdges.length === 0) return null;

  return (
    <div className="p-4 border-b border-panel-border">
      <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-3">
        Connections
      </div>
      
      <div className="space-y-3">
        {incomingEdges.length > 0 && (
          <div className="bg-card border border-panel-border rounded-lg p-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted">Incoming Paths</span>
              <span className="text-xs font-bold bg-accent text-foreground px-2 py-0.5 rounded-full">{incomingEdges.length}</span>
            </div>
            <div className="text-[10px] text-muted break-words leading-relaxed">
              {incomingEdges.map((e) => e.source).join(', ')}
            </div>
          </div>
        )}
        
        {outgoingEdges.length > 0 && (
          <div className="bg-card border border-panel-border rounded-lg p-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted">Outgoing Paths</span>
              <span className="text-xs font-bold bg-accent text-foreground px-2 py-0.5 rounded-full">{outgoingEdges.length}</span>
            </div>
            <div className="text-[10px] text-muted break-words leading-relaxed">
              {outgoingEdges.map((e) => e.target).join(', ')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
