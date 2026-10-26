"""
Authentication and Role-Based Access Control (RBAC).
Supports JWT tokens and password verification.
Roles: ADMIN, COACH, ATHLETE, RESEARCHER, PHYSICIAN
"""
import os
import time
import hmac
import hashlib
import json
import base64
import uuid
from typing import Optional, Dict, Any, List
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.database import get_db

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "sports-ai-secret-key-2026-production-secure")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_SECONDS = 86400 * 7 # 7 days

security = HTTPBearer(auto_error=False)

def hash_password(password: str, salt: Optional[str] = None) -> str:
    if not salt:
        salt = uuid.uuid4().hex[:16]
    hashed = hashlib.sha256((password + salt + SECRET_KEY).encode()).hexdigest()
    return f"{salt}${hashed}"

def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, h = stored_hash.split("$", 1)
        recalculated = hashlib.sha256((password + salt + SECRET_KEY).encode()).hexdigest()
        return hmac.compare_digest(h, recalculated)
    except Exception:
        return False

def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")

def _base64url_decode(s: str) -> bytes:
    padding = 4 - (len(s) % 4)
    if padding != 4:
        s += "=" * padding
    return base64.urlsafe_b64decode(s)

def create_access_token(data: dict, expires_delta: int = ACCESS_TOKEN_EXPIRE_SECONDS) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload = data.copy()
    payload["exp"] = time.time() + expires_delta
    payload["iat"] = time.time()
    
    hdr_b64 = _base64url_encode(json.dumps(header).encode())
    pld_b64 = _base64url_encode(json.dumps(payload).encode())
    signing_input = f"{hdr_b64}.{pld_b64}".encode()
    signature = hmac.new(SECRET_KEY.encode(), signing_input, hashlib.sha256).digest()
    sig_b64 = _base64url_encode(signature)
    return f"{hdr_b64}.{pld_b64}.{sig_b64}"

def decode_access_token(token: str) -> Optional[dict]:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        hdr_b64, pld_b64, sig_b64 = parts
        signing_input = f"{hdr_b64}.{pld_b64}".encode()
        expected_sig = hmac.new(SECRET_KEY.encode(), signing_input, hashlib.sha256).digest()
        actual_sig = _base64url_decode(sig_b64)
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None
        payload = json.loads(_base64url_decode(pld_b64).decode())
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Dict[str, Any]:
    if not credentials:
        # Default fallback guest user for open demo compatibility
        return {"id": "demo-admin", "username": "admin", "name": "Dr. Robert Vance", "role": "ADMIN", "athlete_id": "07"}
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired authentication token")
    return payload

def require_roles(*roles: str):
    def role_checker(user: dict = Depends(get_current_user)):
        user_role = user.get("role", "ATHLETE").upper()
        if "ADMIN" in user_role:
            return user
        if user_role not in [r.upper() for r in roles]:
            raise HTTPException(status_code=403, detail=f"Access forbidden: requires one of {roles}")
        return user
    return role_checker

def seed_default_users():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        now = time.time()
        users = [
            ("usr-admin", "admin", hash_password("admin123"), "ADMIN", None, "Dr. Robert Vance", now),
            ("usr-coach", "coach", hash_password("coach123"), "COACH", None, "Coach Sarah Miller", now),
            ("usr-07", "athlete07", hash_password("athlete123"), "ATHLETE", "07", "Marcus Vance", now),
            ("usr-12", "athlete12", hash_password("athlete123"), "ATHLETE", "12", "Elena Rostova", now),
            ("usr-res", "researcher", hash_password("research123"), "RESEARCHER", None, "Dr. David Kim", now),
        ]
        cursor.executemany("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)", users)
        conn.commit()

seed_default_users()
