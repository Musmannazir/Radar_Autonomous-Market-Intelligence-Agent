from contextlib import nullcontext

from main import build_app


def build_graph():
    """Return the compiled graph and a no-op checkpoint context manager."""
    app_graph, checkpointer_cm = build_app()
    return app_graph, checkpointer_cm
