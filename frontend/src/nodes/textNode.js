// textNode.js

import { useState, useRef, useEffect } from 'react';
import BaseNode from '../components/BaseNode';
import { useStore } from '../store';

export const TextNode = ({ id, data, selected }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const [currText, setCurrText] = useState(data?.text || '{{input}}');
  const textareaRef = useRef(null);

  // Auto-resize logic height
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [currText]);

  // Handle variables detection: {{ varName }}
  // SECURITY: Using a strictly scoped regex to prevent ReDoS and ensure safe variable names
  const variables = [...currText.matchAll(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g)].map((m) => m[1]);
  const uniqueVars = [...new Set(variables)];

  const dynamicInputs = uniqueVars.map((v) => ({
    id: v,
    label: v,
    type: 'text',
  }));

  const handleTextChange = (e) => {
    setCurrText(e.target.value);
    updateNodeField(id, 'text', e.target.value);
  };

  const nodeData = {
    ...data,
    label: 'Text',
    color: '#6b7280',
    nodeType: 'text',
    inputs: dynamicInputs,
    outputs: [{ id: 'output', label: 'Output', type: 'text' }],
    // Override BaseNode width limits
    className: 'max-w-none min-w-[200px] w-fit',
    content: () => (
      <div className="flex flex-col gap-1.5 w-full">
        <label className="text-xs font-semibold text-muted">
          Text Content:
        </label>
        <div className="relative w-full">
          {/* Mirror element to expand width naturally */}
          <div className="invisible whitespace-pre-wrap break-words px-2.5 py-2 text-xs border border-transparent pointer-events-none min-h-[40px] max-w-[600px]">
            {currText || ' '}
          </div>
          <textarea
            ref={textareaRef}
            value={currText}
            onChange={handleTextChange}
            className="absolute inset-0 w-full h-full px-2.5 py-2 text-xs border border-panel-border rounded-md bg-card focus:outline-none focus:ring-1 focus:ring-primary overflow-hidden resize-none min-h-[40px] leading-relaxed"
            placeholder="Type here..."
          />
        </div>
        <div className="text-[10px] text-muted-foreground opacity-60 italic">
          Tip: use {"{{"}varName{"}}"} to add dynamic inputs.
        </div>
      </div>
    ),
  };

  return <BaseNode id={id} data={nodeData} selected={selected} />;
};

