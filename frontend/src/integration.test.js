import { useStore } from './store';
import { getNodeDefaults } from './nodes/nodeRegistry';

const { getState, setState } = useStore;

// Helper: create a node using the store's getNodeID + addNode (mimics UI flow)
const createNode = (type, x = 0, y = 0) => {
  const id = getState().getNodeID(type);
  const defaults = getNodeDefaults(type);
  const node = {
    id,
    type,
    position: { x, y },
    data: { id, nodeType: type, ...defaults },
  };
  getState().addNode(node);
  return id;
};

// Helper: connect two nodes using the store's onConnect (mimics dragging a wire)
const connect = (source, target, sourceHandle, targetHandle) => {
  getState().onConnect({
    source,
    target,
    sourceHandle: sourceHandle || null,
    targetHandle: targetHandle || null,
  });
};

// Reset store before each test
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

// ── End-to-End Pipeline Creation ──────────────────────────────

describe('E2E: building a complete pipeline', () => {
  it('creates Input → Text → LLM → Output pipeline with connections', () => {
    const inputId = createNode('customInput', 0, 0);
    const textId = createNode('text', 200, 0);
    const llmId = createNode('llm', 400, 0);
    const outputId = createNode('customOutput', 600, 0);

    expect(getState().nodes).toHaveLength(4);

    connect(inputId, textId);
    connect(textId, llmId);
    connect(llmId, outputId);

    expect(getState().edges).toHaveLength(3);

    // Verify node types are correct
    const types = getState().nodes.map((n) => n.type);
    expect(types).toEqual(['customInput', 'text', 'llm', 'customOutput']);

    // Verify edges form a chain
    const edges = getState().edges;
    expect(edges[0].source).toBe(inputId);
    expect(edges[0].target).toBe(textId);
    expect(edges[1].source).toBe(textId);
    expect(edges[1].target).toBe(llmId);
    expect(edges[2].source).toBe(llmId);
    expect(edges[2].target).toBe(outputId);
  });

  it('creates nodes with correct default data from registry', () => {
    const inputId = createNode('customInput');
    const llmId = createNode('llm');
    const apiId = createNode('apiRequest');

    const inputNode = getState().nodes.find((n) => n.id === inputId);
    expect(inputNode.data.inputType).toBe('Text');

    const llmNode = getState().nodes.find((n) => n.id === llmId);
    expect(llmNode.data.model).toBe('gpt-4');

    const apiNode = getState().nodes.find((n) => n.id === apiId);
    expect(apiNode.data.method).toBe('GET');
    expect(apiNode.data.url).toBe('');
  });

  it('builds a branching DAG with condition node', () => {
    //  Input → Condition → (true) → Email
    //                    → (false) → Notification
    const inputId = createNode('customInput', 0, 100);
    const condId = createNode('condition', 200, 100);
    const emailId = createNode('email', 400, 0);
    const notifId = createNode('notification', 400, 200);

    connect(inputId, condId);
    connect(condId, emailId);
    connect(condId, notifId);

    expect(getState().edges).toHaveLength(3);
    expect(getState().nodes).toHaveLength(4);

    // Verify the condition node fans out to two targets
    const condOutEdges = getState().edges.filter((e) => e.source === condId);
    expect(condOutEdges).toHaveLength(2);
    expect(condOutEdges.map((e) => e.target).sort()).toEqual(
      [emailId, notifId].sort()
    );
  });

  it('builds a diamond DAG (merge after branch)', () => {
    //    A
    //   / \
    //  B   C
    //   \ /
    //    D
    const a = createNode('customInput', 200, 0);
    const b = createNode('text', 100, 100);
    const c = createNode('functionNode', 300, 100);
    const d = createNode('customOutput', 200, 200);

    connect(a, b);
    connect(a, c);
    connect(b, d);
    connect(c, d);

    expect(getState().edges).toHaveLength(4);

    // All connections are valid (no cycles in a diamond)
    const dInEdges = getState().edges.filter((e) => e.target === d);
    expect(dInEdges).toHaveLength(2);
  });
});

// ── Connection Validation in Complex Graphs ───────────────────

