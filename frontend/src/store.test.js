import { useStore } from './store';

const { getState, setState } = useStore;

// Helper to create a simple node
const makeNode = (id, type = 'customInput', x = 0, y = 0) => ({
  id,
  type,
  position: { x, y },
  data: { id, nodeType: type },
});

// Helper to create a simple edge
const makeEdge = (source, target) => ({
  id: `${source}->${target}`,
  source,
  target,
});

// Reset store to initial state before each test
beforeEach(() => {
  setState({
    nodes: [],
    edges: [],
    nodeIDs: {},
    viewport: { x: 0, y: 0, zoom: 1 },
    selectedNodes: [],
    copiedNodes: [],
    copiedEdges: [],
    cutMode: false,
    past: [],
    future: [],
    searchPaletteOpen: false,
    contextMenu: null,
    propertiesPanelNodeId: null,
  });
  localStorage.clear();
});

// ── Node ID Generation ────────────────────────────────────────

describe('getNodeID', () => {
  it('generates incremental IDs for a type', () => {
    const id1 = getState().getNodeID('text');
    const id2 = getState().getNodeID('text');
    const id3 = getState().getNodeID('text');
    expect(id1).toBe('text-1');
    expect(id2).toBe('text-2');
    expect(id3).toBe('text-3');
  });

  it('generates independent IDs per type', () => {
    const textId = getState().getNodeID('text');
    const llmId = getState().getNodeID('llm');
    const textId2 = getState().getNodeID('text');
    expect(textId).toBe('text-1');
    expect(llmId).toBe('llm-1');
    expect(textId2).toBe('text-2');
  });
});

// ── Add Node ──────────────────────────────────────────────────

describe('addNode', () => {
  it('adds a node to the state', () => {
    const node = makeNode('n1');
    getState().addNode(node);
    expect(getState().nodes).toHaveLength(1);
    expect(getState().nodes[0].id).toBe('n1');
  });

  it('pushes to history when adding a node', () => {
    getState().addNode(makeNode('n1'));
    expect(getState().past).toHaveLength(1);
    expect(getState().past[0].nodes).toHaveLength(0); // snapshot before add
  });

  it('preserves existing nodes', () => {
    getState().addNode(makeNode('n1'));
    getState().addNode(makeNode('n2'));
    expect(getState().nodes).toHaveLength(2);
  });
});

// ── Update Node Field ─────────────────────────────────────────

describe('updateNodeField', () => {
  it('updates a specific field in node data', () => {
    setState({ nodes: [makeNode('n1')] });
    getState().updateNodeField('n1', 'inputName', 'hello');
    expect(getState().nodes[0].data.inputName).toBe('hello');
  });

  it('does not affect other nodes', () => {
    setState({ nodes: [makeNode('n1'), makeNode('n2')] });
    getState().updateNodeField('n1', 'inputName', 'hello');
    expect(getState().nodes[1].data.inputName).toBeUndefined();
  });

  it('creates new field if it does not exist', () => {
    setState({ nodes: [makeNode('n1')] });
    getState().updateNodeField('n1', 'newField', 42);
    expect(getState().nodes[0].data.newField).toBe(42);
  });
});

// ── Delete Selected Nodes ─────────────────────────────────────

describe('deleteSelectedNodes', () => {
  it('removes selected nodes', () => {
    setState({
      nodes: [makeNode('n1'), makeNode('n2'), makeNode('n3')],
      selectedNodes: ['n1', 'n3'],
    });
    getState().deleteSelectedNodes();
    expect(getState().nodes).toHaveLength(1);
    expect(getState().nodes[0].id).toBe('n2');
  });

  it('removes edges connected to deleted nodes', () => {
    setState({
      nodes: [makeNode('n1'), makeNode('n2'), makeNode('n3')],
      edges: [makeEdge('n1', 'n2'), makeEdge('n2', 'n3')],
      selectedNodes: ['n2'],
    });
    getState().deleteSelectedNodes();
    expect(getState().edges).toHaveLength(0);
  });

  it('clears selectedNodes after delete', () => {
    setState({
      nodes: [makeNode('n1')],
      selectedNodes: ['n1'],
    });
    getState().deleteSelectedNodes();
    expect(getState().selectedNodes).toHaveLength(0);
  });

  it('does nothing when no nodes are selected', () => {
    setState({
      nodes: [makeNode('n1')],
      selectedNodes: [],
    });
    getState().deleteSelectedNodes();
    expect(getState().nodes).toHaveLength(1);
    expect(getState().past).toHaveLength(0);
  });

  it('pushes to history before deleting', () => {
    setState({
      nodes: [makeNode('n1'), makeNode('n2')],
      selectedNodes: ['n1'],
    });
    getState().deleteSelectedNodes();
    expect(getState().past).toHaveLength(1);
    expect(getState().past[0].nodes).toHaveLength(2);
  });
});

