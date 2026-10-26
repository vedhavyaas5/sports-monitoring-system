"""
SQLite-backed persistent data store for athletes, sessions, measurements,
predictions, self-assessments, MRI records, and alerts.
Maintains full backward compatibility while offering rich temporal queries.
"""
import time
import uuid
import json
from typing import Dict, List, Optional, Any
from backend.database import get_db

# ── Athletes ───────────────────────────────────────────────────────────────────
def get_all_athletes() -> List[dict]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM athletes ORDER BY id ASC")
    rows = cursor.fetchall()
    res = []
    for r in rows:
        d = dict(r)
        # get sessions list
        c2 = conn.cursor()
        c2.execute("SELECT id FROM sessions WHERE athlete_id = ?", (d["id"],))
        d["sessions"] = [s[0] for s in c2.fetchall()]
        if d.get("baseline_metrics"):
            try:
                d["baseline_metrics"] = json.loads(d["baseline_metrics"])
            except Exception:
                pass
        res.append(d)
    return res

def get_athlete(athlete_id: str) -> Optional[dict]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM athletes WHERE id = ?", (athlete_id,))
    row = cursor.fetchone()
    if not row:
        return None
    d = dict(row)
    c2 = conn.cursor()
    c2.execute("SELECT id FROM sessions WHERE athlete_id = ?", (athlete_id,))
    d["sessions"] = [s[0] for s in c2.fetchall()]
    if d.get("baseline_metrics"):
        try:
            d["baseline_metrics"] = json.loads(d["baseline_metrics"])
        except Exception:
            pass
    return d

def update_athlete_risk(athlete_id: str, risk: float, fatigue: float, load: float):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE athletes 
    SET current_risk = ?, current_fatigue = ?, current_load = ?, updated_at = ?
    WHERE id = ?
    """, (round(risk, 4), round(fatigue, 4), round(load, 4), time.time(), athlete_id))
    conn.commit()

def update_athlete_baseline(athlete_id: str, baseline_dict: dict):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE athletes 
    SET baseline_metrics = ?, updated_at = ?
    WHERE id = ?
    """, (json.dumps(baseline_dict), time.time(), athlete_id))
    conn.commit()

