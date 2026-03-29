// delayNode.js

import { createNodeComponent } from '../components/BaseNode';
import { useStore } from '../store';

const DelayNodeContent = ({ id, data }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);

  return (
    <div className="node-field">
      <label>
        Duration:
        <input
          type="number"
          value={data?.duration ?? 1000}
          onChange={(e) => updateNodeField(id, 'duration', Number(e.target.value))}
          min={0}
          placeholder="1000"
        />
      </label>
      <label>
        Unit:
        <select
          value={data?.unit || 'ms'}
          onChange={(e) => updateNodeField(id, 'unit', e.target.value)}
        >
          <option value="ms">ms</option>
          <option value="seconds">seconds</option>
          <option value="minutes">minutes</option>
        </select>
      </label>
    </div>
  );
};

export const DelayNode = createNodeComponent({
  label: 'Delay',
  nodeType: 'delay',
  color: '#64748b',
  inputs: [
    { id: 'input', label: 'Input', type: 'any' },
  ],
  outputs: [
    { id: 'output', label: 'Output', type: 'any' },
  ],
  content: (props) => <DelayNodeContent {...props} />,
});
