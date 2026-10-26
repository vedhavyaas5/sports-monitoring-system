"""
Server-Sent Events (SSE) Streaming Generator for Sports AI Copilot.
"""
import json
import asyncio
from typing import AsyncGenerator, Dict, Any
from backend.services.gemini_service import execute_copilot_chat

async def stream_copilot_response(
    athlete_id: str,
    message: str,
    conversation_id: str,
    history: list
) -> AsyncGenerator[str, None]:
    """Generates SSE event stream chunks for real-time frontend streaming."""
    # Execute the copilot chat round (with tool calling)
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        execute_copilot_chat,
        athlete_id,
        message,
        conversation_id,
        history
    )

    full_text = result.get("response", "")
    words = full_text.split(" ")

    # Stream in word chunks for fluid real-time delivery
    chunk_size = 4
    for i in range(0, len(words), chunk_size):
        chunk = " ".join(words[i:i + chunk_size]) + " "
        payload = {
            "chunk": chunk,
            "done": False,
            "conversation_id": conversation_id
        }
        yield f"data: {json.dumps(payload)}\n\n"
        await asyncio.sleep(0.04)

    # Final completion packet
    final_payload = {
        "chunk": "",
        "done": True,
        "conversation_id": conversation_id,
        "sources": result.get("sources", []),
        "used_tools": result.get("used_tools", []),
        "medical_disclaimer": True,
        "timestamp": result.get("timestamp")
    }
    yield f"data: {json.dumps(final_payload)}\n\n"