describe('E2E: connection validation', () => {
  it('prevents cycles in a 4-node chain', () => {
    const a = createNode('customInput');
    const b = createNode('text');
    const c = createNode('llm');
    const d = createNode('customOutput');

    connect(a, b);
    connect(b, c);
    connect(c, d);
    expect(getState().edges).toHaveLength(3);

    // d → a would create: a → b → c → d → a
    connect(d, a);
    expect(getState().edges).toHaveLength(3);

    // d → b would create: b → c → d → b
    connect(d, b);
    expect(getState().edges).toHaveLength(3);

    // But d → (new node) is fine
    const e = createNode('email');
    connect(d, e);
    expect(getState().edges).toHaveLength(4);
  });

  it('prevents cycles in a diamond after adding a back-edge', () => {
    const a = createNode('customInput');
    const b = createNode('text');
    const c = createNode('llm');
    const d = createNode('customOutput');

    connect(a, b);
    connect(a, c);
    connect(b, d);
    connect(c, d);
    expect(getState().edges).toHaveLength(4);

    // d → a would cycle through both branches
    connect(d, a);
    expect(getState().edges).toHaveLength(4);
  });

  it('allows parallel independent chains', () => {
    // Chain 1: a1 → b1 → c1
    const a1 = createNode('customInput');
    const b1 = createNode('llm');
    const c1 = createNode('customOutput');
    connect(a1, b1);
    connect(b1, c1);

    // Chain 2: a2 → b2 → c2
    const a2 = createNode('customInput');
    const b2 = createNode('llm');
    const c2 = createNode('customOutput');
    connect(a2, b2);
    connect(b2, c2);

    expect(getState().edges).toHaveLength(4);

    // Cross-chain connection is fine (no cycle)
    connect(c1, a2);
    expect(getState().edges).toHaveLength(5);

    // But reverse cross-chain would create a cycle now
    connect(c2, a1);
    expect(getState().edges).toHaveLength(5);
  });

  it('all edges have smoothstep type and animated flag', () => {
    const a = createNode('customInput');
    const b = createNode('llm');
    const c = createNode('customOutput');
    connect(a, b);
    connect(b, c);

    getState().edges.forEach((edge) => {
      expect(edge.type).toBe('smoothstep');
      expect(edge.animated).toBe(true);
      expect(edge.markerEnd).toBeDefined();
    });
  });
});

// ── Node Field Updates in a Pipeline ──────────────────────────

describe('E2E: node field updates within a pipeline', () => {
  it('updates fields on connected nodes independently', () => {
    const inputId = createNode('customInput');
    const llmId = createNode('llm');
    const outputId = createNode('customOutput');
    connect(inputId, llmId);
    connect(llmId, outputId);

    getState().updateNodeField(inputId, 'inputName', 'user_query');
    getState().updateNodeField(inputId, 'inputType', 'File');
    getState().updateNodeField(llmId, 'model', 'claude-3');
    getState().updateNodeField(outputId, 'outputName', 'result');
    getState().updateNodeField(outputId, 'outputType', 'Image');

    const input = getState().nodes.find((n) => n.id === inputId);
    const llm = getState().nodes.find((n) => n.id === llmId);
    const output = getState().nodes.find((n) => n.id === outputId);

    expect(input.data.inputName).toBe('user_query');
    expect(input.data.inputType).toBe('File');
    expect(llm.data.model).toBe('claude-3');
    expect(output.data.outputName).toBe('result');
    expect(output.data.outputType).toBe('Image');

    // Connections are not affected by field updates
    expect(getState().edges).toHaveLength(2);
  });

  it('updates API request node fields for a webhook pipeline', () => {
    const webhookId = createNode('webhook');
    const funcId = createNode('functionNode');
    const apiId = createNode('apiRequest');
    const responseId = createNode('httpResponse');

    connect(webhookId, funcId);
    connect(funcId, apiId);
    connect(apiId, responseId);

    getState().updateNodeField(webhookId, 'path', '/api/data');
    getState().updateNodeField(webhookId, 'method', 'GET');
    getState().updateNodeField(funcId, 'code', 'return input.toUpperCase();');
    getState().updateNodeField(apiId, 'method', 'POST');
    getState().updateNodeField(apiId, 'url', 'https://api.example.com/submit');
    getState().updateNodeField(apiId, 'headers', '{"Authorization": "Bearer token"}');
    getState().updateNodeField(responseId, 'statusCode', 201);

    const webhook = getState().nodes.find((n) => n.id === webhookId);
    const func = getState().nodes.find((n) => n.id === funcId);
    const api = getState().nodes.find((n) => n.id === apiId);
    const response = getState().nodes.find((n) => n.id === responseId);

    expect(webhook.data.path).toBe('/api/data');
    expect(func.data.code).toBe('return input.toUpperCase();');
    expect(api.data.method).toBe('POST');
    expect(api.data.url).toBe('https://api.example.com/submit');
    expect(response.data.statusCode).toBe(201);
  });
});

