# DataLens — Agentic Data Visualization Platform

Upload any CSV, JSON, or Excel file. AI agents analyze the data and automatically generate the best visualizations.

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Vite + React, Recharts, Zustand, react-dropzone |
| Backend | FastAPI, LangGraph, pandas, OpenAI |
| Communication | REST (upload) + SSE (agent streaming) |

## Project Structure

```
.
├── backend/
│   ├── main.py              # FastAPI app (upload + SSE endpoints)
│   ├── agents/graph.py      # LangGraph pipeline (analyze → select_viz)
│   ├── parsers/data_parser.py  # CSV/JSON/Excel parser + data profiler
│   ├── models/schemas.py    # Pydantic models
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── App.jsx
│       ├── store.js          # Zustand state
│       ├── index.css         # Global design system
│       └── components/
│           ├── FileUpload.jsx
│           ├── AgentStream.jsx
│           ├── ChartRenderer.jsx
│           └── Dashboard.jsx
└── sample_data/
    └── iris.csv             # Test file
```

## Setup

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r requirements.txt

# Copy and fill in your OpenAI key
copy .env.example .env

uvicorn main:app --reload
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Then open http://localhost:5173

## How It Works

1. **Upload** a CSV, JSON, or Excel file
2. **FastAPI** parses it and builds a data profile (column types, stats, samples)
3. **LangGraph** runs two agents sequentially:
   - `analyze` — finds trends, correlations, anomalies
   - `select_viz` — decides which chart types to render and their axis mappings
4. **SSE stream** sends agent steps live to the browser
5. **React** renders charts dynamically from the agent's chart spec JSON