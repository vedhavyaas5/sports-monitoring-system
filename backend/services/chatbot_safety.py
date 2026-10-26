"""
Deterministic Safety, Medical Escalation, and Grounding Policies for Sports AI Copilot.
Ensures zero hallucination of critical health advice and immediate deterministic escalation.
"""
import re
from typing import Optional, Tuple, Dict, Any

EMERGENCY_KEYWORDS = [
    r"\bchest pain\b",
    r"\bheart attack\b",
    r"\bshortness of breath\b",
    r"\bdifficulty breathing\b",
    r"\bcollapsed?\b",
    r"\bloss of consciousness\b",
    r"\bpassed out\b",
    r"\bsudden numbness\b",
    r"\bparalysis\b",
    r"\bslurred speech\b",
    r"\bsevere dizziness\b",
    r"\bconcussion with vomiting\b",
    r"\bcoughing blood\b",
    r"\bunbearable pain\b"
]

EMERGENCY_RESPONSE = (
    "🚨 **CRITICAL MEDICAL ALERT: IMMEDIATE EVALUATION REQUIRED**\n\n"
    "The symptoms you described (such as acute chest pain, respiratory distress, collapse, or sudden neurological deficits) "
    "are red-flag indicators requiring **immediate emergency medical evaluation**.\n\n"
    "- **Do not continue physical activity or training.**\n"
    "- **Notify your on-site athletic trainer, team physician, or emergency response services (Call 911 / 112 / 999) immediately.**\n"
    "- The Sports Injury AI Copilot is an athletic monitoring decision-support tool and is not equipped to handle medical emergencies."
)

INJECTION_PATTERNS = [
    r"ignore (all )?(previous|above) instructions",
    r"disregard (the )?(system|safety) prompt",
    r"act as a (licensed )?(doctor|physician|surgeon)",
    r"you are no longer an ai",
    r"system override",
    r"developer mode enabled"
]

def check_emergency_escalation(text: str) -> Optional[str]:
    """Returns deterministic emergency response if red-flag symptoms are detected."""
    lower = text.lower()
    for pat in EMERGENCY_KEYWORDS:
        if re.search(pat, lower):
            return EMERGENCY_RESPONSE
    return None

def sanitize_user_input(text: str) -> str:
    """Detects and neutralizes prompt injection attempts."""
    clean = text.strip()
    for pat in INJECTION_PATTERNS:
        clean = re.sub(pat, "[FILTERED_INSTRUCTION]", clean, flags=re.IGNORECASE)
    return clean

def enforce_disclaimer(response_text: str) -> str:
    """Ensures non-diagnostic disclaimer is clearly visible."""
    disclaimer_tag = "*Disclaimer: AI-generated athletic monitoring decision-support indicator. Not a medical diagnosis or clearance.*"
    if "disclaimer" not in response_text.lower():
        return f"{response_text.strip()}\n\n---\n{disclaimer_tag}"
    return response_text