// ── Clipboard Workflows ───────────────────────────────────────

describe('E2E: copy/paste a connected sub-pipeline', () => {
  let inputId, textId, llmId, outputId;

  beforeEach(() => {
    inputId = createNode('customInput', 0, 0);
    textId = createNode('text', 200, 0);
    llmId = createNode('llm', 400, 0);
    outputId = createNode('customOutput', 600, 0);
    connect(inputId, textId);
    connect(textId, llmId);
    connect(llmId, outputId);
  });

  it('copies and pastes a sub-pipeline preserving internal connections', () => {
    // Select text → llm (the middle two)
    setState({ selectedNodes: [textId, llmId] });
    getState().copySelectedNodes();

    expect(getState().copiedNodes).toHaveLength(2);
    // Only the edge between text and llm is internal
    expect(getState().copiedEdges).toHaveLength(1);

    getState().pasteNodes({ x: 0, y: 200 });

    expect(getState().nodes).toHaveLength(6); // 4 original + 2 pasted
    // Original 3 edges + 1 new internal edge
    expect(getState().edges).toHaveLength(4);

    // Pasted nodes have new IDs
    const pastedNodes = getState().nodes.slice(4);
    expect(pastedNodes[0].id).not.toBe(textId);
    expect(pastedNodes[1].id).not.toBe(llmId);

    // Pasted internal edge connects the new nodes
    const pastedEdge = getState().edges[3];
    expect(pastedEdge.source).toBe(pastedNodes[0].id);
    expect(pastedEdge.target).toBe(pastedNodes[1].id);
  });

  it('cut and paste removes original and creates new', () => {
    setState({ selectedNodes: [textId, llmId] });
    getState().cutSelectedNodes();

    // Original text and llm are gone
    expect(getState().nodes).toHaveLength(2);
    expect(getState().nodes.find((n) => n.id === textId)).toBeUndefined();
    expect(getState().nodes.find((n) => n.id === llmId)).toBeUndefined();

    // Edges connecting to removed nodes are gone
    expect(getState().edges).toHaveLength(0);

    // Paste brings them back (with new IDs)
    getState().pasteNodes({ x: 100, y: 300 });
    expect(getState().nodes).toHaveLength(4); // 2 remaining + 2 pasted
    expect(getState().edges).toHaveLength(1); // 1 internal edge between pasted nodes
  });

  it('duplicate entire pipeline preserves all connections', () => {
    setState({ selectedNodes: [inputId, textId, llmId, outputId] });
    getState().duplicateSelectedNodes();

    expect(getState().nodes).toHaveLength(8); // 4 original + 4 duplicated
    // 3 original + 3 duplicated internal edges
    expect(getState().edges).toHaveLength(6);

    // Duplicated nodes form their own complete chain
    const dupNodes = getState().nodes.slice(4);
    const dupEdges = getState().edges.slice(3);

    const dupNodeIds = new Set(dupNodes.map((n) => n.id));
    dupEdges.forEach((edge) => {
      expect(dupNodeIds.has(edge.source)).toBe(true);
      expect(dupNodeIds.has(edge.target)).toBe(true);
    });
  });

  it('pasted nodes are independent from originals (no shared references)', () => {
    setState({ selectedNodes: [inputId] });
    getState().copySelectedNodes();
    getState().pasteNodes(null);

    const pasted = getState().nodes[4];

    // Modify pasted node's data
    getState().updateNodeField(pasted.id, 'inputName', 'modified');

    // Original should not be affected
    const originalAfter = getState().nodes.find((n) => n.id === inputId);
    expect(originalAfter.data.inputName).not.toBe('modified');
  });
});

// ── Multi-Step Undo/Redo Across Operations ────────────────────