// ── Selection ─────────────────────────────────────────────────

describe('selection', () => {
  it('selectAllNodes selects all nodes', () => {
    setState({ nodes: [makeNode('n1'), makeNode('n2'), makeNode('n3')] });
    getState().selectAllNodes();
    expect(getState().selectedNodes).toEqual(['n1', 'n2', 'n3']);
  });

  it('deselectAllNodes clears selection', () => {
    setState({ selectedNodes: ['n1', 'n2'] });
    getState().deselectAllNodes();
    expect(getState().selectedNodes).toEqual([]);
  });

  it('setSelectedNodes sets specific selection', () => {
    getState().setSelectedNodes(['n2', 'n3']);
    expect(getState().selectedNodes).toEqual(['n2', 'n3']);
  });
});

// ── Undo / Redo ───────────────────────────────────────────────

describe('undo/redo', () => {
  it('undo restores previous state', () => {
    getState().addNode(makeNode('n1'));
    expect(getState().nodes).toHaveLength(1);
    getState().undo();
    expect(getState().nodes).toHaveLength(0);
  });

  it('redo restores undone state', () => {
    getState().addNode(makeNode('n1'));
    getState().undo();
    expect(getState().nodes).toHaveLength(0);
    getState().redo();
    expect(getState().nodes).toHaveLength(1);
  });

  it('undo does nothing when past is empty', () => {
    setState({ nodes: [makeNode('n1')] });
    getState().undo();
    expect(getState().nodes).toHaveLength(1);
  });

  it('redo does nothing when future is empty', () => {
    setState({ nodes: [makeNode('n1')] });
    getState().redo();
    expect(getState().nodes).toHaveLength(1);
  });

  it('undo moves current state to future', () => {
    getState().addNode(makeNode('n1'));
    getState().undo();
    expect(getState().future).toHaveLength(1);
    expect(getState().future[0].nodes).toHaveLength(1);
  });

  it('redo moves current state to past', () => {
    getState().addNode(makeNode('n1'));
    getState().undo();
    getState().redo();
    expect(getState().past).toHaveLength(1);
  });

  it('multiple undo/redo cycles work correctly', () => {
    getState().addNode(makeNode('n1'));
    getState().addNode(makeNode('n2'));
    expect(getState().nodes).toHaveLength(2);

    getState().undo();
    expect(getState().nodes).toHaveLength(1);

    getState().undo();
    expect(getState().nodes).toHaveLength(0);

    getState().redo();
    expect(getState().nodes).toHaveLength(1);

    getState().redo();
    expect(getState().nodes).toHaveLength(2);
  });

  it('new action clears future (no redo after new action)', () => {
    getState().addNode(makeNode('n1'));
    getState().addNode(makeNode('n2'));
    getState().undo();
    expect(getState().future).toHaveLength(1);

    getState().addNode(makeNode('n3'));
    expect(getState().future).toHaveLength(0);
  });

  it('history is capped at maxHistory', () => {
    for (let i = 0; i < 60; i++) {
      getState().addNode(makeNode(`n${i}`));
    }
    expect(getState().past.length).toBeLessThanOrEqual(50);
  });
});

// ── Connection & Cycle Detection ──────────────────────────────

describe('onConnect / cycle detection', () => {
  beforeEach(() => {
    setState({
      nodes: [makeNode('a'), makeNode('b'), makeNode('c')],
      edges: [],
    });
  });

  it('creates an edge for a valid connection', () => {
    getState().onConnect({ source: 'a', target: 'b' });
    expect(getState().edges).toHaveLength(1);
    expect(getState().edges[0].source).toBe('a');
    expect(getState().edges[0].target).toBe('b');
  });

  it('rejects self-connections', () => {
    getState().onConnect({ source: 'a', target: 'a' });
    expect(getState().edges).toHaveLength(0);
  });

  it('rejects connections that would create a cycle', () => {
    getState().onConnect({ source: 'a', target: 'b' });
    getState().onConnect({ source: 'b', target: 'c' });
    expect(getState().edges).toHaveLength(2);

    // c -> a would create a cycle: a -> b -> c -> a
    getState().onConnect({ source: 'c', target: 'a' });
    expect(getState().edges).toHaveLength(2);
  });

  it('allows non-cyclic connections in a DAG', () => {
    getState().onConnect({ source: 'a', target: 'b' });
    getState().onConnect({ source: 'a', target: 'c' });
    getState().onConnect({ source: 'b', target: 'c' });
    expect(getState().edges).toHaveLength(3);
  });

  it('rejects direct 2-node cycle', () => {
    getState().onConnect({ source: 'a', target: 'b' });
    getState().onConnect({ source: 'b', target: 'a' });
    expect(getState().edges).toHaveLength(1);
  });

  it('sets edge type to smoothstep and animated', () => {
    getState().onConnect({ source: 'a', target: 'b' });
    const edge = getState().edges[0];
    expect(edge.type).toBe('smoothstep');
    expect(edge.animated).toBe(true);
  });
});

