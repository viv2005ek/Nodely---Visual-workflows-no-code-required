// apiRequestNode.js

import { createNodeComponent } from '../components/BaseNode';
import { useStore } from '../store';
import { toast } from 'react-hot-toast';

const ApiRequestNodeContent = ({ id, data }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);

  return (
    <div className="node-field">
      <label>
        Method:
        <select
          value={data?.method || 'GET'}
          onChange={(e) => updateNodeField(id, 'method', e.target.value)}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
        </select>
      </label>
      <label>
        URL:
        <input
          type="text"
          value={data?.url || ''}
          onChange={(e) => updateNodeField(id, 'url', e.target.value)}
          placeholder="https://api.example.com"
        />
      </label>
      <label>
        Headers:
        <textarea
          value={data?.headers || ''}
          onChange={(e) => {
            updateNodeField(id, 'headers', e.target.value);
            if (e.target.value.toLowerCase().includes('auth') || e.target.value.toLowerCase().includes('key')) {
              toast('Tip: Use environment variables for sensitive auth headers in production.', { icon: '🛡️', id: 'auth-tip' });
            }
          }}
          placeholder='{"Content-Type": "application/json"}'
          rows={3}
        />
      </label>
      <label>
        Body:
        <textarea
          value={data?.body || ''}
          onChange={(e) => updateNodeField(id, 'body', e.target.value)}
          placeholder='{"key": "value"}'
          rows={3}
        />
      </label>
    </div>
  );
};

export const ApiRequestNode = createNodeComponent({
  label: 'API Request',
  nodeType: 'apiRequest',
  color: '#3b82f6',
  inputs: [
    { id: 'trigger', label: 'Trigger', type: 'any' },
    { id: 'body', label: 'Body', type: 'any' },
  ],
  outputs: [
    { id: 'response', label: 'Response', type: 'any' },
    { id: 'error', label: 'Error', type: 'error' },
  ],
  content: (props) => <ApiRequestNodeContent {...props} />,
});
