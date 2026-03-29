import { useState, useRef, useCallback } from 'react';
import ReactFlow, { Background, MiniMap } from 'reactflow';
import { useStore } from './store';
import { useShallow } from 'zustand/react/shallow';
import { getNodeTypes, getNodeDefaults, NODE_REGISTRY } from './nodes/nodeRegistry';
import { Focus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from './utils';
import { ZoomControls } from './components/ZoomControls';
import { BlackboxEditor } from './components/BlackboxEditor';

import 'reactflow/dist/style.css';

const gridSize = 20;
const proOptions = { hideAttribution: true };
const nodeTypes = getNodeTypes();

const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  getNodeID: state.getNodeID,
  addNode: state.addNode,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  setSelectedNodes: state.setSelectedNodes,
  setContextMenu: state.setContextMenu,
  setViewport: state.setViewport,
  theme: state.theme,
  knifeMode: state.knifeMode,
  deleteEdge: state.deleteEdge,
});

export const PipelineUI = () => {
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [blackboxEditId, setBlackboxEditId] = useState(null);

  const {
    nodes,
    edges,
    getNodeID,
    addNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNodes,
    setContextMenu,
    setViewport,
    theme,
    knifeMode,
    deleteEdge
  } = useStore(useShallow(selector));

  const toggleSearchPalette = useStore((s) => s.toggleSearchPalette);
  const [isMinimapOpen, setIsMinimapOpen] = useState(true);

  const getInitNodeData = (nodeID, type) => {
    const defaults = getNodeDefaults(type);
    return { id: nodeID, nodeType: type, ...defaults };
  };

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      if (event?.dataTransfer?.getData('application/reactflow')) {
        const appData = JSON.parse(
          event.dataTransfer.getData('application/reactflow')
        );
        const type = appData?.nodeType;

        if (typeof type === 'undefined' || !type) {
          return;
        }

        const position = reactFlowInstance.project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        const nodeID = getNodeID(type);
        const newNode = {
          id: nodeID,
          type,
          position,
          data: getInitNodeData(nodeID, type),
        };

        addNode(newNode);
      }
    },
    [reactFlowInstance, getNodeID, addNode]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }) => {
      setSelectedNodes(selectedNodes.map((n) => n.id));
    },
    [setSelectedNodes]
  );

  const onNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault();
      setSelectedNodes([node.id]);
      setContextMenu({ x: event.clientX, y: event.clientY, nodeId: node.id });
    },
    [setContextMenu, setSelectedNodes]
  );

  const onPaneContextMenu = useCallback(
    (event) => {
      event.preventDefault();
      setContextMenu({ x: event.clientX, y: event.clientY, nodeId: null });
    },
    [setContextMenu]
  );

  const onNodeDoubleClick = useCallback((event, node) => {
    if (node.type === 'blackbox') {
      setBlackboxEditId(node.id);
    }
  }, []);

  const onPaneDoubleClick = useCallback((event) => {
    event.preventDefault();
    if (!reactFlowInstance) return;
    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const position = reactFlowInstance.project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });
    toggleSearchPalette(position);
  }, [reactFlowInstance, toggleSearchPalette]);

  const onMoveEnd = useCallback(
    (event, viewport) => {
      setViewport(viewport);
    },
    [setViewport]
  );

  const isValidConnection = useCallback(
    (connection) => {
      if (connection.source === connection.target) return false;
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);
      if (!sourceNode || !targetNode) return false;
      if (targetNode.type === 'stickyNote' || sourceNode.type === 'stickyNote') return false;
      if (targetNode.type === 'group' || sourceNode.type === 'group') return false;
      return true;
    },
    [nodes]
  );

  const onEdgeClick = useCallback(
    (event, edge) => {
      if (knifeMode) {
        deleteEdge(edge.id);
        toast.success('Edge cut');
      }
    },
    [knifeMode, deleteEdge]
  );

  return (
    <>
      <div ref={reactFlowWrapper} className="w-full h-full bg-background relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onEdgeClick={onEdgeClick}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          proOptions={proOptions}
          snapGrid={[gridSize, gridSize]}
          snapToGrid={true}
          connectionLineType="smoothstep"
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
            style: { strokeWidth: 2, stroke: theme === 'dark' ? '#94a3b8' : '#64748b' }
          }}
          onSelectionChange={onSelectionChange}
          onNodeContextMenu={onNodeContextMenu}
          onPaneContextMenu={onPaneContextMenu}
          onNodeDoubleClick={onNodeDoubleClick}
          onPaneDoubleClick={onPaneDoubleClick}
          onMoveEnd={onMoveEnd}
          isValidConnection={isValidConnection}
          multiSelectionKeyCode="Shift"
          selectionKeyCode="Shift"
          deleteKeyCode={null}
          selectionOnDrag={true}
          panOnScroll={true}
          zoomOnScroll={false}
          zoomOnPinch={true}
          zoomOnDoubleClick={false}
          panOnDrag={[1, 2]}
          fitView
          fitViewOptions={{ maxZoom: 0.83, padding: 0.2 }}
          minZoom={0.1}
          maxZoom={2.0}
          className={cn("pipeline-flow", knifeMode && "knife-mode")}
        >
          <Background color={theme === 'dark' ? '#334155' : '#e2e8f0'} gap={gridSize} size={1} />
          
          <ZoomControls />

          {isMinimapOpen && (
            <MiniMap
              nodeStrokeWidth={2}
              nodeBorderRadius={12}
              zoomable
              pannable
              className="!bg-card/70 !backdrop-blur-md !border !border-panel-border !shadow-2xl !rounded-xl overflow-hidden hidden sm:block !mb-6 !ml-6 pointer-events-auto transition-all"
              nodeColor={(node) => {
                const type = node.type;
                const meta = NODE_REGISTRY[type];
                if (meta) return meta.color;
                if (node.data?.color) return node.data.color;
                return theme === 'dark' ? '#475569' : '#cbd5e1';
              }}
              nodeStrokeColor={(node) => theme === 'dark' ? '#1e293b' : '#ffffff'}
              maskColor={theme === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.4)'}
              maskStrokeColor={theme === 'dark' ? '#3b82f6' : '#2563eb'}
              maskStrokeWidth={2}
              position="bottom-left"
            />
          )}
        </ReactFlow>

        <button 
          onClick={() => setIsMinimapOpen(!isMinimapOpen)}
          className="absolute bottom-4 left-4 z-50 bg-card/90 backdrop-blur border border-panel-border p-1.5 rounded-lg shadow-sm text-muted hover:text-foreground hidden sm:block pointer-events-auto"
          title={isMinimapOpen ? "Hide Minimap" : "Show Minimap"}
        >
          <Focus size={14} className={!isMinimapOpen ? "opacity-50" : ""} />
        </button>
      </div>

      {blackboxEditId && (
        <BlackboxEditor
          nodeId={blackboxEditId}
          onClose={() => setBlackboxEditId(null)}
        />
      )}
    </>
  );
};
