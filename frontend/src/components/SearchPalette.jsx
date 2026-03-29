import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { getNodeCategories, getNodeDefaults } from '../nodes/nodeRegistry';
import { motion, AnimatePresence } from 'framer-motion';

export const SearchPalette = () => {
  const [search, setSearch] = useState('');
  const inputRef = useRef(null);
  const searchPaletteOpen = useStore((s) => s.searchPaletteOpen);
  const searchPalettePosition = useStore((s) => s.searchPalettePosition);
  const toggleSearchPalette = useStore((s) => s.toggleSearchPalette);
  const addNode = useStore((s) => s.addNode);
  const getNodeID = useStore((s) => s.getNodeID);

  useEffect(() => {
    if (searchPaletteOpen && inputRef.current) {
      inputRef.current.focus();
      setSearch('');
    }
  }, [searchPaletteOpen]);

  if (!searchPaletteOpen) return null;

  const categories = getNodeCategories();
  const allNodes = categories.flatMap((cat) =>
    cat.nodes
      .filter((n) => n.type !== 'stickyNote' && n.type !== 'group')
      .map((n) => ({ ...n, category: cat.label }))
  );

  const filtered = allNodes.filter(
    (n) =>
      search === '' ||
      n.label.toLowerCase().includes(search.toLowerCase()) ||
      n.description.toLowerCase().includes(search.toLowerCase()) ||
      n.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (type) => {
    const nodeID = getNodeID(type);
    const defaults = getNodeDefaults(type);
    // Use saved position or default to near center
    const x = searchPalettePosition ? searchPalettePosition.x : (250 + Math.random() * 200);
    const y = searchPalettePosition ? searchPalettePosition.y : (150 + Math.random() * 200);

    addNode({
      id: nodeID,
      type,
      position: { x, y },
      data: { id: nodeID, nodeType: type, ...defaults },
    });
    toggleSearchPalette();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      toggleSearchPalette();
    }
    if (e.key === 'Enter' && filtered.length > 0) {
      handleAdd(filtered[0].type);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
        <div 
          className="absolute inset-0 bg-black/10 backdrop-blur-[2px] pointer-events-auto" 
          onClick={() => toggleSearchPalette()} 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15 }}
          className="bg-card w-[360px] max-h-[80vh] flex flex-col rounded-xl border border-panel-border shadow-2xl pointer-events-auto overflow-hidden relative"
        >
          <div className="p-3 border-b border-panel-border bg-panel-bg shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search for a node..."
              className="w-full px-3 py-2 border border-panel-border bg-card text-foreground rounded-lg outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-2 pb-4 flex flex-col gap-1">
            {filtered.length === 0 && (
              <div className="p-4 text-center text-muted text-sm">
                No nodes found
              </div>
            )}
            {filtered.map((node) => {
              const Icon = node.icon;
              return (
                <div
                  key={node.type}
                  onClick={() => handleAdd(node.type)}
                  className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-accent hover:text-primary transition-colors group"
                >
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105"
                    style={{ background: `${node.color}15`, color: node.color }}
                  >
                    {Icon && <Icon size={16} strokeWidth={2.5} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
                      {node.label}
                    </div>
                    <div className="text-[10px] text-muted overflow-hidden text-ellipsis whitespace-nowrap">
                      {node.description}
                    </div>
                  </div>
                  <span className="text-[9px] text-muted bg-panel-bg px-1.5 py-0.5 rounded border border-panel-border font-medium uppercase tracking-wider">
                    {node.category}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
