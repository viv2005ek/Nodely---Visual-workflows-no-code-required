// emailNode.js

import { useState } from 'react';
import { createNodeComponent } from '../components/BaseNode';
import { useStore } from '../store';

const EmailNodeContent = ({ id, data }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const [to, setTo] = useState(data?.to || '');
  const [subject, setSubject] = useState(data?.subject || '');
  const [body, setBody] = useState(data?.body || '');

  const handleToChange = (e) => {
    setTo(e.target.value);
    updateNodeField(id, 'to', e.target.value);
  };

  const handleSubjectChange = (e) => {
    setSubject(e.target.value);
    updateNodeField(id, 'subject', e.target.value);
  };

  const handleBodyChange = (e) => {
    setBody(e.target.value);
    updateNodeField(id, 'body', e.target.value);
  };

  return (
    <div className="node-field">
      <label>
        To:
        <input
          type="text"
          value={to}
          onChange={handleToChange}
          placeholder="recipient@example.com"
        />
      </label>
      <label>
        Subject:
        <input
          type="text"
          value={subject}
          onChange={handleSubjectChange}
          placeholder="Email subject"
        />
      </label>
      <label>
        Body:
        <textarea
          value={body}
          onChange={handleBodyChange}
          rows={3}
          placeholder="Email body..."
        />
      </label>
    </div>
  );
};

export const EmailNode = createNodeComponent({
  label: 'Email',
  color: '#ec4899',
  nodeType: 'email',
  inputs: [
    { id: 'trigger', label: 'Trigger', type: 'any' },
    { id: 'body', label: 'Body', type: 'text' },
  ],
  outputs: [
    { id: 'success', label: 'Success', type: 'any' },
    { id: 'error', label: 'Error', type: 'error' },
  ],
  content: (props) => <EmailNodeContent {...props} />,
});
