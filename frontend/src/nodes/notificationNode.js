// notificationNode.js

import { useState } from 'react';
import { createNodeComponent } from '../components/BaseNode';
import { useStore } from '../store';

const NotificationNodeContent = ({ id, data }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const [channel, setChannel] = useState(data?.channel || 'slack');
  const [message, setMessage] = useState(data?.message || '');

  const handleChannelChange = (e) => {
    setChannel(e.target.value);
    updateNodeField(id, 'channel', e.target.value);
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    updateNodeField(id, 'message', e.target.value);
  };

  return (
    <div className="node-field">
      <label>
        Channel:
        <select value={channel} onChange={handleChannelChange}>
          <option value="slack">Slack</option>
          <option value="teams">Teams</option>
          <option value="discord">Discord</option>
          <option value="custom">Custom</option>
        </select>
      </label>
      <label>
        Message:
        <textarea
          value={message}
          onChange={handleMessageChange}
          rows={3}
          placeholder="Notification message..."
        />
      </label>
    </div>
  );
};

export const NotificationNode = createNodeComponent({
  label: 'Notification',
  color: '#a855f7',
  nodeType: 'notification',
  inputs: [{ id: 'trigger', label: 'Trigger', type: 'any' }],
  outputs: [{ id: 'success', label: 'Success', type: 'any' }],
  content: (props) => <NotificationNodeContent {...props} />,
});
