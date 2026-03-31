from pydantic import BaseModel
from typing import Any, Literal


class UploadResponse(BaseModel):
    task_id: str
    filename: str
    rows: int
    columns: int


class ChartSpec(BaseModel):
    type: Literal["bar", "line", "pie", "scatter", "area"]
    title: str
    description: str
    x_key: str | None = None
    y_key: str | None = None
    # For pie charts: the label key and value key
    label_key: str | None = None
    value_key: str | None = None
    data: list[dict[str, Any]]


class AgentStep(BaseModel):
    type: Literal["step", "charts", "error", "done"]
    content: str | list[ChartSpec] | None = None