// ── Clipboard (Copy / Cut / Paste / Duplicate) ────────────────

describe('clipboard', () => {
  beforeEach(() => {
    setState({
      nodes: [
        makeNode('n1', 'text', 100, 100),
        makeNode('n2', 'text', 200, 200),
        makeNode('n3', 'llm', 300, 300),
      ],
      edges: [makeEdge('n1', 'n2'), makeEdge('n2', 'n3')],
    });
  });

  describe('copySelectedNodes', () => {
    it('copies selected nodes to clipboard', () => {
      setState({ selectedNodes: ['n1', 'n2'] });
      getState().copySelectedNodes();
      expect(getState().copiedNodes).toHaveLength(2);
      expect(getState().cutMode).toBe(false);
    });

    it('copies internal edges between selected nodes', () => {
      setState({ selectedNodes: ['n1', 'n2'] });
      getState().copySelectedNodes();
      expect(getState().copiedEdges).toHaveLength(1);
      expect(getState().copiedEdges[0].source).toBe('n1');
    });

    it('does not copy edges to non-selected nodes', () => {
      setState({ selectedNodes: ['n1'] });
      getState().copySelectedNodes();
      expect(getState().copiedEdges).toHaveLength(0);
    });

    it('does nothing when no nodes selected', () => {
      setState({ selectedNodes: [] });
      getState().copySelectedNodes();
      expect(getState().copiedNodes).toHaveLength(0);
    });

    it('deep-clones nodes (no shared references)', () => {
      setState({ selectedNodes: ['n1'] });
      getState().copySelectedNodes();
      const copied = getState().copiedNodes[0];
      const original = getState().nodes[0];
      expect(copied).not.toBe(original);
      expect(copied.data).not.toBe(original.data);
    });
  });

  describe('cutSelectedNodes', () => {
    it('copies nodes then deletes them', () => {
      setState({ selectedNodes: ['n1'] });
      getState().cutSelectedNodes();
      expect(getState().copiedNodes).toHaveLength(1);
      expect(getState().cutMode).toBe(true);
      expect(getState().nodes).toHaveLength(2);
      expect(getState().nodes.find((n) => n.id === 'n1')).toBeUndefined();
    });

    it('does nothing when no nodes selected', () => {
      setState({ selectedNodes: [] });
      getState().cutSelectedNodes();
      expect(getState().nodes).toHaveLength(3);
    });
  });

  describe('pasteNodes', () => {
    it('creates new nodes with new IDs', () => {
      setState({ selectedNodes: ['n1'] });
      getState().copySelectedNodes();
      getState().pasteNodes(null);
      expect(getState().nodes).toHaveLength(4);
      const newNode = getState().nodes[3];
      expect(newNode.id).not.toBe('n1');
    });

    it('offsets pasted nodes by (50,50) when no position given', () => {
      setState({ selectedNodes: ['n1'] });
      getState().copySelectedNodes();
      getState().pasteNodes(null);
      const pasted = getState().nodes[3];
      expect(pasted.position.x).toBe(150); // 100 + 50
      expect(pasted.position.y).toBe(150);
    });

    it('pastes at specified position', () => {
      setState({ selectedNodes: ['n1'] });
      getState().copySelectedNodes();
      getState().pasteNodes({ x: 500, y: 500 });
      const pasted = getState().nodes[3];
      expect(pasted.position.x).toBe(500);
      expect(pasted.position.y).toBe(500);
    });

    it('remaps edges between pasted nodes', () => {
      setState({ selectedNodes: ['n1', 'n2'] });
      getState().copySelectedNodes();
      getState().pasteNodes(null);
      const newEdges = getState().edges.filter(
        (e) => e.source !== 'n1' && e.source !== 'n2'
      );
      expect(newEdges).toHaveLength(1);
    });

    it('selects pasted nodes', () => {
      setState({ selectedNodes: ['n1'] });
      getState().copySelectedNodes();
      getState().pasteNodes(null);
      expect(getState().selectedNodes).toHaveLength(1);
      expect(getState().selectedNodes[0]).not.toBe('n1');
    });

    it('does nothing when clipboard is empty', () => {
      getState().pasteNodes(null);
      expect(getState().nodes).toHaveLength(3);
    });

    it('pushes to history', () => {
      setState({ selectedNodes: ['n1'] });
      getState().copySelectedNodes();
      const pastLen = getState().past.length;
      getState().pasteNodes(null);
      expect(getState().past.length).toBe(pastLen + 1);
    });
  });

  describe('duplicateSelectedNodes', () => {
    it('creates duplicates offset by (50, 50)', () => {
      setState({ selectedNodes: ['n1'] });
      getState().duplicateSelectedNodes();
      expect(getState().nodes).toHaveLength(4);
      const dup = getState().nodes[3];
      expect(dup.position.x).toBe(150);
      expect(dup.position.y).toBe(150);
    });

    it('duplicates maintain edges between selected nodes', () => {
      setState({ selectedNodes: ['n1', 'n2'] });
      getState().duplicateSelectedNodes();
      // Original: 2 edges (n1->n2, n2->n3), new: 1 duplicated edge
      expect(getState().edges.length).toBe(3);
    });

    it('does nothing when no nodes selected', () => {
      setState({ selectedNodes: [] });
      getState().duplicateSelectedNodes();
      expect(getState().nodes).toHaveLength(3);
    });
  });
});