describe('E2E: undo/redo across mixed operations', () => {
  it('undoes a full pipeline build step by step', () => {
    const id1 = createNode('customInput');  // past: 1 entry
    const id2 = createNode('llm');          // past: 2 entries
    const id3 = createNode('customOutput'); // past: 3 entries

    expect(getState().nodes).toHaveLength(3);
    expect(getState().past).toHaveLength(3);

    getState().undo(); // remove output
    expect(getState().nodes).toHaveLength(2);

    getState().undo(); // remove llm
    expect(getState().nodes).toHaveLength(1);

    getState().undo(); // remove input
    expect(getState().nodes).toHaveLength(0);

    // Redo everything back
    getState().redo();
    expect(getState().nodes).toHaveLength(1);

    getState().redo();
    expect(getState().nodes).toHaveLength(2);

    getState().redo();
    expect(getState().nodes).toHaveLength(3);
  });

  it('undoes delete and restores connections', () => {
    const a = createNode('customInput');
    const b = createNode('llm');
    const c = createNode('customOutput');
    connect(a, b);
    connect(b, c);

    // Delete the middle node
    setState({ selectedNodes: [b] });
    getState().deleteSelectedNodes();

    expect(getState().nodes).toHaveLength(2);
    expect(getState().edges).toHaveLength(0);

    // Undo should restore the node AND its connections
    getState().undo();
    expect(getState().nodes).toHaveLength(3);
    expect(getState().edges).toHaveLength(2);
    expect(getState().nodes.find((n) => n.id === b)).toBeDefined();
  });

  it('undoes paste operation', () => {
    const a = createNode('customInput');
    const b = createNode('llm');
    connect(a, b);

    setState({ selectedNodes: [a, b] });
    getState().copySelectedNodes();
    getState().pasteNodes(null);

    expect(getState().nodes).toHaveLength(4);
    expect(getState().edges).toHaveLength(2); // original + pasted internal

    getState().undo();
    expect(getState().nodes).toHaveLength(2);
    expect(getState().edges).toHaveLength(1);
  });

  it('undoes group and ungroup in sequence', () => {
    const a = createNode('customInput', 100, 100);
    const b = createNode('llm', 300, 100);
    connect(a, b);

    // Group
    setState({ selectedNodes: [a, b] });
    getState().groupSelectedNodes();
    const groupId = getState().nodes[0].id;
    expect(getState().nodes[0].type).toBe('group');

    // Ungroup
    getState().ungroupNode(groupId);
    expect(getState().nodes.find((n) => n.type === 'group')).toBeUndefined();

    // Undo ungroup → group is back
    getState().undo();
    expect(getState().nodes.find((n) => n.type === 'group')).toBeDefined();

    // Undo group → back to two standalone nodes
    getState().undo();
    expect(getState().nodes).toHaveLength(2);
    expect(getState().nodes.find((n) => n.type === 'group')).toBeUndefined();
    expect(getState().nodes.every((n) => !n.parentNode)).toBe(true);
  });

  it('new action after undo clears redo stack', () => {
    const a = createNode('customInput');
    createNode('llm');
    createNode('customOutput');

    getState().undo(); // undo output
    getState().undo(); // undo llm
    expect(getState().future).toHaveLength(2);

    // New action clears redo
    createNode('email');
    expect(getState().future).toHaveLength(0);

    // Can't redo anymore
    getState().redo();
    expect(getState().nodes).toHaveLength(2); // input + email
  });
});

// ── Import/Export Round-Trip ──────────────────────────────────

