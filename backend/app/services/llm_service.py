"""
LLM Service — Google Gemini
============================
Uses the Gemini REST API directly (no extra SDK needed).
Model: gemini-1.5-flash  (fast + cheap, good for clinical summaries)
"""
import httpx
from app.config import settings

GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"


async def generate(prompt: str, system: str = "", temperature: float = 0.2) -> str:
    """
    Call Gemini generateContent endpoint.
    Returns the generated text string.
    """
    model = settings.gemini_model
    url = f"{GEMINI_API_BASE}/{model}:generateContent?key={settings.gemini_api_key}"

    # Gemini has no dedicated system role — prepend as a user/model exchange
    contents = []
    if system:
        contents.append({
            "role": "user",
            "parts": [{"text": f"[System instructions]: {system}"}]
        })
        contents.append({
            "role": "model",
            "parts": [{"text": "Understood. I will follow those instructions."}]
        })

    contents.append({
        "role": "user",
        "parts": [{"text": prompt}]
    })

    payload = {
        "contents": contents,
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": 1024,
        }
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(url, json=payload)
        response.raise_for_status()
        data = response.json()

    try:
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except (KeyError, IndexError) as e:
        raise RuntimeError(f"Unexpected Gemini response format: {data}") from e


async def is_ollama_available() -> bool:
    """
    Legacy name kept for router compatibility.
    Returns True if the Gemini API key is configured.
    """
    return bool(settings.gemini_api_key)
