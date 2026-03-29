// fileNode.js

import { useState } from 'react';
import { createNodeComponent } from '../components/BaseNode';
import { useStore } from '../store';

const FileNodeContent = ({ id, data }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const [operation, setOperation] = useState(data?.operation || 'read');
  const [path, setPath] = useState(data?.path || '');

  const handleOperationChange = (e) => {
    setOperation(e.target.value);
    updateNodeField(id, 'operation', e.target.value);
  };

  const handlePathChange = (e) => {
    setPath(e.target.value);
    updateNodeField(id, 'path', e.target.value);
  };

  return (
    <div className="node-field">
      <label>
        Operation:
        <select value={operation} onChange={handleOperationChange}>
          <option value="read">Read</option>
          <option value="write">Write</option>
          <option value="append">Append</option>
          <option value="delete">Delete</option>
        </select>
      </label>
      <label>
        Path:
        <input
          type="text"
          value={path}
          onChange={handlePathChange}
          placeholder="/path/to/file"
        />
      </label>
    </div>
  );
};

export const FileNode = createNodeComponent({
  label: 'File',
  color: '#84cc16',
  nodeType: 'fileNode',
  inputs: [{ id: 'input', label: 'Input', type: 'any' }],
  outputs: [{ id: 'output', label: 'Output', type: 'any' }],
  content: (props) => <FileNodeContent {...props} />,
});
