from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import collections

# Rate limiting setup
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Pipeline Builder API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Hardening: Allow only designated frontend origins
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # Add production domain here
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["POST", "OPTIONS"],  # Restrict to necessary methods
    allow_headers=["Content-Type", "Authorization"],
)

# --- Pydantic Data Models ---

class Node(BaseModel):
    id: str
    type: Optional[str] = None
    position: Optional[dict] = None
    data: Optional[dict] = None

class Edge(BaseModel):
    id: Optional[str] = None
    source: str
    target: str

class Pipeline(BaseModel):
    nodes: List[Node]
    edges: List[Edge]

    @validator('nodes')
    def validate_node_count(cls, v):
        if len(v) > 500:
            raise ValueError('Pipeline exceeds maximum allowed nodes (500)')
        return v

    @validator('edges')
    def validate_edge_count(cls, v):
        if len(v) > 2000:
            raise ValueError('Pipeline exceeds maximum allowed edges (2000)')
        return v

# --- Security & Core Logic ---

def is_dag(nodes: List[Node], edges: List[Edge]) -> bool:
    """
    Kahn's Algorithm - Iterative Topological Sort to detect cycles.
    Prevents RecursionError on deep/complex graphs.
    """
    all_node_ids = {node.id for node in nodes}
    
    # Track in-degrees and adjacency
    adj = collections.defaultdict(list)
    in_degree = {nid: 0 for nid in all_node_ids}
    
    for edge in edges:
        # Ignore edges pointing to/from non-existent nodes (sanity check)
        if edge.source in all_node_ids and edge.target in all_node_ids:
            adj[edge.source].append(edge.target)
            in_degree[edge.target] += 1

    # Queue for nodes with 0 in-degree
    queue = collections.deque([nid for nid in all_node_ids if in_degree[nid] == 0])
    count = 0
    
    while queue:
        u = queue.popleft()
        count += 1
        for v in adj[u]:
            in_degree[v] -= 1
            if in_degree[v] == 0:
                queue.append(v)
                
    return count == len(all_node_ids)

@app.get('/')
def read_root():
    return {'status': 'healthy', 'version': '1.1.0'}

@app.post('/pipelines/parse')
@limiter.limit("10/minute")
async def parse_pipeline(request: Request, pipeline: Pipeline):
    """
    Analyzes pipeline structure. Limited to 10 requests per minute per IP.
    """
    # Check total payload size approx (redundant but safe)
    body = await request.body()
    if len(body) > 1 * 1024 * 1024:  # 1 MB limit
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Payload too large (> 1MB)"
        )

    num_nodes = len(pipeline.nodes)
    num_edges = len(pipeline.edges)
    dag = is_dag(pipeline.nodes, pipeline.edges)

    return {
        'num_nodes': num_nodes,
        'num_edges': num_edges,
        'is_dag': dag,
    }