// ── Grouping ──────────────────────────────────────────────────

describe('grouping', () => {
  beforeEach(() => {
    setState({
      nodes: [
        makeNode('n1', 'text', 100, 100),
        makeNode('n2', 'text', 300, 200),
      ],
      edges: [],
      selectedNodes: ['n1', 'n2'],
    });
  });

  describe('groupSelectedNodes', () => {
    it('creates a group node', () => {
      getState().groupSelectedNodes();
      const groupNode = getState().nodes.find((n) => n.type === 'group');
      expect(groupNode).toBeDefined();
      expect(groupNode.data.childNodeIds).toEqual(['n1', 'n2']);
    });

    it('group node appears first in the array', () => {
      getState().groupSelectedNodes();
      expect(getState().nodes[0].type).toBe('group');
    });

    it('children get parentNode set to group ID', () => {
      getState().groupSelectedNodes();
      const groupId = getState().nodes[0].id;
      const children = getState().nodes.filter((n) => n.parentNode === groupId);
      expect(children).toHaveLength(2);
    });

    it('children positions become relative to group', () => {
      getState().groupSelectedNodes();
      const groupNode = getState().nodes[0];
      const child1 = getState().nodes.find((n) => n.id === 'n1');
      // child position should be original position minus group position
      expect(child1.position.x).toBe(100 - groupNode.position.x);
      expect(child1.position.y).toBe(100 - groupNode.position.y);
    });

    it('selects the group node after grouping', () => {
      getState().groupSelectedNodes();
      const groupId = getState().nodes[0].id;
      expect(getState().selectedNodes).toEqual([groupId]);
    });

    it('does nothing when no nodes selected', () => {
      setState({ selectedNodes: [] });
      getState().groupSelectedNodes();
      expect(getState().nodes).toHaveLength(2);
    });

    it('pushes to history', () => {
      getState().groupSelectedNodes();
      expect(getState().past).toHaveLength(1);
    });
  });

  describe('ungroupNode', () => {
    it('removes the group node and restores children', () => {
      getState().groupSelectedNodes();
      const groupId = getState().nodes[0].id;
      getState().ungroupNode(groupId);
      expect(getState().nodes.find((n) => n.type === 'group')).toBeUndefined();
      expect(getState().nodes).toHaveLength(2);
    });

    it('restores children to absolute positions', () => {
      getState().groupSelectedNodes();
      const groupId = getState().nodes[0].id;
      getState().ungroupNode(groupId);
      const n1 = getState().nodes.find((n) => n.id === 'n1');
      // Should be back at original position (approximately)
      expect(n1.position.x).toBe(100);
      expect(n1.position.y).toBe(100);
    });

    it('removes parentNode from children', () => {
      getState().groupSelectedNodes();
      const groupId = getState().nodes[0].id;
      getState().ungroupNode(groupId);
      const n1 = getState().nodes.find((n) => n.id === 'n1');
      expect(n1.parentNode).toBeUndefined();
      expect(n1.extent).toBeUndefined();
    });

    it('selects former children after ungrouping', () => {
      getState().groupSelectedNodes();
      const groupId = getState().nodes[0].id;
      getState().ungroupNode(groupId);
      expect(getState().selectedNodes).toContain('n1');
      expect(getState().selectedNodes).toContain('n2');
    });

    it('does nothing for non-group nodes', () => {
      getState().ungroupNode('n1');
      expect(getState().nodes).toHaveLength(2);
    });

    it('pushes to history', () => {
      getState().groupSelectedNodes();
      const groupId = getState().nodes[0].id;
      const pastLen = getState().past.length;
      getState().ungroupNode(groupId);
      expect(getState().past.length).toBe(pastLen + 1);
    });
  });
});

