"""
FastAPI Router for Sports Injury AI Copilot (PHASE 17).
Implements message exchange, SSE streaming, conversation memory, suggestions, and health audit.
"""
import time
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse

from backend.auth import get_current_user
from backend.schemas.chatbot_schema import (
    ChatMessageRequest,
    ChatMessageResponse,
    ConversationSummary,
    ConversationDetail,
    ChatSuggestion,
    ChatHealthResponse,
    SourceReference
)
from backend.services.chatbot_safety import check_emergency_escalation, sanitize_user_input, enforce_disclaimer
from backend.services.chatbot_context import validate_athlete_access
from backend.services.chatbot_memory import (
    create_conversation,
    get_conversation,
    list_conversations,
    delete_conversation,
    add_message,
    get_messages,
    init_chat_tables
)
from backend.services.gemini_service import execute_copilot_chat
from backend.services.chatbot_streaming import stream_copilot_response
from backend.services.chatbot_tools import TOOL_FUNCTIONS
from backend.config import GEMINI_MODEL, GEMINI_API_KEY, DISCLAIMER

router = APIRouter(prefix="/api/chat", tags=["AI Copilot"])

# ── 1. Send Message (REST Endpoint) ──────────────────────────────────────────
@router.post("/message", response_model=ChatMessageResponse)
def post_chat_message(req: ChatMessageRequest, user: dict = Depends(get_current_user)):
    # 1. Authorize athlete access
    if not validate_athlete_access(user, req.athlete_id):
        raise HTTPException(status_code=403, detail=f"Access forbidden: User cannot view records for athlete #{req.athlete_id}")

    # 2. Check for conversation or create new
    conv_id = req.conversation_id
    if not conv_id:
        conv = create_conversation(
            user_id=user["id"],
            athlete_id=req.athlete_id,
            title=req.message[:35] + ("..." if len(req.message) > 35 else "")
        )
        conv_id = conv["id"]
    else:
        existing = get_conversation(conv_id, user_id=user["id"])
        if not existing:
            conv = create_conversation(user_id=user["id"], athlete_id=req.athlete_id)
            conv_id = conv["id"]

    # 3. Check for emergency medical escalation first (deterministic safety rule)
    emergency_msg = check_emergency_escalation(req.message)
    if emergency_msg:
        add_message(conv_id, "user", req.message)
        add_message(conv_id, "model", emergency_msg)
        return ChatMessageResponse(
            conversation_id=conv_id,
            response=emergency_msg,
            athlete_id=req.athlete_id,
            sources=[],
            used_tools=[],
            medical_disclaimer=True,
            timestamp=time.time()
        )

    # 4. Sanitize user prompt
    clean_message = sanitize_user_input(req.message)

    # 5. Persist user message
    add_message(conv_id, "user", clean_message)

    # 6. Retrieve history context
    history = get_messages(conv_id, limit=8)

    # 7. Execute Copilot round with Gemini function calling
    result = execute_copilot_chat(
        athlete_id=req.athlete_id,
        user_message=clean_message,
        conversation_id=conv_id,
        history_messages=history[:-1] # exclude just-added message
    )

    # 8. Persist assistant response
    add_message(conv_id, "model", result["response"], tool_metadata={"tools": result.get("used_tools", [])})

    return ChatMessageResponse(
        conversation_id=conv_id,
        response=result["response"],
        athlete_id=req.athlete_id,
        sources=[SourceReference(**s) for s in result.get("sources", [])],
        used_tools=result.get("used_tools", []),
        medical_disclaimer=True,
        timestamp=result.get("timestamp", time.time())
    )

