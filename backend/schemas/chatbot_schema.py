"""
Pydantic Schemas for Sports Injury AI Copilot (PHASE 17).
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ChatMessageRequest(BaseModel):
    conversation_id: Optional[str] = Field(None, description="Optional conversation UUID to resume multi-turn context.")
    athlete_id: str = Field(..., description="Target athlete ID (e.g. '07', '12').")
    message: str = Field(..., description="User prompt or natural language inquiry.")

class SourceReference(BaseModel):
    type: str = Field(..., description="Record type: risk_prediction, sensor, movement, mri, assessment, alert.")
    record_id: Optional[str] = Field(None, description="Internal record or measurement identifier.")
    summary: Optional[str] = Field(None, description="Brief explanation of data origin.")

class ChatMessageResponse(BaseModel):
    conversation_id: str
    response: str
    athlete_id: str
    sources: List[SourceReference] = []
    used_tools: List[str] = []
    medical_disclaimer: bool = True
    timestamp: float

class ConversationSummary(BaseModel):
    id: str
    user_id: str
    athlete_id: str
    title: str
    created_at: float
    updated_at: float
    message_count: int = 0

class ChatMessageItem(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    timestamp: float
    tool_metadata_json: Optional[str] = None

class ConversationDetail(BaseModel):
    id: str
    user_id: str
    athlete_id: str
    title: str
    created_at: float
    updated_at: float
    messages: List[ChatMessageItem] = []

class ChatSuggestion(BaseModel):
    category: str
    prompt: str
    description: str

class ChatHealthResponse(BaseModel):
    status: str
    gemini_model: str
    api_configured: bool
    total_conversations: int
    available_tools: List[str]
    disclaimer: str
