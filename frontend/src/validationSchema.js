import { z } from 'zod';

// Schema for node position
const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

// Schema for node data (flexible but requires basics)
const NodeDataSchema = z.object({
  id: z.string().optional(),
  nodeType: z.string().optional(),
}).passthrough();

// Schema for a single node
const NodeSchema = z.object({
  id: z.string(),
  type: z.string().optional(),
  position: PositionSchema,
  data: NodeDataSchema,
  width: z.number().optional(),
  height: z.number().optional(),
  parentNode: z.string().optional(),
  extent: z.string().optional(),
}).passthrough();

// Schema for a single edge
const EdgeSchema = z.object({
  id: z.string().optional(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
}).passthrough();

// Main Pipeline Schema
export const PipelineSchema = z.object({
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
  viewport: z.object({
    x: z.number(),
    y: z.number(),
    zoom: z.number(),
  }).optional(),
});