# ── Sessions ───────────────────────────────────────────────────────────────────
def create_session(athlete_id: str, session_type: str = "Training") -> dict:
    sid = str(uuid.uuid4())[:8]
    now = time.time()
    session = {
        "id": sid,
        "athlete_id": athlete_id,
        "type": session_type,
        "start_time": now,
        "end_time": None,
        "duration_min": 0.0,
        "peak_risk": 0.0,
        "avg_risk": 0.0,
        "peak_hr": 0.0,
        "alerts_count": 0,
        "status": "active",
    }
    conn = get_db()
    cursor = conn.cursor()
    # Check athlete exists
    cursor.execute("SELECT id FROM athletes WHERE id = ?", (athlete_id,))
    if not cursor.fetchone():
        cursor.execute("INSERT INTO athletes (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)",
                       (athlete_id, f"Athlete {athlete_id}", now, now))
    cursor.execute("""
    INSERT INTO sessions (id, athlete_id, type, start_time, duration_min, peak_risk, avg_risk, peak_hr, alerts_count, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (sid, athlete_id, session_type, now, 0.0, 0.0, 0.0, 0.0, 0, "active"))
    conn.commit()
    return session

def get_sessions(athlete_id: Optional[str] = None) -> List[dict]:
    conn = get_db()
    cursor = conn.cursor()
    if athlete_id:
        cursor.execute("SELECT * FROM sessions WHERE athlete_id = ? ORDER BY start_time DESC", (athlete_id,))
    else:
        cursor.execute("SELECT * FROM sessions ORDER BY start_time DESC")
    return [dict(r) for r in cursor.fetchall()]

def get_session(session_id: str) -> Optional[dict]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
    r = cursor.fetchone()
    return dict(r) if r else None

# ── Measurements ──────────────────────────────────────────────────────────────
def add_measurement(session_id: str, measurement: dict):
    conn = get_db()
    cursor = conn.cursor()
    athlete_id = measurement.get("athlete_id", "07")
    ts = measurement.get("timestamp", time.time())
    
    cursor.execute("""
    INSERT INTO measurements (session_id, athlete_id, timestamp, data_json)
    VALUES (?, ?, ?, ?)
    """, (session_id, athlete_id, ts, json.dumps(measurement)))
    
    # Update session metrics
    cursor.execute("SELECT data_json FROM measurements WHERE session_id = ?", (session_id,))
    rows = cursor.fetchall()
    risks = []
    hrs = []
    for row in rows:
        try:
            m = json.loads(row[0])
            if "overall_risk" in m: risks.append(m["overall_risk"])
            if "heart_rate_bpm" in m and m["heart_rate_bpm"]: hrs.append(m["heart_rate_bpm"])
        except Exception:
            pass
            
    cursor.execute("SELECT start_time FROM sessions WHERE id = ?", (session_id,))
    s_row = cursor.fetchone()
    start_t = s_row[0] if s_row else ts
    dur_min = round((time.time() - start_t) / 60, 1)
    peak_r = round(max(risks), 4) if risks else 0.0
    avg_r = round(sum(risks) / len(risks), 4) if risks else 0.0
    peak_h = round(max(hrs), 1) if hrs else 0.0
    
    cursor.execute("""
    UPDATE sessions 
    SET duration_min = ?, peak_risk = ?, avg_risk = ?, peak_hr = ?
    WHERE id = ?
    """, (dur_min, peak_r, avg_r, peak_h, session_id))
    conn.commit()

def get_measurements(session_id: str, last_n: int = 100) -> List[dict]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT data_json FROM measurements 
    WHERE session_id = ? 
    ORDER BY timestamp DESC 
    LIMIT ?
    """, (session_id, last_n))
    rows = cursor.fetchall()
    res = []
    for r in reversed(rows):
        try:
            res.append(json.loads(r[0]))
        except Exception:
            pass
    return res

# ── Alerts ─────────────────────────────────────────────────────────────────────
def add_alert(alert: dict) -> dict:
    aid = alert.get("id") or str(uuid.uuid4())[:8]
    alert["id"] = aid
    ts = alert.get("timestamp") or time.time()
    alert["timestamp"] = ts
    alert["acknowledged"] = alert.get("acknowledged", False)
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO alerts (id, athlete_id, session_id, timestamp, alert_type, severity, reason, related_features, acknowledged, resolved)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        aid,
        alert.get("athlete_id", "07"),
        alert.get("session_id"),
        ts,
        alert.get("type", "RISK_ALERT"),
        alert.get("level", alert.get("severity", "WARNING")),
        "; ".join(alert.get("reasons", [alert.get("reason", "Elevated indicators")])),
        json.dumps(alert.get("related_features", {})),
        1 if alert.get("acknowledged") else 0,
        0
    ))
    # Increment alert count on session
    if alert.get("session_id"):
        cursor.execute("UPDATE sessions SET alerts_count = alerts_count + 1 WHERE id = ?", (alert["session_id"],))
    conn.commit()
    return alert

def get_alerts(athlete_id: Optional[str] = None, level: Optional[str] = None, last_n: int = 50) -> List[dict]:
    conn = get_db()
    cursor = conn.cursor()
    query = "SELECT * FROM alerts"
    params = []
    conds = []
    if athlete_id:
        conds.append("athlete_id = ?")
        params.append(athlete_id)
    if level and level.upper() != "ALL":
        conds.append("UPPER(severity) = ?")
        params.append(level.upper())
    if conds:
        query += " WHERE " + " AND ".join(conds)
    query += " ORDER BY timestamp DESC LIMIT ?"
    params.append(last_n)
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    res = []
    for r in rows:
        d = dict(r)
        d["reasons"] = d["reason"].split("; ") if d.get("reason") else []
        d["level"] = d["severity"]
        d["acknowledged"] = bool(d["acknowledged"])
        d["resolved"] = bool(d["resolved"])
        res.append(d)
    return res

