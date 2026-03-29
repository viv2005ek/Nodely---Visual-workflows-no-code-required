// outputNode.js

import { useState } from 'react';
import { createNodeComponent } from '../components/BaseNode';
import { useStore } from '../store';

const OutputNodeContent = ({ id, data }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const [currName, setCurrName] = useState(
    data?.outputName || id.replace('customOutput-', 'output_')
  );
  const [outputType, setOutputType] = useState(data?.outputType || 'Text');

  const handleNameChange = (e) => {
    setCurrName(e.target.value);
    updateNodeField(id, 'outputName', e.target.value);
  };

  const handleTypeChange = (e) => {
    setOutputType(e.target.value);
    updateNodeField(id, 'outputType', e.target.value);
  };

  return (
    <div className="node-field">
      <label>
        Name:
        <input type="text" value={currName} onChange={handleNameChange} />
      </label>
      <label>
        Type:
        <select value={outputType} onChange={handleTypeChange}>
          <option value="Text">Text</option>
          <option value="Image">Image</option>
        </select>
      </label>
    </div>
  );
};

export const OutputNode = createNodeComponent({
  label: 'Output',
  color: '#ef4444',
  nodeType: 'customOutput',
  inputs: [{ id: 'value', label: 'Value', type: 'any' }],
  outputs: [],
  content: (props) => <OutputNodeContent {...props} />,
});
