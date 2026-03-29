// conditionNode.js

import { createNodeComponent } from '../components/BaseNode';
import { useStore } from '../store';

const ConditionNodeContent = ({ id, data }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);

  return (
    <div className="node-field">
      <label>
        Field:
        <input
          type="text"
          value={data?.field || ''}
          onChange={(e) => updateNodeField(id, 'field', e.target.value)}
          placeholder="e.g. data.status"
        />
      </label>
      <label>
        Operator:
        <select
          value={data?.operator || 'equals'}
          onChange={(e) => updateNodeField(id, 'operator', e.target.value)}
        >
          <option value="equals">equals</option>
          <option value="not equals">not equals</option>
          <option value="contains">contains</option>
          <option value="greater than">greater than</option>
          <option value="less than">less than</option>
          <option value="is empty">is empty</option>
          <option value="is not empty">is not empty</option>
        </select>
      </label>
      <label>
        Value:
        <input
          type="text"
          value={data?.value || ''}
          onChange={(e) => updateNodeField(id, 'value', e.target.value)}
          placeholder="comparison value"
        />
      </label>
    </div>
  );
};

export const ConditionNode = createNodeComponent({
  label: 'Condition',
  nodeType: 'condition',
  color: '#f59e0b',
  inputs: [
    { id: 'input', label: 'Input', type: 'any' },
  ],
  outputs: [
    { id: 'true', label: 'True', type: 'any' },
    { id: 'false', label: 'False', type: 'any' },
  ],
  content: (props) => <ConditionNodeContent {...props} />,
});
