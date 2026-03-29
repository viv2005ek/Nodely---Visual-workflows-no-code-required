# 🎨 Nodely Frontend

The visual core of **Nodely**, a modern no-code workflow builder. Built with React and React Flow, this frontend provides a seamless, high-performance canvas for building complexity with simplicity.

## 🚀 Getting Started

### Prerequisites
- Node.js (v16.x or higher)
- npm (v7.x or higher)

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```
   *The app will be available at [http://localhost:3000](http://localhost:3000).*

### Build
To create a production-ready bundle:
```bash
npm run build
```

## 🛠️ Architecture

- **React Flow**: Manages the node-based graph. All node types are custom-built to support complex interactions.
- **Zustand State Management**: A centralized store (`src/store.js`) manages nodes, edges, and pipeline metadata globally, ensuring high performance even with large graphs.
- **TailwindCSS**: Provides the design tokens for the premium dark-themed (or glassmorphic) UI.
- **Framer Motion**: Adds micro-animations to node interactions and sidebar transitions.
- **Zod**: Used for runtime validation of pipeline configurations before submission.

## 📂 Structure

- `src/nodes/`: Custom node implementations (API, Database, Logic, etc.).
- `src/components/`: Shared UI components (Toolbar, Context Menu, Modals).
- `src/ui.js`: Main React Flow canvas setup and event handlers.
- `src/store.js`: Global state for nodes and edges.
- `src/submit.js`: Logic for sending the DAG to the backend for validation.

## 🛡️ Security

- Sanitize all text inputs.
- Credentials in nodes are masked by default.
- Real-time DAG validation prevents circular dependencies before they reach the server.

---
Built by [Viv2005ek](https://github.com/viv2005ek)