# ── 2. Streaming Response (SSE Endpoint) ─────────────────────────────────────
@router.post("/stream")
def post_chat_stream(req: ChatMessageRequest, user: dict = Depends(get_current_user)):
    if not validate_athlete_access(user, req.athlete_id):
        raise HTTPException(status_code=403, detail="Access denied for athlete records")

    conv_id = req.conversation_id
    if not conv_id:
        conv = create_conversation(user_id=user["id"], athlete_id=req.athlete_id, title=req.message[:35])
        conv_id = conv["id"]

    # Emergency check
    emergency = check_emergency_escalation(req.message)
    if emergency:
        add_message(conv_id, "user", req.message)
        add_message(conv_id, "model", emergency)
        import json
        async def emergency_gen():
            yield f"data: {json.dumps({'chunk': emergency, 'done': True, 'conversation_id': conv_id, 'medical_disclaimer': True})}\n\n"
        return StreamingResponse(emergency_gen(), media_type="text/event-stream")

    clean_prompt = sanitize_user_input(req.message)
    add_message(conv_id, "user", clean_prompt)
    history = get_messages(conv_id, limit=8)

    return StreamingResponse(
        stream_copilot_response(
            athlete_id=req.athlete_id,
            message=clean_prompt,
            conversation_id=conv_id,
            history=history[:-1]
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

# ── 3. List Conversations ────────────────────────────────────────────────────
@router.get("/conversations", response_model=List[ConversationSummary])
def get_conversations(
    athlete_id: Optional[str] = Query(None),
    user: dict = Depends(get_current_user)
):
    convs = list_conversations(user_id=user["id"], athlete_id=athlete_id)
    return [ConversationSummary(**c) for c in convs]

# ── 4. Get Conversation Details ──────────────────────────────────────────────
@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
def get_conversation_endpoint(conversation_id: str, user: dict = Depends(get_current_user)):
    conv = get_conversation(conversation_id, user_id=user["id"])
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return ConversationDetail(**conv)

# ── 5. Delete Conversation ───────────────────────────────────────────────────
@router.delete("/conversations/{conversation_id}")
def delete_conversation_endpoint(conversation_id: str, user: dict = Depends(get_current_user)):
    success = delete_conversation(conversation_id, user_id=user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found or unauthorized")
    return {"status": "success", "message": f"Deleted conversation {conversation_id}"}

# ── 6. Suggestions Library ───────────────────────────────────────────────────
@router.get("/suggestions", response_model=List[ChatSuggestion])
def get_chat_suggestions():
    return [
        ChatSuggestion(
            category="Risk Analysis",
            prompt="What is my current overall risk score and what caused it to increase?",
            description="Explains multi-modal fused risk and contributing indicators."
        ),
        ChatSuggestion(
            category="Sensor Analytics",
            prompt="Why is my heart rate elevated and how does my training load compare with baseline?",
            description="Analyzes physiological wearable telemetry and baseline deviations."
        ),
        ChatSuggestion(
            category="Movement Biomechanics",
            prompt="Which kinematic joint angle contributed most to my movement risk score?",
            description="Examines ground reaction force, knee flexion, and postural stability."
        ),
        ChatSuggestion(
            category="MRI Radiology",
            prompt="Explain my latest MRI analysis and what the Grad-CAM attention heatmap indicates.",
            description="Explains DenseNet-121 model attention, scan dates, and tissue integrity."
        ),
        ChatSuggestion(
            category="What-If Simulation",
            prompt="What happens to my risk score if training load increases by 25% with acute fatigue?",
            description="Runs hypothetical model parameter simulation without altering real records."
        ),
        ChatSuggestion(
            category="Recovery & Readiness",
            prompt="What is my recovery readiness index for tomorrow's training session?",
            description="Evaluates autonomic balance, fatigue indices, and rest recommendations."
        ),
        ChatSuggestion(
            category="Alerts & Audit",
            prompt="Summarize all unacknowledged high-priority alerts triggered today.",
            description="Reviews active warnings, trigger thresholds, and timestamps."
        )
    ]

# ── 7. Health & Tool Audit ───────────────────────────────────────────────────
@router.get("/health", response_model=ChatHealthResponse)
def get_chat_health():
    from backend.database import get_db
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM chat_conversations")
    total_c = cursor.fetchone()[0]

    return ChatHealthResponse(
        status="ONLINE",
        gemini_model=GEMINI_MODEL,
        api_configured=bool(GEMINI_API_KEY),
        total_conversations=total_c,
        available_tools=[fn.__name__ for fn in TOOL_FUNCTIONS],
        disclaimer=DISCLAIMER
    )
