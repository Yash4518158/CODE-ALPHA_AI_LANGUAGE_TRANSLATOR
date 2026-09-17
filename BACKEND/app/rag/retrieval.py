from sqlalchemy.orm import Session
from app.models.domain import KnowledgeBase
from app.llm.ollama_client import generate_embedding

async def retrieve_context(query: str, db: Session, limit: int = 3) -> str:
    """
    Generates an embedding for the query, retrieves the most similar knowledge base
    entries from the database, and formats them into a context string.
    """
    try:
        query_embedding = await generate_embedding(query)
        if not query_embedding:
            return ""
        
        # pgvector uses `<=>` for cosine distance. Smaller distance = more similar.
        results = db.query(KnowledgeBase).order_by(
            KnowledgeBase.embedding.cosine_distance(query_embedding)
        ).limit(limit).all()
        
        if not results:
            return ""
        
        context_parts = [f"- {item.content}" for item in results]
        return "\n".join(context_parts)
    except Exception as e:
        print(f"RAG retrieval error: {e}")
        # Fail gracefully without breaking translation if RAG fails
        return ""
