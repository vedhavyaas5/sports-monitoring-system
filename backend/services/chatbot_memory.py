"""
Persistent SQLite Conversation Memory & Tool Audit for Sports Injury AI Copilot.
Enforces user ownership, conversation scoping, message history, and audit logging.
"""
import sqlite3
import json
import time
import uuid
from typing import List, Dict, Any, Optional
from backend.database import get_db

def init_chat_tables():
    conn = get_db()
    cursor = conn.cursor()

    # 1. Chat Conversations
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        athlete_id TEXT NOT NULL,
        title TEXT NOT NULL,
        created_at REAL NOT NULL,
        updated_at REAL NOT NULL
    );
    """)

    # 2. Chat Messages
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL, -- 'user', 'model', 'system'
        content TEXT NOT NULL,
        timestamp REAL NOT NULL,
        tool_metadata_json TEXT,
        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
    );
    """)

    # 3. Chat Tool Audit
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_tool_audit (
        id TEXT PRIMARY KEY,
        conversation_id TEXT,
        tool_name TEXT NOT NULL,
        execution_status TEXT NOT NULL, -- 'SUCCESS', 'ERROR', 'DENIED'
        execution_time_ms REAL NOT NULL,
        timestamp REAL NOT NULL
    );
    """)

    # Indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_conversations(user_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_chat_athlete ON chat_conversations(athlete_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_chat_msg_conv ON chat_messages(conversation_id, timestamp);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_chat_audit_conv ON chat_tool_audit(conversation_id);")
    conn.commit()

init_chat_tables()

def create_conversation(user_id: str, athlete_id: str, title: Optional[str] = None) -> dict:
    conn = get_db()
    cursor = conn.cursor()
    conv_id = f"conv-{str(uuid.uuid4())[:8]}"
    now = time.time()
    t = title or f"Monitoring Session ({athlete_id})"
    cursor.execute("""
    INSERT INTO chat_conversations (id, user_id, athlete_id, title, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (conv_id, user_id, athlete_id, t, now, now))
    conn.commit()
    return {
        "id": conv_id,
        "user_id": user_id,
        "athlete_id": athlete_id,
        "title": t,
        "created_at": now,
        "updated_at": now,
        "message_count": 0,
    }

def get_conversation(conv_id: str, user_id: Optional[str] = None) -> Optional[dict]:
    conn = get_db()
    cursor = conn.cursor()
    if user_id:
        cursor.execute("SELECT * FROM chat_conversations WHERE id = ? AND user_id = ?", (conv_id, user_id))
    else:
        cursor.execute("SELECT * FROM chat_conversations WHERE id = ?", (conv_id,))
    row = cursor.fetchone()
    if not row:
        return None
    conv = dict(row)
    cursor.execute("SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY timestamp ASC", (conv_id,))
    msgs = [dict(m) for m in cursor.fetchall()]
    conv["messages"] = msgs
    conv["message_count"] = len(msgs)
    return conv

def list_conversations(user_id: str, athlete_id: Optional[str] = None) -> List[dict]:
    conn = get_db()
    cursor = conn.cursor()
    if athlete_id:
        cursor.execute("""
        SELECT c.*, (SELECT COUNT(*) FROM chat_messages m WHERE m.conversation_id = c.id) as message_count
        FROM chat_conversations c
        WHERE c.user_id = ? AND c.athlete_id = ?
        ORDER BY c.updated_at DESC
        """, (user_id, athlete_id))
    else:
        cursor.execute("""
        SELECT c.*, (SELECT COUNT(*) FROM chat_messages m WHERE m.conversation_id = c.id) as message_count
        FROM chat_conversations c
        WHERE c.user_id = ?
        ORDER BY c.updated_at DESC
        """, (user_id,))
    rows = cursor.fetchall()
    return [dict(r) for r in rows]

def delete_conversation(conv_id: str, user_id: Optional[str] = None) -> bool:
    conn = get_db()
    cursor = conn.cursor()
    if user_id:
        cursor.execute("DELETE FROM chat_conversations WHERE id = ? AND user_id = ?", (conv_id, user_id))
    else:
        cursor.execute("DELETE FROM chat_conversations WHERE id = ?", (conv_id,))
    conv_deleted = cursor.rowcount > 0
    cursor.execute("DELETE FROM chat_messages WHERE conversation_id = ?", (conv_id,))
    cursor.execute("DELETE FROM chat_tool_audit WHERE conversation_id = ?", (conv_id,))
    conn.commit()
    return conv_deleted

def add_message(conv_id: str, role: str, content: str, tool_metadata: Optional[Any] = None) -> dict:
    conn = get_db()
    cursor = conn.cursor()
    msg_id = f"msg-{str(uuid.uuid4())[:8]}"
    now = time.time()
    meta_json = json.dumps(tool_metadata) if tool_metadata else None

    cursor.execute("""
    INSERT INTO chat_messages (id, conversation_id, role, content, timestamp, tool_metadata_json)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (msg_id, conv_id, role, content, now, meta_json))

    cursor.execute("""
    UPDATE chat_conversations
    SET updated_at = ?
    WHERE id = ?
    """, (now, conv_id))
    conn.commit()

    return {
        "id": msg_id,
        "conversation_id": conv_id,
        "role": role,
        "content": content,
        "timestamp": now,
        "tool_metadata_json": meta_json,
    }

def get_messages(conv_id: str, limit: int = 20) -> List[dict]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM chat_messages
    WHERE conversation_id = ?
    ORDER BY timestamp ASC
    LIMIT ?
    """, (conv_id, limit))
    return [dict(r) for r in cursor.fetchall()]

def record_tool_audit(conv_id: Optional[str], tool_name: str, status: str, execution_time_ms: float):
    try:
        conn = get_db()
        cursor = conn.cursor()
        audit_id = f"aud-{str(uuid.uuid4())[:8]}"
        now = time.time()
        cursor.execute("""
        INSERT INTO chat_tool_audit (id, conversation_id, tool_name, execution_status, execution_time_ms, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (audit_id, conv_id or "system", tool_name, status, execution_time_ms, now))
        conn.commit()
    except Exception:
        pass

def update_conversation_title(conv_id: str, new_title: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE chat_conversations SET title = ?, updated_at = ? WHERE id = ?", (new_title, time.time(), conv_id))
    conn.commit()
