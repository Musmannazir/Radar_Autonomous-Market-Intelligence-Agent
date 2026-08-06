import sqlite3
from config import DB_PATH
import os

TERMINAL_RUN_STATUSES = {"approved", "rejected", "skipped_no_news", "send_failed", "failed"}


def _table_columns(conn: sqlite3.Connection, table_name: str) -> set[str]:
    rows = conn.execute(f"PRAGMA table_info({table_name})").fetchall()
    return {row[1] for row in rows}


def ensure_schema():
    conn = get_connection()
    watchlist_columns = _table_columns(conn, "watchlist")
    if "category" not in watchlist_columns:
        conn.execute("ALTER TABLE watchlist ADD COLUMN category TEXT")
    if "frequency" not in watchlist_columns:
        conn.execute("ALTER TABLE watchlist ADD COLUMN frequency TEXT")
    if "priority" not in watchlist_columns:
        conn.execute("ALTER TABLE watchlist ADD COLUMN priority TEXT")
    if "description" not in watchlist_columns:
        conn.execute("ALTER TABLE watchlist ADD COLUMN description TEXT")
    if "icon" not in watchlist_columns:
        conn.execute("ALTER TABLE watchlist ADD COLUMN icon TEXT")

    runs_columns = _table_columns(conn, "runs")
    if "rejection_reason" not in runs_columns:
        conn.execute("ALTER TABLE runs ADD COLUMN rejection_reason TEXT")
    conn.commit()
    conn.close()

def get_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    with open("db/schema.sql", "r") as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()
    print(f"DB initialized at {DB_PATH}")

def add_watchlist_item(
    topic: str,
    category: str | None = None,
    frequency: str | None = None,
    priority: str | None = None,
    description: str | None = None,
    icon: str | None = None,
):
    conn = get_connection()
    cur = conn.execute(
        "INSERT INTO watchlist (topic, category, frequency, priority, description, icon) VALUES (?, ?, ?, ?, ?, ?)",
        (topic, category, frequency, priority, description, icon),
    )
    conn.commit()
    item_id = cur.lastrowid
    conn.close()
    return item_id


