// functionNode.js

import { createNodeComponent } from '../components/BaseNode';
import { useStore } from '../store';

const FunctionNodeContent = ({ id, data }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);

  return (
    <div className="node-field">
      <label>
        Code:
        <textarea
          value={data?.code ?? '// Write your code here\nreturn input;'}
          onChange={(e) => updateNodeField(id, 'code', e.target.value)}
          rows={6}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
          placeholder="// Write your code here"
        />
      </label>
    </div>
  );
};

export const FunctionNode = createNodeComponent({
  label: 'Function',
  nodeType: 'functionNode',
  color: '#eab308',
  inputs: [
    { id: 'input', label: 'Input', type: 'any' },
  ],
  outputs: [
    { id: 'output', label: 'Output', type: 'any' },
    { id: 'error', label: 'Error', type: 'error' },
  ],
  content: (props) => <FunctionNodeContent {...props} />,
});
