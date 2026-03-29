import React, { useEffect } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardCopy,
  Scissors,
  CopyPlus,
  Trash2,
  LayoutDashboard,
  Waypoints,
} from 'lucide-react';
import { cn } from '../utils';
import { toast } from 'react-hot-toast';

const MenuItem = ({ icon: Icon, label, onClick, danger, shortcut }) => (
  <div 
    className={cn(
      "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer select-none transition-colors",
      danger 
        ? "text-red-500 hover:bg-red-500/10" 
        : "text-foreground hover:bg-accent hover:text-primary"
    )}
    onClick={onClick}
  >
    {Icon && <Icon size={14} className={cn("opacity-70", danger ? "" : "group-hover:opacity-100")} />}
    <span className="flex-1 font-medium">{label}</span>
    {shortcut && (
      <span className="text-[10px] text-muted ml-4 tracking-widest">{shortcut}</span>
    )}
  </div>
);

export const ContextMenu = () => {
  const contextMenu = useStore((s) => s.contextMenu);
  const setContextMenu = useStore((s) => s.setContextMenu);
  
  const setSelectedNodes = useStore((s) => s.setSelectedNodes);
  const nodes = useStore((s) => s.nodes);

  // Actions
  const copySelectedNodes = () => { useStore.getState().copySelectedNodes(); toast.success('Copied'); };
  const cutSelectedNodes = () => { useStore.getState().cutSelectedNodes(); toast.success('Cut'); };
  const duplicateSelectedNodes = useStore((s) => s.duplicateSelectedNodes);
  const deleteSelectedNodes = useStore((s) => s.deleteSelectedNodes);
  const groupSelectedNodes = useStore((s) => s.groupSelectedNodes);
  const ungroupNode = useStore((s) => s.ungroupNode);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [contextMenu, setContextMenu]);

  const targetNode = contextMenu?.nodeId
    ? nodes.find((n) => n.id === contextMenu.nodeId)
    : null;
  const isGroup = targetNode?.type === 'group';

  const handleAction = (action) => {
    if (contextMenu.nodeId) {
      setSelectedNodes([contextMenu.nodeId]);
    }
    setTimeout(() => {
      action();
      setContextMenu(null);
    }, 0);
  };

  return (
    <AnimatePresence>
      {contextMenu && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15 }}
          className="fixed z-[100] min-w-[180px] py-1 bg-card/80 backdrop-blur-xl border border-panel-border rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem
            icon={ClipboardCopy}
            label="Copy"
            shortcut="Ctrl+C"
            onClick={() => handleAction(copySelectedNodes)}
          />
          <MenuItem
            icon={Scissors}
            label="Cut"
            shortcut="Ctrl+X"
            onClick={() => handleAction(cutSelectedNodes)}
          />
          <MenuItem
            icon={CopyPlus}
            label="Duplicate"
            shortcut="Ctrl+D"
            onClick={() => handleAction(duplicateSelectedNodes)}
          />

          <div className="w-full h-[1px] bg-panel-border my-1" />

          {isGroup ? (
            <MenuItem
              icon={Waypoints}
              label="Ungroup"
              onClick={() => handleAction(() => ungroupNode(contextMenu.nodeId))}
            />
          ) : (
            <MenuItem
              icon={LayoutDashboard}
              label="Group Selected"
              onClick={() => handleAction(groupSelectedNodes)}
            />
          )}

          <div className="w-full h-[1px] bg-panel-border my-1" />

          <MenuItem
            icon={Trash2}
            label="Delete"
            shortcut="Del"
            onClick={() => handleAction(deleteSelectedNodes)}
            danger
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
