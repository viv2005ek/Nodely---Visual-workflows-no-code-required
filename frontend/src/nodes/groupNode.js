// groupNode.js

import { memo } from 'react';
import { useStore } from '../store';

export const GroupNode = memo(({ id, data }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const label = data?.label || 'Group';
  const collapsed = data?.collapsed || false;
  const childCount = data?.childNodeIds?.length || 0;

  const handleToggleCollapse = (e) => {
    e.stopPropagation();
    updateNodeField(id, 'collapsed', !collapsed);
  };

  return (
    <div
      className="group-node"
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: collapsed
          ? 'rgba(208, 192, 255, 0.15)'
          : 'transparent',
        borderRadius: 8,
        border: '2px dashed #9b87f5',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          background: 'rgba(155, 135, 245, 0.12)',
          borderBottom: '1px dashed #9b87f5',
          cursor: 'default',
        }}
      >
        <span
          style={{
            fontWeight: 600,
            fontSize: 12,
            color: '#6d54c4',
            userSelect: 'none',
          }}
        >
          {label}
        </span>
        <button
          onClick={handleToggleCollapse}
          style={{
            background: 'none',
            border: '1px solid #9b87f5',
            borderRadius: 4,
            color: '#6d54c4',
            fontSize: 11,
            padding: '1px 6px',
            cursor: 'pointer',
            lineHeight: 1.4,
          }}
        >
          {collapsed ? '▶ Expand' : '▼ Collapse'}
        </button>
      </div>

      {/* Body */}
      {collapsed ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            padding: '12px 10px',
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: '#9b87f5',
              fontStyle: 'italic',
            }}
          >
            {childCount} node{childCount !== 1 ? 's' : ''} hidden
          </span>
        </div>
      ) : (
        <div style={{ flex: 1 }} />
      )}
    </div>
  );
});

GroupNode.displayName = 'GroupNode';
