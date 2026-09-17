import os
import httpx
from fastapi import HTTPException, status

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:0.5b")
OLLAMA_EMBEDDING_MODEL = os.getenv("OLLAMA_EMBEDDING_MODEL", "nomic-embed-text")

async def generate_embedding(text: str) -> list[float]:
    """Generates embeddings using Ollama."""
    url = f"{OLLAMA_BASE_URL}/api/embeddings"
    payload = {
        "model": OLLAMA_EMBEDDING_MODEL,
        "prompt": text
    }
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            return data.get("embedding", [])
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Ollama embedding service unavailable: {str(e)}"
        )

async def generate_translation(source_lang: str, target_lang: str, text: str, context: str) -> str:
    """Generates a translation using the specified Ollama LLM, incorporating RAG context."""
    url = f"{OLLAMA_BASE_URL}/api/generate"
    
    system_prompt = (
        f"You are a professional translator. Translate the given text from {source_lang} to {target_lang}. "
        "Return ONLY the translated text without any explanation, greetings, or markdown blocks unless it is part of the translation itself. "
        "Use the following additional context if relevant to improve accuracy or cultural tone:\n"
        f"CONTEXT:\n{context}\n"
    )
    
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": text,
        "system": system_prompt,
        "stream": False
    }
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            return data.get("response", "").strip()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Ollama translation service unavailable: {str(e)}"
        )