def acknowledge_alert(alert_id: str) -> bool:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE alerts SET acknowledged = 1 WHERE id = ?", (alert_id,))
    conn.commit()
    return cursor.rowcount > 0

def resolve_alert(alert_id: str) -> bool:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE alerts SET resolved = 1, acknowledged = 1 WHERE id = ?", (alert_id,))
    conn.commit()
    return cursor.rowcount > 0

# ── Risk History ──────────────────────────────────────────────────────────────
def push_risk_history(entry: dict):
    rid = str(uuid.uuid4())[:8]
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO risk_predictions (id, athlete_id, session_id, timestamp, overall_risk, movement_risk, sensor_risk, self_assessment_risk, mri_risk, level, trend, contributing_indicators, model_versions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        rid,
        entry.get("athlete_id", "07"),
        entry.get("session_id"),
        entry.get("timestamp", time.time()),
        entry.get("overall_risk", 0.0),
        entry.get("movement_risk", 0.0),
        entry.get("sensor_risk", 0.0),
        entry.get("self_assessment_risk", 0.0),
        entry.get("mri_risk", 0.0),
        entry.get("level", "LOW"),
        entry.get("trend", "STABLE"),
        json.dumps(entry.get("contributing_indicators", [])),
        json.dumps(entry.get("model_versions", {}))
    ))
    conn.commit()

def get_risk_history(last_n: int = 60, athlete_id: Optional[str] = None) -> List[dict]:
    conn = get_db()
    cursor = conn.cursor()
    if athlete_id:
        cursor.execute("SELECT * FROM risk_predictions WHERE athlete_id = ? ORDER BY timestamp DESC LIMIT ?", (athlete_id, last_n))
    else:
        cursor.execute("SELECT * FROM risk_predictions ORDER BY timestamp DESC LIMIT ?", (last_n,))
    rows = cursor.fetchall()
    res = []
    for r in reversed(rows):
        d = dict(r)
        if d.get("contributing_indicators"):
            try: d["contributing_indicators"] = json.loads(d["contributing_indicators"])
            except: pass
        res.append(d)
    return res

# ── Self-Assessments ──────────────────────────────────────────────────────────
def save_self_assessment(data: dict) -> str:
    aid = str(uuid.uuid4())[:8]
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO self_assessments (id, athlete_id, session_id, timestamp, pain_level, pain_locations, fatigue_level, symptoms, training_intensity, training_duration_min, previous_injury, raw_description, extracted_symptoms, overall_risk_score, status_label)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        aid,
        data.get("athlete_id", "07"),
        data.get("session_id"),
        data.get("timestamp", time.time()),
        data.get("pain_level", 0),
        json.dumps(data.get("pain_locations", [])),
        data.get("fatigue_level", 0),
        json.dumps(data.get("symptoms", [])),
        data.get("training_intensity", 3),
        data.get("training_duration_min", 60),
        1 if data.get("previous_injury") else 0,
        data.get("description") or data.get("raw_description", ""),
        json.dumps(data.get("extracted_symptoms", {})),
        data.get("overall_risk_score", 0.0),
        data.get("status_label", "Low Risk Indicators")
    ))
    conn.commit()
    return aid

