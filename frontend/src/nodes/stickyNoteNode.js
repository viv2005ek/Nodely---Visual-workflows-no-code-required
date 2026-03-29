// stickyNoteNode.js

import { memo, useState } from 'react';
import { useStore } from '../store';

export const StickyNoteNode = memo(({ id, data }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const [text, setText] = useState(data?.text || '');

  const handleTextChange = (e) => {
    setText(e.target.value);
    updateNodeField(id, 'text', e.target.value);
  };

  return (
    <div
      className="sticky-note"
      style={{
        width: data?.width || 200,
        height: data?.height || 150,
        backgroundColor: '#fef3c7',
        border: '1px solid #f59e0b',
        borderRadius: 4,
        boxShadow: '2px 2px 6px rgba(0, 0, 0, 0.1)',
        padding: 8,
        display: 'flex',
        flexDirection: 'column',
        resize: 'both',
        overflow: 'auto',
        minWidth: 120,
        minHeight: 80,
      }}
    >
      <textarea
        value={text}
        onChange={handleTextChange}
        placeholder="Type a note..."
        style={{
          flex: 1,
          width: '100%',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          resize: 'none',
          fontFamily: 'inherit',
          fontSize: 13,
          lineHeight: 1.5,
          color: '#78350f',
        }}
      />
    </div>
  );
});

StickyNoteNode.displayName = 'StickyNoteNode';
