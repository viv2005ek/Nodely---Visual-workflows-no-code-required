import React, { lazy, Suspense } from 'react';

// Node components
import { InputNode } from './inputNode';
import { OutputNode } from './outputNode';
import { LLMNode } from './llmNode';
import { TextNode } from './textNode';
import { ApiRequestNode } from './apiRequestNode';
import { WebhookNode } from './webhookNode';
import { HttpResponseNode } from './httpResponseNode';
import { FunctionNode } from './functionNode';
import { ConditionNode } from './conditionNode';
import { DelayNode } from './delayNode';
import { FileNode } from './fileNode';
import { BlackboxNode } from './blackboxNode';
import { StickyNoteNode } from './stickyNoteNode';
import { GroupNode } from './groupNode';

// Icons (Lucide React)
import {
  Download,
  Upload,
  Cpu,
  FileText,
  Globe,
  Signal,
  CornerUpLeft,
  Code,
  GitBranch,
  Clock,
  Folder,
  Database,
  Mail,
  Bell,
  Box,
  MessageSquare,
  LayoutDashboard,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Lazy loading helpers
// ---------------------------------------------------------------------------

const withSuspense = (LazyComp) => (props) => (
  <Suspense fallback={
    <div className="p-3 bg-card border border-panel-border rounded-xl text-xs text-muted shadow-sm animate-pulse min-w-[240px] flex items-center justify-center">
      Loading...
    </div>
  }>
    <LazyComp {...props} />
  </Suspense>
);

// Lazy load non-critical integration nodes
const DatabaseNode = withSuspense(lazy(() => import('./databaseNode').then(m => ({ default: m.DatabaseNode }))));
const EmailNode = withSuspense(lazy(() => import('./emailNode').then(m => ({ default: m.EmailNode }))));
const NotificationNode = withSuspense(lazy(() => import('./notificationNode').then(m => ({ default: m.NotificationNode }))));

// ---------------------------------------------------------------------------
// Category definitions
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { key: 'input-output', label: 'Input / Output' },
  { key: 'processing', label: 'Processing' },
  { key: 'control', label: 'Control Flow' },
  { key: 'integration', label: 'Integrations' },
  { key: 'utility', label: 'Utilities' },
];

// ---------------------------------------------------------------------------
// Node Registry
// ---------------------------------------------------------------------------

export const NODE_REGISTRY = {
  customInput: {
    component: InputNode,
    label: 'Input',
    icon: Download,
    color: '#22c55e',
    category: 'input-output',
    description: 'Receive input data',
    defaultData: { inputName: '', inputType: 'Text' },
  },
  customOutput: {
    component: OutputNode,
    label: 'Output',
    icon: Upload,
    color: '#ef4444',
    category: 'input-output',
    description: 'Send output data',
    defaultData: { outputName: '', outputType: 'Text' },
  },
  llm: {
    component: LLMNode,
    label: 'LLM',
    icon: Cpu,
    color: '#8b5cf6',
    category: 'processing',
    description: 'Large Language Model',
    defaultData: { model: 'gpt-4', temperature: 0.7 },
  },
  text: {
    component: TextNode,
    label: 'Text',
    icon: FileText,
    color: '#6b7280',
    category: 'utility',
    description: 'Static text with variables',
    defaultData: { text: '{{input}}' },
  },
  apiRequest: {
    component: ApiRequestNode,
    label: 'API Request',
    icon: Globe,
    color: '#3b82f6',
    category: 'integration',
    description: 'Make HTTP requests',
    defaultData: { method: 'GET', url: '', headers: '', body: '' },
  },
  webhook: {
    component: WebhookNode,
    label: 'Webhook',
    icon: Signal,
    color: '#f97316',
    category: 'integration',
    description: 'Listen for webhooks',
    defaultData: { path: '/webhook', method: 'POST' },
  },
  httpResponse: {
    component: HttpResponseNode,
    label: 'HTTP Response',
    icon: CornerUpLeft,
    color: '#14b8a6',
    category: 'integration',
    description: 'Send HTTP response',
    defaultData: { statusCode: 200, contentType: 'application/json', body: '' },
  },
  functionNode: {
    component: FunctionNode,
    label: 'Function',
    icon: Code,
    color: '#eab308',
    category: 'processing',
    description: 'Run JavaScript code',
    defaultData: { code: '// Write your code here\nreturn input;' },
  },
  condition: {
    component: ConditionNode,
    label: 'Condition',
    icon: GitBranch,
    color: '#f59e0b',
    category: 'control',
    description: 'If/else branching',
    defaultData: { field: '', operator: 'equals', value: '' },
  },
  delay: {
    component: DelayNode,
    label: 'Delay',
    icon: Clock,
    color: '#64748b',
    category: 'control',
    description: 'Wait before proceeding',
    defaultData: { duration: 1000, unit: 'ms' },
  },
  fileNode: {
    component: FileNode,
    label: 'File',
    icon: Folder,
    color: '#84cc16',
    category: 'utility',
    description: 'Read/write files',
    defaultData: { operation: 'read', path: '' },
  },
  database: {
    component: DatabaseNode,
    label: 'Database Query',
    icon: Database,
    color: '#06b6d4',
    category: 'integration',
    description: 'Query a database',
    defaultData: { query: 'SELECT * FROM', connection: '' },
  },
  email: {
    component: EmailNode,
    label: 'Email',
    icon: Mail,
    color: '#ec4899',
    category: 'integration',
    description: 'Send email',
    defaultData: { to: '', subject: '', body: '' },
  },
  notification: {
    component: NotificationNode,
    label: 'Notification',
    icon: Bell,
    color: '#a855f7',
    category: 'integration',
    description: 'Send notifications',
    defaultData: { channel: 'slack', message: '' },
  },
  blackbox: {
    component: BlackboxNode,
    label: 'Blackbox',
    icon: Box,
    color: '#1e293b',
    category: 'processing',
    description: 'Nested sub-pipeline',
    defaultData: { subPipeline: { nodes: [], edges: [] } },
  },
  stickyNote: {
    component: StickyNoteNode,
    label: 'Sticky Note',
    icon: MessageSquare,
    color: '#fbbf24',
    category: 'utility',
    description: 'Add notes to canvas',
    defaultData: {},
  },
  group: {
    component: GroupNode,
    label: 'Group',
    icon: LayoutDashboard,
    color: '#6366f1',
    category: 'utility',
    description: 'Group nodes together',
    defaultData: {},
  },
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

export const getNodeTypes = () => {
  return Object.entries(NODE_REGISTRY).reduce((acc, [key, { component }]) => {
    acc[key] = component;
    return acc;
  }, {});
};

export const getNodeCategories = () => {
  return CATEGORIES.map(({ key, label }) => ({
    key,
    label,
    nodes: Object.entries(NODE_REGISTRY)
      .filter(([, meta]) => meta.category === key)
      .map(([type, meta]) => ({
        type,
        label: meta.label,
        icon: meta.icon,
        color: meta.color,
        description: meta.description,
      })),
  }));
};

export const getNodeDefaults = (type) => {
  const entry = NODE_REGISTRY[type];
  if (!entry) return {};
  return JSON.parse(JSON.stringify(entry.defaultData));
};
