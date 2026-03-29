# ⚡ Nodely — Visual Workflows, No-Code Required

**Nodely** is a high-performance, modern visual workflow builder that allows users to design, validate, and execute complex automation pipelines without writing a single line of code. Built with a focus on developer experience and enterprise-grade security.

## ✨ Key Features

- 🏗️ **Intuitive Node-Based Canvas**: Drag-and-drop interface powered by **React Flow** for seamless pipeline construction.
- 🧩 **Extensible Node Library**: A rich set of pre-built nodes including:
  - **Inputs/Outputs**: File, Text, JSON, and more.
  - **Logic & Control**: Conditional branching, loops, and delays.
  - **Integrations**: REST API requests, Database connectors, and Webhooks.
  - **Transformations**: JavaScript snippets, text formatting, and data mapping.
- 🛡️ **Advanced Security & Validation**:
  - **DAG Validation**: Real-time cycle detection to ensure pipeline integrity.
  - **Schema Enforcement**: Zod-based validation for all node configurations.
  - **Rate Limiting**: Backend protection using Slowapi.
- 🎨 **Premium UI/UX**:
  - Fully responsive design with **TailwindCSS**.
  - Smooth micro-animations powered by **Framer Motion**.
  - Modern aesthetic with glassmorphism and curated color palettes.
- 🚀 **Production-Ready Backend**: A high-performance **FastAPI** backend for handling pipeline submissions and execution.

## 🛠️ Tech Stack

### Frontend
- **React 18**: Core library for building the UI.
- **React Flow**: Powerful node-based graph editor.
- **Zustand**: Lightweight, scalable state management.
- **TailwindCSS**: Utility-first styling for a premium look.
- **Framer Motion**: Smooth transitions and interactive elements.
- **Lucide React**: Clean and consistent iconography.
- **Zod**: Robust client-side data validation.

### Backend
- **Python / FastAPI**: High-performance asynchronous API framework.
- **Pydantic**: Data validation and settings management.
- **Slowapi**: Rate limiting and security middleware.
- **Uvicorn**: Lightning-fast ASGI server.

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- Python (v3.9+)

### 1. Clone the Repository
```bash
git clone https://github.com/viv2005ek/Nodely.git
```

### 2. Backend Setup
```bash
cd backend
python -m venv .venv
# On Windows
.venv\Scripts\activate
# On macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload
```
The backend will be running at `http://localhost:8000`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```
The application will be available at `http://localhost:3000`.

## 📁 Project Structure

```text
├── backend/
│   ├── main.py            # FastAPI application logic
│   ├── requirements.txt   # Backend dependencies
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── nodes/         # Individual node implementations
│   │   ├── components/    # Reusable UI components
│   │   ├── store.js       # Zustand global state (React Flow integration)
│   │   ├── ui.js          # Core canvas logic
│   │   └── App.js         # Main entry point
│   ├── package.json       # Frontend dependencies
│   └── ...
└── demo.json              # Sample pipeline configuration
```

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
Built with ❤️ by [Viv2005ek](https://github.com/viv2005ek)