def list_watchlists():
    conn = get_connection()
    rows = conn.execute(
        "SELECT id, topic, active, category, frequency, priority, description, icon FROM watchlist ORDER BY id DESC"
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_watchlist(item_id: int):
    conn = get_connection()
    row = conn.execute(
        "SELECT id, topic, active, category, frequency, priority, description, icon FROM watchlist WHERE id = ?",
        (item_id,),
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def set_watchlist_active(item_id: int, active: bool):
    conn = get_connection()
    conn.execute("UPDATE watchlist SET active = ? WHERE id = ?", (int(active), item_id))
    conn.commit()
    conn.close()


def delete_watchlist_item(item_id: int):
    conn = get_connection()
    conn.execute("DELETE FROM watchlist WHERE id = ?", (item_id,))
    conn.commit()
    conn.close()

def create_run(run_id: str, item_id: int):
    conn = get_connection()
    conn.execute("INSERT INTO runs (id, item_id) VALUES (?, ?)", (run_id, item_id))
    conn.commit()
    conn.close()


def update_run_status(run_id: str, status: str):
    conn = get_connection()
    if status in TERMINAL_RUN_STATUSES:
        conn.execute(
            "UPDATE runs SET status = ?, completed_at = COALESCE(completed_at, datetime('now')) WHERE id = ?",
            (status, run_id),
        )
    else:
        conn.execute("UPDATE runs SET status = ? WHERE id = ?", (status, run_id))
    conn.commit()
    conn.close()


def get_recent_briefings(limit: int = 20):
    conn = get_connection()
    columns = _table_columns(conn, "briefings")
    content_column = "content" if "content" in columns else "brief_text" if "brief_text" in columns else None
    if not content_column:
        conn.close()
        return []
    rows = conn.execute(
        f"SELECT id, run_id, {content_column} AS content, sent_at FROM briefings ORDER BY COALESCE(sent_at, datetime('now')) DESC, id DESC LIMIT ?",
        (limit,),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_briefing_detail(run_id: str):
    """Return a briefing joined with its findings and the run's watchlist topic."""
    conn = get_connection()

    # 1. Briefing row
    columns = _table_columns(conn, "briefings")
    content_column = "content" if "content" in columns else "brief_text" if "brief_text" in columns else None
    if not content_column:
        conn.close()
        return None

    briefing_row = conn.execute(
        f"SELECT id, run_id, {content_column} AS content, sent_at FROM briefings WHERE run_id = ?",
        (run_id,),
    ).fetchone()

    if not briefing_row:
        conn.close()
        return None

    briefing = dict(briefing_row)

    # 2. Findings for this run
    findings_rows = conn.execute(
        "SELECT id, run_id, claim, source_url, confidence, is_new FROM findings WHERE run_id = ? ORDER BY id",
        (run_id,),
    ).fetchall()
    briefing["findings"] = [dict(row) for row in findings_rows]

    # 3. Topic from runs -> watchlist join
    topic_row = conn.execute(
        """SELECT w.topic
           FROM runs r
           LEFT JOIN watchlist w ON w.id = r.item_id
           WHERE r.id = ?""",
        (run_id,),
    ).fetchone()
    briefing["topic"] = dict(topic_row)["topic"] if topic_row and topic_row["topic"] else ""

    conn.close()
    return briefing


def log_finding(run_id: str, claim: str, source_url: str, confidence: float | None, is_new: bool = True):
    conn = get_connection()
    conn.execute(
        "INSERT INTO findings (run_id, claim, source_url, confidence, is_new) VALUES (?, ?, ?, ?, ?)",
        (run_id, claim, source_url, confidence, int(is_new)),
    )
    conn.commit()
    conn.close()


def list_findings(limit: int = 100):
    conn = get_connection()
    rows = conn.execute(
        "SELECT id, run_id, claim, source_url, confidence, is_new FROM findings ORDER BY id DESC LIMIT ?",
        (limit,),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_database_counts():
    conn = get_connection()
    counts = {
        "watchlists": conn.execute("SELECT COUNT(*) AS value FROM watchlist").fetchone()["value"],
        "runs": conn.execute("SELECT COUNT(*) AS value FROM runs").fetchone()["value"],
        "active_runs": conn.execute("SELECT COUNT(*) AS value FROM runs WHERE status IN ('running', 'queued', 'processing_approval', 'awaiting_approval')").fetchone()["value"],
        "briefings": conn.execute("SELECT COUNT(*) AS value FROM briefings").fetchone()["value"],
        "findings": conn.execute("SELECT COUNT(*) AS value FROM findings").fetchone()["value"],
        "new_findings": conn.execute("SELECT COUNT(*) AS value FROM findings WHERE is_new = 1").fetchone()["value"],
    }
    conn.close()
    return counts


def get_run_rows(limit: int = 50):
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT
            r.id,
            r.item_id,
            r.status,
            r.started_at,
            r.completed_at,
            w.topic AS watchlist_topic,
            w.active AS watchlist_active
        FROM runs r
        LEFT JOIN watchlist w ON w.id = r.item_id
        ORDER BY COALESCE(r.started_at, r.completed_at, datetime('now')) DESC, r.id DESC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def log_briefing(run_id: str, brief_text: str, sent: bool = True):
    conn = get_connection()
    columns = _table_columns(conn, "briefings")
    content_column = "content" if "content" in columns else "brief_text" if "brief_text" in columns else None
    if not content_column:
        conn.close()
        return
    if "sent" in columns:
        conn.execute(
            f"INSERT INTO briefings (run_id, {content_column}, sent) VALUES (?, ?, ?)",
            (run_id, brief_text, int(sent)),
        )
    else:
        conn.execute(
            f"INSERT INTO briefings (run_id, {content_column}, sent_at) VALUES (?, ?, datetime('now'))",
            (run_id, brief_text),
        )
    conn.commit()
    conn.close()


def save_rejection_reason(run_id: str, reason: str):
    """Store the human feedback reason when a briefing is rejected."""
    if not reason or not reason.strip():
        return
    conn = get_connection()
    conn.execute(
        "UPDATE runs SET rejection_reason = ? WHERE id = ?",
        (reason.strip(), run_id),
    )
    conn.commit()
    conn.close()


def get_rejection_reasons_for_topic(topic: str, limit: int = 5) -> list[str]:
    """Retrieve past rejection feedback for briefings on the same topic.

    These are fed into the Writer agent prompt so it learns from past mistakes.
    """
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT r.rejection_reason
        FROM runs r
        LEFT JOIN watchlist w ON w.id = r.item_id
        WHERE w.topic = ?
          AND r.status = 'rejected'
          AND r.rejection_reason IS NOT NULL
          AND r.rejection_reason != ''
        ORDER BY r.completed_at DESC
        LIMIT ?
        """,
        (topic, limit),
    ).fetchall()
    conn.close()
    return [dict(row)["rejection_reason"] for row in rows]


if __name__ == "__main__":
    init_db()