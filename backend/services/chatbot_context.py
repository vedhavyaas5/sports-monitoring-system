"""
Context Assembly, Role-Based Access Validation, and Token Guard for Sports AI Copilot.
"""
from typing import Dict, Any, List, Optional
from fastapi import HTTPException
from backend.services.chatbot_memory import get_messages

MAX_HISTORY_MESSAGES = 10

def validate_athlete_access(user: Dict[str, Any], requested_athlete_id: str) -> bool:
    """Enforces role-based authorization for athlete records."""
    user_role = (user.get("role") or "ATHLETE").upper()
    # Admins, coaches, physicians, researchers can inspect any athlete in the squad
    if any(r in user_role for r in ["ADMIN", "COACH", "PHYSICIAN", "DOCTOR", "RESEARCHER"]):
        return True
    
    # Athlete accounts can only access their own profile
    user_ath = user.get("athlete_id")
    if user_ath and str(user_ath) == str(requested_athlete_id):
        return True
    
    # Guest / open demo mode compatibility
    if user.get("id") == "demo-admin":
        return True

    return False

def build_gemini_contents(conversation_id: Optional[str], new_user_message: str) -> List[Dict[str, Any]]:
    """Builds conversation history turns for Gemini SDK while enforcing max token window."""
    contents = []
    if conversation_id:
        history = get_messages(conversation_id, limit=MAX_HISTORY_MESSAGES)
        for msg in history:
            role = "user" if msg["role"] == "user" else "model"
            contents.append({
                "role": role,
                "parts": [{"text": msg["content"]}]
            })
    
    # Append the latest message
    contents.append({
        "role": "user",
        "parts": [{"text": new_user_message}]
    })
    return contents