describe('E2E: export/import round-trip', () => {
  it('exports and imports a full pipeline identically', () => {
    const inputId = createNode('customInput', 50, 50);
    const llmId = createNode('llm', 250, 50);
    const outputId = createNode('customOutput', 450, 50);
    connect(inputId, llmId);
    connect(llmId, outputId);

    // Configure some fields
    getState().updateNodeField(inputId, 'inputName', 'query');
    getState().updateNodeField(llmId, 'model', 'claude-3');
    getState().updateNodeField(outputId, 'outputName', 'answer');
    getState().setViewport({ x: 100, y: 200, zoom: 1.5 });

    // Export
    const json = getState().exportPipeline();
    const exported = JSON.parse(json);

    // Clear everything
    setState({ nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } });
    expect(getState().nodes).toHaveLength(0);

    // Import
    getState().importPipeline(json);

    // Verify nodes restored
    expect(getState().nodes).toHaveLength(3);
    expect(getState().edges).toHaveLength(2);

    // Verify field values preserved
    const importedInput = getState().nodes.find((n) => n.id === inputId);
    expect(importedInput.data.inputName).toBe('query');

    const importedLlm = getState().nodes.find((n) => n.id === llmId);
    expect(importedLlm.data.model).toBe('claude-3');

    // Verify viewport restored
    expect(getState().viewport).toEqual({ x: 100, y: 200, zoom: 1.5 });

    // Verify edge connectivity preserved
    expect(getState().edges[0].source).toBe(inputId);
    expect(getState().edges[0].target).toBe(llmId);
  });

  it('save/load round-trip through localStorage', () => {
    const a = createNode('apiRequest', 0, 0);
    const b = createNode('functionNode', 200, 0);
    connect(a, b);
    getState().updateNodeField(a, 'url', 'https://test.com');
    getState().updateNodeField(b, 'code', 'return 42;');

    getState().savePipeline();

    // Clear state
    setState({ nodes: [], edges: [] });
    expect(getState().nodes).toHaveLength(0);

    getState().loadPipeline();

    expect(getState().nodes).toHaveLength(2);
    expect(getState().edges).toHaveLength(1);

    const loadedApi = getState().nodes.find((n) => n.id === a);
    expect(loadedApi.data.url).toBe('https://test.com');

    const loadedFunc = getState().nodes.find((n) => n.id === b);
    expect(loadedFunc.data.code).toBe('return 42;');
  });

  it('import replaces existing pipeline and is undoable', () => {
    // Build initial pipeline
    createNode('customInput');
    createNode('llm');
    expect(getState().nodes).toHaveLength(2);

    // Import a different pipeline
    const newPipeline = JSON.stringify({
      nodes: [
        { id: 'x1', type: 'email', position: { x: 0, y: 0 }, data: {} },
        { id: 'x2', type: 'notification', position: { x: 200, y: 0 }, data: {} },
      ],
      edges: [{ id: 'x1->x2', source: 'x1', target: 'x2' }],
    });
    getState().importPipeline(newPipeline);

    expect(getState().nodes).toHaveLength(2);
    expect(getState().nodes[0].type).toBe('email');

    // Undo import → back to original
    getState().undo();
    expect(getState().nodes).toHaveLength(2);
    expect(getState().nodes[0].type).toBe('customInput');
  });
});

// ── Grouping Connected Nodes ──────────────────────────────────

describe('E2E: grouping nodes in a pipeline', () => {
  it('groups connected nodes and preserves their connections', () => {
    const a = createNode('customInput', 100, 100);
    const b = createNode('llm', 300, 100);
    const c = createNode('customOutput', 500, 100);
    connect(a, b);
    connect(b, c);

    // Group b and c
    setState({ selectedNodes: [b, c] });
    getState().groupSelectedNodes();

    // Group node + 3 regular nodes
    expect(getState().nodes).toHaveLength(4);
    const groupNode = getState().nodes.find((n) => n.type === 'group');
    expect(groupNode).toBeDefined();
    expect(groupNode.data.childNodeIds).toEqual([b, c]);

    // Children have parentNode set
    const bNode = getState().nodes.find((n) => n.id === b);
    const cNode = getState().nodes.find((n) => n.id === c);
    expect(bNode.parentNode).toBe(groupNode.id);
    expect(cNode.parentNode).toBe(groupNode.id);

    // Edges are still intact
    expect(getState().edges).toHaveLength(2);
  });

  it('ungroups and restores original positions', () => {
    const a = createNode('customInput', 100, 100);
    const b = createNode('llm', 300, 200);
    connect(a, b);

    setState({ selectedNodes: [a, b] });
    getState().groupSelectedNodes();

    const groupId = getState().nodes[0].id;
    getState().ungroupNode(groupId);

    // Group node removed
    expect(getState().nodes.find((n) => n.type === 'group')).toBeUndefined();
    expect(getState().nodes).toHaveLength(2);

    // Positions restored to original values
    const aNode = getState().nodes.find((n) => n.id === a);
    const bNode = getState().nodes.find((n) => n.id === b);
    expect(aNode.position.x).toBe(100);
    expect(aNode.position.y).toBe(100);
    expect(bNode.position.x).toBe(300);
    expect(bNode.position.y).toBe(200);

    // No parentNode references remain
    expect(aNode.parentNode).toBeUndefined();
    expect(bNode.parentNode).toBeUndefined();

    // Edge preserved
    expect(getState().edges).toHaveLength(1);
  });
});

// ── Complex Multi-Operation Workflows ─────────────────────────

