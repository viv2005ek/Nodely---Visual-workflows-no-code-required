import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { PipelineUI } from './ui';
import { SearchPalette } from './components/SearchPalette';
import { ContextMenu } from './components/ContextMenu';
import { PropertiesPanel } from './components/PropertiesPanel';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useStore } from './store';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

function App() {
  useKeyboardShortcuts();
  const theme = useStore((s) => s.theme);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground transition-colors duration-200">
      <Toaster position="bottom-right" />
      <Toolbar />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        <div className="flex-1 relative">
          <PipelineUI />
        </div>
        <PropertiesPanel />
      </div>
      <SearchPalette />
      <ContextMenu />
    </div>
  );
}

export default App;
