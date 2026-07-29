CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT NOT NULL,
    active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS runs (
    id TEXT PRIMARY KEY,           -- run_id, e.g. uuid
    item_id INTEGER,
    status TEXT DEFAULT 'running', -- running | paused | completed | failed
    started_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    FOREIGN KEY (item_id) REFERENCES watchlist(id)
);

CREATE TABLE IF NOT EXISTS findings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    claim TEXT NOT NULL,
    source_url TEXT NOT NULL,
    confidence REAL,
    is_new INTEGER DEFAULT 1,
    FOREIGN KEY (run_id) REFERENCES runs(id)
);

CREATE TABLE IF NOT EXISTS briefings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    content TEXT NOT NULL,
    sent_at TEXT,
    FOREIGN KEY (run_id) REFERENCES runs(id)
);