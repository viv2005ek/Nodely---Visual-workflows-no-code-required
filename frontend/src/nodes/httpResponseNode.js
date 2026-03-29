// httpResponseNode.js

import { createNodeComponent } from '../components/BaseNode';
import { useStore } from '../store';

const HttpResponseNodeContent = ({ id, data }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);

  return (
    <div className="node-field">
      <label>
        Status Code:
        <input
          type="number"
          value={data?.statusCode ?? 200}
          onChange={(e) => updateNodeField(id, 'statusCode', Number(e.target.value))}
          placeholder="200"
        />
      </label>
      <label>
        Content-Type:
        <select
          value={data?.contentType || 'application/json'}
          onChange={(e) => updateNodeField(id, 'contentType', e.target.value)}
        >
          <option value="application/json">application/json</option>
          <option value="text/plain">text/plain</option>
          <option value="text/html">text/html</option>
          <option value="application/xml">application/xml</option>
          <option value="application/x-www-form-urlencoded">application/x-www-form-urlencoded</option>
        </select>
      </label>
      <label>
        Body:
        <textarea
          value={data?.body || ''}
          onChange={(e) => updateNodeField(id, 'body', e.target.value)}
          placeholder='{"message": "OK"}'
          rows={3}
        />
      </label>
    </div>
  );
};

export const HttpResponseNode = createNodeComponent({
  label: 'HTTP Response',
  nodeType: 'httpResponse',
  color: '#14b8a6',
  inputs: [
    { id: 'body', label: 'Body', type: 'any' },
    { id: 'headers', label: 'Headers', type: 'any' },
  ],
  outputs: [],
  content: (props) => <HttpResponseNodeContent {...props} />,
});
