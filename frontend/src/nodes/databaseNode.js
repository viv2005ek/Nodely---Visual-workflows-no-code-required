// databaseNode.js

import { useState } from 'react';
import { createNodeComponent } from '../components/BaseNode';
import { useStore } from '../store';
import { toast } from 'react-hot-toast';

const DatabaseNodeContent = ({ id, data }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const [connection, setConnection] = useState(data?.connection || '');
  const [query, setQuery] = useState(data?.query || 'SELECT * FROM');

  const handleConnectionChange = (e) => {
    setConnection(e.target.value);
    updateNodeField(id, 'connection', e.target.value);
    if (e.target.value.includes('://')) {
      toast('Security Tip: Connection strings are stored in node data. Use secret variables in production!', { icon: '🔐', id: 'db-tip' });
    }
  };

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
    updateNodeField(id, 'query', e.target.value);
  };

  return (
    <div className="node-field">
      <label>
        Connection:
        <input
          type="text"
          value={connection}
          onChange={handleConnectionChange}
          placeholder="postgresql://user:pass@host/db"
        />
      </label>
      <label>
        Query:
        <textarea
          value={query}
          onChange={handleQueryChange}
          rows={3}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
          placeholder="SELECT * FROM table"
        />
      </label>
    </div>
  );
};

export const DatabaseNode = createNodeComponent({
  label: 'Database Query',
  color: '#06b6d4',
  nodeType: 'database',
  inputs: [{ id: 'params', label: 'Params', type: 'any' }],
  outputs: [
    { id: 'results', label: 'Results', type: 'any' },
    { id: 'error', label: 'Error', type: 'error' },
  ],
  content: (props) => <DatabaseNodeContent {...props} />,
});
