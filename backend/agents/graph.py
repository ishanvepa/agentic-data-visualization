import json
import os
from typing import AsyncGenerator

from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from typing_extensions import TypedDict


# ---------------------------------------------------------------------------
# State definition
# ---------------------------------------------------------------------------

class AgentState(TypedDict):
    data_profile: dict
    analysis: str
    chart_specs: list[dict]
    steps: list[str]


# ---------------------------------------------------------------------------
# LLM setup
# ---------------------------------------------------------------------------

def _get_llm():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not set")
    return ChatOpenAI(model="gpt-4o-mini", temperature=0, api_key=api_key)


# ---------------------------------------------------------------------------
# Node: analyze
# ---------------------------------------------------------------------------

ANALYSIS_PROMPT = """You are a data analyst. Given this data profile, write a concise analysis (3-5 sentences) highlighting:
- Key trends or patterns
- Notable correlations between numeric columns
- Any anomalies or interesting distributions
- What story the data tells

Data profile:
{profile}

Respond with plain text only. Be specific about column names and actual values."""


def analyze_node(state: AgentState) -> AgentState:
    llm = _get_llm()
    profile = state["data_profile"]

    prompt = ANALYSIS_PROMPT.format(profile=json.dumps({
        "columns": profile["column_names"],
        "dtypes": profile["dtypes"],
        "numeric_columns": profile["numeric_columns"],
        "categorical_columns": profile["categorical_columns"],
        "summary": profile["summary"],
        "value_counts": profile.get("value_counts", {}),
        "sample": profile["sample"][:5],
    }, indent=2))

    response = llm.invoke(prompt)
    analysis = response.content

    return {
        **state,
        "analysis": analysis,
        "steps": state["steps"] + [f"Analysis complete: {analysis[:120]}..."],
    }


# ---------------------------------------------------------------------------
# Node: select_viz
# ---------------------------------------------------------------------------

VIZ_PROMPT = """You are a data visualization expert. Given this data profile and analysis, recommend 2-4 charts.

For EACH chart, output a JSON object with EXACTLY these fields:
- "type": one of "bar", "line", "pie", "scatter", "area"
- "title": descriptive chart title (string)
- "description": one sentence explaining what insight this chart shows
- "x_key": the column name to use as the X axis (or null for pie)
- "y_key": the column name to use as the Y axis (or null for pie)
- "label_key": for pie charts, the column for slice labels (or null)
- "value_key": for pie charts, the column for slice values (or null)
- "data": an array of data objects using ONLY columns that exist in the profile. Use the actual sample data rows, aggregated if needed.

Rules:
- Use only column names from: {columns}
- For bar/line charts use the most meaningful x/y columns
- For pie charts, pick a categorical column (label_key) and numeric column (value_key)
- Keep data arrays to at most 20 items
- Output ONLY a valid JSON array of chart objects, no explanation text

Data profile:
{profile}

Analysis:
{analysis}"""


def select_viz_node(state: AgentState) -> AgentState:
    llm = _get_llm()
    profile = state["data_profile"]

    prompt = VIZ_PROMPT.format(
        columns=profile["column_names"],
        profile=json.dumps({
            "columns": profile["column_names"],
            "dtypes": profile["dtypes"],
            "numeric_columns": profile["numeric_columns"],
            "categorical_columns": profile["categorical_columns"],
            "summary": profile["summary"],
            "value_counts": profile.get("value_counts", {}),
            "sample": profile["sample"],
        }, indent=2),
        analysis=state["analysis"],
    )

    response = llm.invoke(prompt)
    raw = response.content.strip()

    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    chart_specs = json.loads(raw)

    return {
        **state,
        "chart_specs": chart_specs,
        "steps": state["steps"] + [f"Selected {len(chart_specs)} visualization(s)"],
    }


# ---------------------------------------------------------------------------
# Build graph
# ---------------------------------------------------------------------------

def build_graph():
    g = StateGraph(AgentState)
    g.add_node("analyze", analyze_node)
    g.add_node("select_viz", select_viz_node)
    g.set_entry_point("analyze")
    g.add_edge("analyze", "select_viz")
    g.add_edge("select_viz", END)
    return g.compile()


# ---------------------------------------------------------------------------
# Streaming runner
# ---------------------------------------------------------------------------

async def run_pipeline(data_profile: dict) -> AsyncGenerator[dict, None]:
    """
    Runs the agent pipeline and yields SSE-style event dicts.
    """
    graph = build_graph()

    yield {"type": "step", "content": f"Parsing complete — {data_profile['rows']} rows, {data_profile['columns']} columns detected."}
    yield {"type": "step", "content": f"Numeric columns: {', '.join(data_profile['numeric_columns']) or 'none'}"}
    yield {"type": "step", "content": f"Categorical columns: {', '.join(data_profile['categorical_columns']) or 'none'}"}
    yield {"type": "step", "content": "Running analysis agent..."}

    initial_state: AgentState = {
        "data_profile": data_profile,
        "analysis": "",
        "chart_specs": [],
        "steps": [],
    }

    try:
        # Stream LangGraph node outputs
        async for event in graph.astream(initial_state):
            for node_name, node_state in event.items():
                if node_name == "analyze":
                    yield {"type": "step", "content": f"🔍 {node_state.get('analysis', '')}"}
                elif node_name == "select_viz":
                    count = len(node_state.get("chart_specs", []))
                    yield {"type": "step", "content": f"📊 Selected {count} chart(s) to visualize your data."}

        # Get final state
        final = await graph.ainvoke(initial_state)
        yield {"type": "charts", "content": final["chart_specs"]}
        yield {"type": "done", "content": None}

    except Exception as e:
        yield {"type": "error", "content": str(e)}
        yield {"type": "done", "content": None}