// ── Persistence ───────────────────────────────────────────────

describe('persistence', () => {
  const sampleNodes = [makeNode('n1'), makeNode('n2')];
  const sampleEdges = [makeEdge('n1', 'n2')];

  describe('savePipeline / loadPipeline', () => {
    it('saves and loads pipeline from localStorage', () => {
      setState({ nodes: sampleNodes, edges: sampleEdges });
      getState().savePipeline();

      setState({ nodes: [], edges: [] });
      getState().loadPipeline();

      expect(getState().nodes).toHaveLength(2);
      expect(getState().edges).toHaveLength(1);
    });

    it('saves viewport', () => {
      setState({ nodes: [], edges: [], viewport: { x: 100, y: 200, zoom: 2 } });
      getState().savePipeline();

      setState({ viewport: { x: 0, y: 0, zoom: 1 } });
      getState().loadPipeline();

      expect(getState().viewport).toEqual({ x: 100, y: 200, zoom: 2 });
    });

    it('loadPipeline does nothing when no save exists', () => {
      setState({ nodes: sampleNodes });
      getState().loadPipeline();
      expect(getState().nodes).toHaveLength(2);
    });
  });

  describe('exportPipeline / importPipeline', () => {
    it('exports pipeline as JSON string', () => {
      setState({ nodes: sampleNodes, edges: sampleEdges });
      const json = getState().exportPipeline();
      const parsed = JSON.parse(json);
      expect(parsed.nodes).toHaveLength(2);
      expect(parsed.edges).toHaveLength(1);
      expect(parsed.viewport).toBeDefined();
    });

    it('imports pipeline from JSON string', () => {
      const json = JSON.stringify({
        nodes: sampleNodes,
        edges: sampleEdges,
        viewport: { x: 50, y: 50, zoom: 1.5 },
      });
      getState().importPipeline(json);
      expect(getState().nodes).toHaveLength(2);
      expect(getState().edges).toHaveLength(1);
      expect(getState().viewport.zoom).toBe(1.5);
    });

    it('importPipeline pushes to history', () => {
      const json = JSON.stringify({ nodes: sampleNodes, edges: [] });
      getState().importPipeline(json);
      expect(getState().past).toHaveLength(1);
    });

    it('importPipeline handles invalid JSON gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      getState().importPipeline('not valid json{{{');
      expect(getState().nodes).toHaveLength(0);
      consoleSpy.mockRestore();
    });
  });
});

// ── UI State ──────────────────────────────────────────────────

describe('UI state', () => {
  it('toggleSearchPalette toggles the state', () => {
    expect(getState().searchPaletteOpen).toBe(false);
    getState().toggleSearchPalette();
    expect(getState().searchPaletteOpen).toBe(true);
    getState().toggleSearchPalette();
    expect(getState().searchPaletteOpen).toBe(false);
  });

  it('setContextMenu sets context menu state', () => {
    const menu = { x: 100, y: 200, nodeId: 'n1' };
    getState().setContextMenu(menu);
    expect(getState().contextMenu).toEqual(menu);
  });

  it('setContextMenu clears with null', () => {
    getState().setContextMenu({ x: 0, y: 0, nodeId: null });
    getState().setContextMenu(null);
    expect(getState().contextMenu).toBeNull();
  });

  it('setPropertiesPanelNode sets the node ID', () => {
    getState().setPropertiesPanelNode('n1');
    expect(getState().propertiesPanelNodeId).toBe('n1');
  });

  it('setViewport updates viewport', () => {
    getState().setViewport({ x: 10, y: 20, zoom: 3 });
    expect(getState().viewport).toEqual({ x: 10, y: 20, zoom: 3 });
  });
});
