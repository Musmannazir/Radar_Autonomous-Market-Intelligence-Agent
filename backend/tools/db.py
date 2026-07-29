import sqlite3
from config import DB_PATH
import os

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

def add_watchlist_item(topic: str):
    conn = get_connection()
    cur = conn.execute("INSERT INTO watchlist (topic) VALUES (?)", (topic,))
    conn.commit()
    item_id = cur.lastrowid
    conn.close()
    return item_id

def create_run(run_id: str, item_id: int):
    conn = get_connection()
    conn.execute("INSERT INTO runs (id, item_id) VALUES (?, ?)", (run_id, item_id))
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()