describe('E2E: complex multi-operation workflows', () => {
  it('build → configure → duplicate → delete original → verify duplicate works', () => {
    // Build a small pipeline
    const a = createNode('customInput', 0, 0);
    const b = createNode('llm', 200, 0);
    connect(a, b);

    // Configure fields
    getState().updateNodeField(a, 'inputName', 'my_input');
    getState().updateNodeField(b, 'model', 'gpt-3.5-turbo');

    // Duplicate both
    setState({ selectedNodes: [a, b] });
    getState().duplicateSelectedNodes();

    expect(getState().nodes).toHaveLength(4);
    expect(getState().edges).toHaveLength(2);

    // Delete the originals
    setState({ selectedNodes: [a, b] });
    getState().deleteSelectedNodes();

    expect(getState().nodes).toHaveLength(2);
    expect(getState().edges).toHaveLength(1);

    // Duplicated nodes have the configured data
    const dupInput = getState().nodes.find((n) => n.type === 'customInput');
    const dupLlm = getState().nodes.find((n) => n.type === 'llm');
    expect(dupInput.data.inputName).toBe('my_input');
    expect(dupLlm.data.model).toBe('gpt-3.5-turbo');

    // They are connected
    const edge = getState().edges[0];
    expect(edge.source).toBe(dupInput.id);
    expect(edge.target).toBe(dupLlm.id);
  });

  it('build pipeline → export → modify → import original → verify overwrite', () => {
    const a = createNode('customInput');
    const b = createNode('llm');
    connect(a, b);
    getState().updateNodeField(b, 'model', 'gpt-4');

    // Export the "v1" pipeline
    const v1 = getState().exportPipeline();

    // Modify the pipeline (change model)
    getState().updateNodeField(b, 'model', 'claude-3');
    const llmAfterModify = getState().nodes.find((n) => n.id === b);
    expect(llmAfterModify.data.model).toBe('claude-3');

    // Import v1 back
    getState().importPipeline(v1);
    const llmAfterImport = getState().nodes.find((n) => n.id === b);
    expect(llmAfterImport.data.model).toBe('gpt-4');
  });

  it('create all node types and verify the registry provides correct defaults', () => {
    const nodeTypes = [
      'customInput', 'customOutput', 'llm', 'text',
      'apiRequest', 'webhook', 'httpResponse', 'functionNode',
      'condition', 'delay', 'fileNode', 'database',
      'email', 'notification', 'blackbox',
    ];

    nodeTypes.forEach((type, i) => {
      createNode(type, i * 200, 0);
    });

    expect(getState().nodes).toHaveLength(15);

    // Each node should have data from its registry defaults
    const llmNode = getState().nodes.find((n) => n.type === 'llm');
    expect(llmNode.data.model).toBe('gpt-4');

    const delayNode = getState().nodes.find((n) => n.type === 'delay');
    expect(delayNode.data.duration).toBe(1000);
    expect(delayNode.data.unit).toBe('ms');

    const condNode = getState().nodes.find((n) => n.type === 'condition');
    expect(condNode.data.operator).toBe('equals');

    const apiNode = getState().nodes.find((n) => n.type === 'apiRequest');
    expect(apiNode.data.method).toBe('GET');

    const dbNode = getState().nodes.find((n) => n.type === 'database');
    expect(dbNode.data.query).toBe('SELECT * FROM');

    const emailNode = getState().nodes.find((n) => n.type === 'email');
    expect(emailNode.data.to).toBe('');

    const blackboxNode = getState().nodes.find((n) => n.type === 'blackbox');
    expect(blackboxNode.data.subPipeline).toEqual({ nodes: [], edges: [] });
  });

  it('delete middle of chain leaves endpoints disconnected', () => {
    const a = createNode('customInput');
    const b = createNode('text');
    const c = createNode('llm');
    const d = createNode('customOutput');
    connect(a, b);
    connect(b, c);
    connect(c, d);

    // Delete middle two
    setState({ selectedNodes: [b, c] });
    getState().deleteSelectedNodes();

    expect(getState().nodes).toHaveLength(2);
    expect(getState().edges).toHaveLength(0);

    // Can now reconnect directly
    connect(a, d);
    expect(getState().edges).toHaveLength(1);
  });

  it('full workflow: create → connect → group → copy group → paste → undo all', () => {
    // Create and connect
    const a = createNode('customInput', 0, 0);   // history: 1
    const b = createNode('llm', 200, 0);          // history: 2
    connect(a, b);

    // Group
    setState({ selectedNodes: [a, b] });
    getState().groupSelectedNodes();               // history: 3
    const groupId = getState().nodes[0].id;

    expect(getState().nodes).toHaveLength(3); // group + a + b

    // Copy and paste the group
    setState({ selectedNodes: [groupId] });
    getState().copySelectedNodes();
    getState().pasteNodes({ x: 0, y: 300 });      // history: 4

    expect(getState().nodes).toHaveLength(4); // original group + a + b + pasted group

    // Undo paste
    getState().undo();
    expect(getState().nodes).toHaveLength(3);

    // Undo group
    getState().undo();
    expect(getState().nodes).toHaveLength(2);
    expect(getState().nodes.find((n) => n.type === 'group')).toBeUndefined();

    // Undo add llm
    getState().undo();
    expect(getState().nodes).toHaveLength(1);

    // Undo add input
    getState().undo();
    expect(getState().nodes).toHaveLength(0);
    expect(getState().edges).toHaveLength(0);
  });
});

