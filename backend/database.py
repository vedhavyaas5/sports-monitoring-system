"""
Production-ready SQLite Database Layer for Sports Injury Monitoring System.
Provides thread-safe connections, automatic schema initialization, indexing,
and relational persistence for all system entities.
"""
import sqlite3
import json
import time
import uuid
import os
import threading
from typing import List, Dict, Any, Optional

DB_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sports_monitoring.db")
_local = threading.local()

def get_db():
    if not hasattr(_local, "conn") or _local.conn is None:
        _local.conn = sqlite3.connect(DB_FILE, timeout=30.0, check_same_thread=False)
        _local.conn.row_factory = sqlite3.Row
        _local.conn.execute("PRAGMA journal_mode = WAL;")
        _local.conn.execute("PRAGMA synchronous = NORMAL;")
        _local.conn.execute("PRAGMA foreign_keys = ON;")
    return _local.conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # 1. Users Table (Role-based auth)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'ATHLETE', -- ADMIN, COACH, ATHLETE, RESEARCHER, PHYSICIAN
        athlete_id TEXT,
        name TEXT,
        created_at REAL NOT NULL
    );
    """)
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN name TEXT;")
    except Exception:
        pass

    # 2. Athletes Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS athletes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        age INTEGER,
        position TEXT,
        sport TEXT DEFAULT 'Football',
        status TEXT DEFAULT 'active',
        current_risk REAL DEFAULT 0.0,
        current_fatigue REAL DEFAULT 0.0,
        current_load REAL DEFAULT 0.0,
        baseline_metrics TEXT,
        created_at REAL NOT NULL,
        updated_at REAL NOT NULL
    );
    """)

    # 3. Sessions Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        athlete_id TEXT NOT NULL,
        type TEXT DEFAULT 'Training',
        start_time REAL NOT NULL,
        end_time REAL,
        duration_min REAL DEFAULT 0.0,
        peak_risk REAL DEFAULT 0.0,
        avg_risk REAL DEFAULT 0.0,
        peak_hr REAL DEFAULT 0.0,
        alerts_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
    );
    """)

    # 4. Telemetry / Measurements Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS measurements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        athlete_id TEXT NOT NULL,
        timestamp REAL NOT NULL,
        data_json TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );
    """)

    # 5. Self Assessments Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS self_assessments (
        id TEXT PRIMARY KEY,
        athlete_id TEXT NOT NULL,
        session_id TEXT,
        timestamp REAL NOT NULL,
        pain_level INTEGER NOT NULL,
        pain_locations TEXT,
        fatigue_level INTEGER NOT NULL,
        symptoms TEXT,
        training_intensity INTEGER,
        training_duration_min INTEGER,
        previous_injury INTEGER DEFAULT 0,
        raw_description TEXT,
        extracted_symptoms TEXT,
        overall_risk_score REAL,
        status_label TEXT,
        FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
    );
    """)

    # 6. MRI Records Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS mri_records (
        id TEXT PRIMARY KEY,
        athlete_id TEXT NOT NULL,
        session_id TEXT,
        timestamp REAL NOT NULL,
        filename TEXT NOT NULL,
        grade INTEGER NOT NULL,
        severity TEXT NOT NULL,
        confidence REAL NOT NULL,
        injury_score REAL NOT NULL,
        radiological_features TEXT,
        recommendation TEXT,
        disclaimer TEXT,
        FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
    );
    """)

    # 7. Risk Predictions / History Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS risk_predictions (
        id TEXT PRIMARY KEY,
        athlete_id TEXT NOT NULL,
        session_id TEXT,
        timestamp REAL NOT NULL,
        overall_risk REAL NOT NULL,
        movement_risk REAL,
        sensor_risk REAL,
        self_assessment_risk REAL,
        mri_risk REAL,
        level TEXT NOT NULL,
        trend TEXT NOT NULL,
        contributing_indicators TEXT,
        model_versions TEXT,
        FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
    );
    """)

    # 8. Alerts Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        athlete_id TEXT NOT NULL,
        session_id TEXT,
        timestamp REAL NOT NULL,
        alert_type TEXT,
        severity TEXT NOT NULL, -- INFO, WARNING, HIGH PRIORITY
        reason TEXT NOT NULL,
        related_features TEXT,
        acknowledged INTEGER DEFAULT 0,
        resolved INTEGER DEFAULT 0,
        FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
    );
    """)

    # 9. Model Registry / Versions Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS model_versions (
        id TEXT PRIMARY KEY,
        model_name TEXT NOT NULL,
        version TEXT NOT NULL,
        algorithm TEXT NOT NULL,
        dataset_id TEXT,
        metrics TEXT,
        training_date REAL,
        status TEXT DEFAULT 'active'
    );
    """)

    # Create Indexes for fast querying
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sessions_athlete ON sessions(athlete_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_measurements_session ON measurements(session_id, timestamp);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_assessments_athlete ON self_assessments(athlete_id, timestamp);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_mri_athlete ON mri_records(athlete_id, timestamp);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_risk_athlete ON risk_predictions(athlete_id, timestamp);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_alerts_athlete ON alerts(athlete_id, timestamp);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_alerts_ack ON alerts(acknowledged, severity);")

    conn.commit()

    # Seed default athletes if empty
    cursor.execute("SELECT COUNT(*) FROM athletes")
    if cursor.fetchone()[0] == 0:
        now = time.time()
        seed_athletes = [
            ("07", "Marcus Vance", 24, "Forward", "Football", "active", 0.28, 0.35, 240.0),
            ("12", "Elena Rostova", 22, "Midfielder", "Football", "active", 0.68, 0.72, 380.0),
            ("19", "David Chen", 27, "Defender", "Basketball", "resting", 0.18, 0.20, 110.0),
            ("03", "Sarah Jenkins", 25, "Goalkeeper", "Football", "active", 0.42, 0.45, 290.0),
            ("21", "Mateo Silva", 23, "Winger", "Rugby", "resting", 0.15, 0.18, 95.0),
        ]
        for num, name, age, pos, sport, status, r, f, l in seed_athletes:
            cursor.execute("""
            INSERT INTO athletes (id, name, age, position, sport, status, current_risk, current_fatigue, current_load, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (num, name, age, pos, sport, status, r, f, l, now, now))
        conn.commit()

init_db()
