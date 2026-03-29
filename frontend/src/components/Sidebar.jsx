import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getNodeCategories } from '../nodes/nodeRegistry';
import { Search, ChevronDown, ChevronRight, Plus, X } from 'lucide-react';
import { cn } from '../utils';

const DraggableSidebarNode = ({ type, label, icon: Icon, color, description }) => {
  const onDragStart = (event) => {
    const appData = { nodeType: type };
    event.dataTransfer.setData('application/reactflow', JSON.stringify(appData));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={cn(
        "flex items-center gap-3 p-2.5 rounded-lg cursor-grab border border-panel-border bg-card",
        "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:cursor-grabbing"
      )}
      style={{ '--hover-color': color }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--panel-border)';
      }}
      title={description}
    >
      <div
        className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}15`, color: color }}
      >
        {Icon && <Icon size={16} strokeWidth={2.5} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-xs text-foreground">{label}</div>
        <div className="text-[10px] text-muted whitespace-nowrap overflow-hidden text-ellipsis">
          {description}
        </div>
      </div>
    </div>
  );
};

export const Sidebar = () => {
  const categories = getNodeCategories();
  const [expandedCategories, setExpandedCategories] = useState(
    Object.fromEntries(categories.map((c) => [c.key, true]))
  );
  const [search, setSearch] = useState('');
  
  // Mobile sheet state
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleCategory = (key) => {
    setExpandedCategories((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      nodes: cat.nodes.filter(
        (n) =>
          n.type !== 'stickyNote' &&
          n.type !== 'group' &&
          (search === '' ||
            n.label.toLowerCase().includes(search.toLowerCase()) ||
            n.description.toLowerCase().includes(search.toLowerCase()))
      ),
    }))
    .filter((cat) => cat.nodes.length > 0);

  const SidebarContent = (
    <>
      <div className="p-4 border-b border-panel-border shrink-0 bg-panel-bg z-10 sticky top-0 md:static">
        <div className="flex justify-between items-center mb-3">
          <div className="font-bold text-sm text-foreground">Node Palette</div>
          {isMobile && (
            <button onClick={() => setIsMobileOpen(false)} className="p-1 hover:bg-accent rounded-md">
              <X size={18} className="text-muted" />
            </button>
          )}
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nodes..."
            className="w-full pl-8 pr-3 py-2 border border-panel-border rounded-lg text-xs outline-none bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 bg-panel-bg">
        {filteredCategories.map((cat) => (
          <div key={cat.key} className="mb-4">
            <div
              onClick={() => toggleCategory(cat.key)}
              className="flex items-center justify-between py-1.5 cursor-pointer select-none group"
            >
              <span className="font-bold text-[11px] text-muted uppercase tracking-wider group-hover:text-foreground transition-colors">
                {cat.label}
              </span>
              <span className="text-muted group-hover:text-foreground transition-colors">
                {expandedCategories[cat.key] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
            </div>
            
            <AnimatePresence>
              {expandedCategories[cat.key] && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="flex flex-col gap-2 mt-2 overflow-hidden"
                >
                  {cat.nodes.map((node) => (
                    <DraggableSidebarNode key={node.type} {...node} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 280 }}
          className="h-full bg-panel-bg border-r border-panel-border flex flex-col overflow-hidden hidden md:flex"
        >
          {SidebarContent}
        </motion.div>
      )}

      {/* Mobile Floating Action Button */}
      {isMobile && !isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-primary text-white p-4 rounded-full shadow-[0_4px_16px_rgba(59,130,246,0.4)] hover:bg-blue-600 transition-transform active:scale-95 flex items-center gap-2"
        >
          <Plus size={20} />
          <span className="font-semibold text-sm pr-1">Add Node</span>
        </button>
      )}

      {/* Mobile Bottom Sheet Sidebar */}
      <AnimatePresence>
        {isMobile && isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed inset-x-0 bottom-0 top-1/4 bg-panel-bg z-50 rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {SidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