// ── Selection + Properties Panel ──────────────────────────────

describe('E2E: selection and properties panel integration', () => {
  it('selecting a node updates properties panel target', () => {
    const a = createNode('customInput');
    const b = createNode('llm');
    connect(a, b);

    getState().setSelectedNodes([a]);
    getState().setPropertiesPanelNode(a);
    expect(getState().propertiesPanelNodeId).toBe(a);

    // Change selection
    getState().setSelectedNodes([b]);
    getState().setPropertiesPanelNode(b);
    expect(getState().propertiesPanelNodeId).toBe(b);
  });

  it('deleting selected node clears selection', () => {
    const a = createNode('customInput');
    createNode('llm');

    setState({ selectedNodes: [a] });
    getState().deleteSelectedNodes();

    expect(getState().selectedNodes).toHaveLength(0);
    expect(getState().nodes).toHaveLength(1);
  });

  it('select all then delete removes everything', () => {
    createNode('customInput');
    createNode('llm');
    createNode('customOutput');
    connect(getState().nodes[0].id, getState().nodes[1].id);
    connect(getState().nodes[1].id, getState().nodes[2].id);

    getState().selectAllNodes();
    expect(getState().selectedNodes).toHaveLength(3);

    getState().deleteSelectedNodes();
    expect(getState().nodes).toHaveLength(0);
    expect(getState().edges).toHaveLength(0);
  });
});

// ── Edge Cases ────────────────────────────────────────────────

describe('E2E: edge cases', () => {
  it('creating many nodes generates unique IDs', () => {
    const ids = [];
    for (let i = 0; i < 20; i++) {
      ids.push(createNode('customInput'));
    }

    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(20);
  });

  it('connecting to nonexistent node still adds edge (store does not validate node existence)', () => {
    const a = createNode('customInput');
    // onConnect doesn't check if target node exists in the current implementation
    // This documents current behavior
    connect(a, 'nonexistent');
    // The edge is still added since onConnect only checks self-connection and cycles
    expect(getState().edges).toHaveLength(1);
  });

  it('empty pipeline exports valid JSON', () => {
    const json = getState().exportPipeline();
    const parsed = JSON.parse(json);
    expect(parsed.nodes).toEqual([]);
    expect(parsed.edges).toEqual([]);
    expect(parsed.viewport).toBeDefined();
  });

  it('import then export produces identical data', () => {
    const pipeline = {
      nodes: [
        { id: 'a', type: 'customInput', position: { x: 0, y: 0 }, data: { inputName: 'test' } },
        { id: 'b', type: 'llm', position: { x: 200, y: 0 }, data: { model: 'gpt-4' } },
      ],
      edges: [{ id: 'a->b', source: 'a', target: 'b' }],
      viewport: { x: 0, y: 0, zoom: 1 },
    };

    getState().importPipeline(JSON.stringify(pipeline));
    const exported = JSON.parse(getState().exportPipeline());

    expect(exported.nodes).toEqual(pipeline.nodes);
    expect(exported.edges).toEqual(pipeline.edges);
    expect(exported.viewport).toEqual(pipeline.viewport);
  });

  it('rapid create and delete does not corrupt state', () => {
    for (let i = 0; i < 10; i++) {
      const id = createNode('customInput');
      setState({ selectedNodes: [id] });
      getState().deleteSelectedNodes();
    }

    expect(getState().nodes).toHaveLength(0);
    expect(getState().edges).toHaveLength(0);
    // 10 adds + 10 deletes = 20 history entries (capped at 50)
    expect(getState().past.length).toBeLessThanOrEqual(50);
  });
});
