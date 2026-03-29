import { useEffect, useCallback } from 'react';
import { useStore } from '../store';

export const useKeyboardShortcuts = () => {
  const copySelectedNodes = useStore((s) => s.copySelectedNodes);
  const cutSelectedNodes = useStore((s) => s.cutSelectedNodes);
  const pasteNodes = useStore((s) => s.pasteNodes);
  const duplicateSelectedNodes = useStore((s) => s.duplicateSelectedNodes);
  const deleteSelectedNodes = useStore((s) => s.deleteSelectedNodes);
  const selectAllNodes = useStore((s) => s.selectAllNodes);
  const deselectAllNodes = useStore((s) => s.deselectAllNodes);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const toggleSearchPalette = useStore((s) => s.toggleSearchPalette);
  const savePipeline = useStore((s) => s.savePipeline);
  const viewport = useStore((s) => s.viewport);
  const setViewport = useStore((s) => s.setViewport);

  const handleKeyDown = useCallback(
    (e) => {
      const target = e.target;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (isInput) return;

      const isMod = e.ctrlKey || e.metaKey;

      if (isMod && e.key === 'c') {
        e.preventDefault();
        copySelectedNodes();
      } else if (isMod && e.key === 'x') {
        e.preventDefault();
        cutSelectedNodes();
      } else if (isMod && e.key === 'v') {
        e.preventDefault();
        pasteNodes(null);
      } else if (isMod && e.key === 'd') {
        e.preventDefault();
        duplicateSelectedNodes();
      } else if (isMod && e.key === 'a') {
        e.preventDefault();
        selectAllNodes();
      } else if (isMod && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        redo();
      } else if (isMod && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      } else if (isMod && e.key === 's') {
        e.preventDefault();
        savePipeline();
      } else if (isMod && e.key === 'k') {
        e.preventDefault();
        toggleSearchPalette();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedNodes();
      } else if (isMod && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        setViewport({ ...viewport, zoom: Math.min(viewport.zoom + 0.1, 2) });
      } else if (isMod && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        setViewport({ ...viewport, zoom: Math.max(viewport.zoom - 0.1, 0.1) });
      } else if (isMod && e.key === '0') {
        e.preventDefault();
        setViewport({ ...viewport, zoom: 1 });
      } else if (e.key === 'Escape') {
        deselectAllNodes();
      }
    },
    [
      copySelectedNodes,
      cutSelectedNodes,
      pasteNodes,
      duplicateSelectedNodes,
      deleteSelectedNodes,
      selectAllNodes,
      deselectAllNodes,
      undo,
      redo,
      toggleSearchPalette,
      savePipeline,
      viewport,
      setViewport,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};
