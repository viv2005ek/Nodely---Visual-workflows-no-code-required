// llmNode.js

import { useState } from 'react';
import { createNodeComponent } from '../components/BaseNode';
import { useStore } from '../store';

const LLMNodeContent = ({ id, data }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const [model, setModel] = useState(data?.model || 'gpt-4');

  const handleModelChange = (e) => {
    setModel(e.target.value);
    updateNodeField(id, 'model', e.target.value);
  };

  return (
    <div className="node-field">
      <span>This is a LLM.</span>
      <label>
        Model:
        <select value={model} onChange={handleModelChange}>
          <option value="gpt-4">gpt-4</option>
          <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
          <option value="claude-3">claude-3</option>
        </select>
      </label>
    </div>
  );
};

export const LLMNode = createNodeComponent({
  label: 'LLM',
  color: '#8b5cf6',
  nodeType: 'llm',
  inputs: [
    { id: 'system', label: 'System', type: 'text' },
    { id: 'prompt', label: 'Prompt', type: 'text' },
  ],
  outputs: [{ id: 'response', label: 'Response', type: 'text' }],
  content: (props) => <LLMNodeContent {...props} />,
});