def get_self_assessments(athlete_id: Optional[str] = None, limit: int = 30) -> List[dict]:
    conn = get_db()
    cursor = conn.cursor()
    if athlete_id:
        cursor.execute("SELECT * FROM self_assessments WHERE athlete_id = ? ORDER BY timestamp DESC LIMIT ?", (athlete_id, limit))
    else:
        cursor.execute("SELECT * FROM self_assessments ORDER BY timestamp DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    res = []
    for r in rows:
        d = dict(r)
        for field in ["pain_locations", "symptoms", "extracted_symptoms"]:
            if d.get(field):
                try: d[field] = json.loads(d[field])
                except: pass
        res.append(d)
    return res

# ── MRI Records ───────────────────────────────────────────────────────────────
def save_mri_record(data: dict) -> str:
    mid = str(uuid.uuid4())[:8]
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO mri_records (id, athlete_id, session_id, timestamp, filename, grade, severity, confidence, injury_score, radiological_features, recommendation, disclaimer)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        mid,
        data.get("athlete_id", "07"),
        data.get("session_id"),
        data.get("timestamp", time.time()),
        data.get("filename", "upload.jpg"),
        data.get("grade", 0),
        data.get("severity", "No Injury"),
        data.get("confidence", 0.9),
        data.get("injury_score", 0.1),
        json.dumps(data.get("radiological_features", {})),
        data.get("recommendation", "Continue regular monitoring protocol."),
        data.get("disclaimer", "AI-based research analysis only, not medical diagnosis.")
    ))
    conn.commit()
    return mid

def get_mri_records(athlete_id: Optional[str] = None, limit: int = 20) -> List[dict]:
    conn = get_db()
    cursor = conn.cursor()
    if athlete_id:
        cursor.execute("SELECT * FROM mri_records WHERE athlete_id = ? ORDER BY timestamp DESC LIMIT ?", (athlete_id, limit))
    else:
        cursor.execute("SELECT * FROM mri_records ORDER BY timestamp DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    res = []
    for r in rows:
        d = dict(r)
        if d.get("radiological_features"):
            try: d["radiological_features"] = json.loads(d["radiological_features"])
            except: pass
        res.append(d)
    return res


# ── User & Athlete Management ──────────────────────────────────────────────────
def create_athlete(data: dict) -> dict:
    conn = get_db()
    cursor = conn.cursor()
    athlete_id = str(data.get("id") or "").strip()
    if not athlete_id:
        cursor.execute("SELECT id FROM athletes")
        existing_ids = [r[0] for r in cursor.fetchall()]
        num_candidates = [int(i) for i in existing_ids if i.isdigit()]
        next_num = max(num_candidates) + 1 if num_candidates else 1
        athlete_id = f"{next_num:02d}"

    now = time.time()
    name = data.get("name", f"Athlete {athlete_id}")
    age = int(data.get("age", 22))
    position = data.get("position", "Forward")
    sport = data.get("sport", "Football")
    status = data.get("status", "active")
    risk = float(data.get("current_risk", 0.15))
    fatigue = float(data.get("current_fatigue", 0.20))
    load = float(data.get("current_load", 120.0))
    baseline = data.get("baseline_metrics")
    baseline_str = json.dumps(baseline) if isinstance(baseline, dict) else (baseline or None)

    cursor.execute("""
    INSERT INTO athletes (id, name, age, position, sport, status, current_risk, current_fatigue, current_load, baseline_metrics, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (athlete_id, name, age, position, sport, status, risk, fatigue, load, baseline_str, now, now))
    conn.commit()

    # Automatically initialize baseline session
    create_session(athlete_id, session_type="Baseline Calibration")
    return get_athlete(athlete_id)

def delete_athlete(athlete_id: str) -> bool:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM athletes WHERE id = ?", (athlete_id,))
    cursor.execute("DELETE FROM users WHERE athlete_id = ?", (athlete_id,))
    cursor.execute("DELETE FROM sessions WHERE athlete_id = ?", (athlete_id,))
    cursor.execute("DELETE FROM self_assessments WHERE athlete_id = ?", (athlete_id,))
    cursor.execute("DELETE FROM mri_records WHERE athlete_id = ?", (athlete_id,))
    cursor.execute("DELETE FROM alerts WHERE athlete_id = ?", (athlete_id,))
    cursor.execute("DELETE FROM risk_predictions WHERE athlete_id = ?", (athlete_id,))
    conn.commit()
    return True

def get_all_users() -> List[dict]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, name, role, athlete_id, created_at FROM users ORDER BY created_at ASC")
    rows = cursor.fetchall()
    return [dict(r) for r in rows]
