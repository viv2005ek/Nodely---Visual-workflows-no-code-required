# ⚙️ Nodely Backend

The robust, high-performance API that powers **Nodely** pipeline validation and execution. Built with FastAPI for speed, security, and developer productivity.

## 🚀 Getting Started

### Prerequisites
- Python (v3.9 or higher)
- pip
- Virtual environment tool (venv)

### Installation
1. Create a virtual environment:
   ```bash
   python -m venv .venv
   ```

2. Activate the virtual environment:
   - **Windows**: `.venv\Scripts\activate`
   - **macOS/Linux**: `source .venv/bin/activate`

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the server:
   ```bash
   uvicorn main:app --reload
   ```
   *The API will be available at [http://localhost:8000](http://localhost:8000).*

## 📡 API Endpoints

### `GET /`
- **Description**: Health check and versioning.
- **Response**: `{"status": "healthy", "version": "1.1.0"}`

### `POST /pipelines/parse`
- **Description**: Analyzes a pipeline structure (nodes and edges).
- **Security**: Rate limited (10 requests/minute).
- **Core Logic**:
  - Validates node and edge counts to prevent resource exhaustion.
  - Implements an iterative **Kahn’s Algorithm** (topological sort) for cycle detection (is it a DAG?).
  - Returns a summary of the pipeline's structure.
- **Payload**:
  ```json
  {
    "nodes": [...],
    "edges": [...]
  }
  ```

## 🛠️ Security & Scaling

- **Rate Limiting**: Integrated **Slowapi** to mitigate DDoS and brute-force attacks.
- **CORS-Hardened**: Strict origin checks to ensure only the trusted frontend can communicate with the API.
- **Pydantic Validation**: Strict schema enforcement for all incoming pipeline data.
- **Memory Efficient**: Using iterative graph algorithms to handle complex pipelines without recursive depth errors.

---
Built by [Viv2005ek](https://github.com/viv2005ek)
