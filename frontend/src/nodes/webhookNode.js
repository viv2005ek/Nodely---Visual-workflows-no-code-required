// webhookNode.js

import { createNodeComponent } from '../components/BaseNode';
import { useStore } from '../store';

const WebhookNodeContent = ({ id, data }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);

  return (
    <div className="node-field">
      <label>
        Path:
        <input
          type="text"
          value={data?.path || '/webhook'}
          onChange={(e) => updateNodeField(id, 'path', e.target.value)}
          placeholder="/webhook"
        />
      </label>
      <label>
        Method:
        <select
          value={data?.method || 'POST'}
          onChange={(e) => updateNodeField(id, 'method', e.target.value)}
        >
          <option value="POST">POST</option>
          <option value="GET">GET</option>
          <option value="PUT">PUT</option>
        </select>
      </label>
    </div>
  );
};

export const WebhookNode = createNodeComponent({
  label: 'Webhook',
  nodeType: 'webhook',
  color: '#f97316',
  inputs: [],
  outputs: [
    { id: 'body', label: 'Body', type: 'any' },
    { id: 'headers', label: 'Headers', type: 'any' },
  ],
  content: (props) => <WebhookNodeContent {...props} />,
});
