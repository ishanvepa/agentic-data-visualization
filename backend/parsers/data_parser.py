import io
import json
import uuid
from pathlib import Path

import pandas as pd


def parse_file(file_bytes: bytes, filename: str) -> dict:
    """
    Parses an uploaded file into a data profile dict.
    Supports: CSV, JSON, XLSX/XLS
    """
    ext = Path(filename).suffix.lower()

    if ext == ".csv":
        df = pd.read_csv(io.BytesIO(file_bytes))
    elif ext in (".xlsx", ".xls"):
        df = pd.read_excel(io.BytesIO(file_bytes))
    elif ext == ".json":
        raw = json.loads(file_bytes.decode("utf-8"))
        # Handle both array-of-objects and object-of-arrays
        if isinstance(raw, list):
            df = pd.DataFrame(raw)
        elif isinstance(raw, dict):
            df = pd.DataFrame(raw)
        else:
            raise ValueError("JSON must be an array of objects or an object of arrays.")
    else:
        raise ValueError(f"Unsupported file type: {ext}. Supported: .csv, .json, .xlsx, .xls")

    # Build a clean profile
    profile = {
        "task_id": str(uuid.uuid4()),
        "filename": filename,
        "rows": len(df),
        "columns": len(df.columns),
        "column_names": df.columns.tolist(),
        "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
        "sample": df.head(10).fillna("").to_dict(orient="records"),
        "numeric_columns": df.select_dtypes(include="number").columns.tolist(),
        "categorical_columns": df.select_dtypes(include=["object", "category", "bool"]).columns.tolist(),
        "summary": {},
    }

    # Numeric summary stats
    if profile["numeric_columns"]:
        desc = df[profile["numeric_columns"]].describe().round(4)
        profile["summary"] = desc.to_dict()

    # Value counts for categoricals (top 10)
    profile["value_counts"] = {}
    for col in profile["categorical_columns"][:5]:  # limit to 5 cols
        profile["value_counts"][col] = df[col].value_counts().head(10).to_dict()

    return profile
