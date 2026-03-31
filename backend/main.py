import asyncio
import json
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

load_dotenv()

from agents.graph import run_pipeline
from parsers.data_parser import parse_file

# In-memory store: task_id -> data_profile
_task_store: dict[str, dict] = {}

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(title="Agentic Data Visualization API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Accepts a data file, parses it, stores the profile,
    and returns a task_id for the SSE stream.
    """
    allowed = {".csv", ".json", ".xlsx", ".xls"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

    file_bytes = await file.read()

    try:
        profile = parse_file(file_bytes, file.filename)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    task_id = profile["task_id"]
    _task_store[task_id] = profile

    return {
        "task_id": task_id,
        "filename": profile["filename"],
        "rows": profile["rows"],
        "columns": profile["columns"],
    }


async def _sse_generator(task_id: str) -> AsyncGenerator[str, None]:
    """Format events as SSE text/event-stream."""
    profile = _task_store.get(task_id)
    if profile is None:
        yield f"data: {json.dumps({'type': 'error', 'content': 'Task not found'})}\n\n"
        return

    async for event in run_pipeline(profile):
        yield f"data: {json.dumps(event)}\n\n"
        await asyncio.sleep(0.05)  # small delay for smoother streaming


@app.get("/stream/{task_id}")
async def stream(task_id: str):
    """
    SSE endpoint. Client connects here after uploading to receive
    live agent steps and final chart specs.
    """
    return StreamingResponse(
        _sse_generator(task_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
