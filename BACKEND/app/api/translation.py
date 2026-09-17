from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.models.domain import User, TranslationHistory
from app.schemas.domain import TranslationRequest, TranslationResponse
from app.auth.dependencies import get_current_user
from app.rag.retrieval import retrieve_context
from app.llm.ollama_client import generate_translation
from app.utils.document_parser import extract_text_from_file

router = APIRouter()

@router.post("/translate", response_model=TranslationResponse)
async def translate_text(
    request: TranslationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text to translate cannot be empty")
        
    # 1. Retrieve context using RAG
    # We formulate a query combining the languages and the text
    rag_query = f"Translation rules from {request.source_language} to {request.target_language} regarding: {request.text}"
    context = await retrieve_context(rag_query, db)
    
    # 2. Generate translation using LLM
    try:
        translated_text = await generate_translation(
            source_lang=request.source_language,
            target_lang=request.target_language,
            text=request.text,
            context=context
        )
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))
        
    # 3. Save to history
    new_translation = TranslationHistory(
        user_id=current_user.id,
        source_language=request.source_language,
        target_language=request.target_language,
        source_text=request.text,
        translated_text=translated_text
    )
    db.add(new_translation)
    db.commit()
    db.refresh(new_translation)
    
    return new_translation

@router.post("/translate/document", response_model=TranslationResponse)
async def translate_document(
    file: UploadFile = File(...),
    source_language: str = Form(...),
    target_language: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    supported_extensions = ['.pdf', '.docx', '.txt']
    if not any(file.filename.lower().endswith(ext) for ext in supported_extensions):
        raise HTTPException(status_code=400, detail="Only .pdf, .docx, and .txt files are supported")
        
    try:
        file_bytes = await file.read()
        extracted_text = extract_text_from_file(file_bytes, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract any text from the document")
        
    # We formulate a query combining the languages and the text
    rag_query = f"Translation rules from {source_language} to {target_language} regarding: {extracted_text[:200]}"
    context = await retrieve_context(rag_query, db)
    
    # Generate translation using LLM
    try:
        translated_text = await generate_translation(
            source_lang=source_language,
            target_lang=target_language,
            text=extracted_text,
            context=context
        )
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))
        
    # Save to history
    new_translation = TranslationHistory(
        user_id=current_user.id,
        source_language=source_language,
        target_language=target_language,
        source_text=extracted_text,
        translated_text=translated_text
    )
    db.add(new_translation)
    db.commit()
    db.refresh(new_translation)
    
    return new_translation

@router.get("/translations", response_model=List[TranslationResponse])
def get_translations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    translations = db.query(TranslationHistory).filter(TranslationHistory.user_id == current_user.id).order_by(TranslationHistory.created_at.desc()).all()
    return translations

@router.get("/translations/{id}", response_model=TranslationResponse)
def get_translation(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    translation = db.query(TranslationHistory).filter(
        TranslationHistory.id == id,
        TranslationHistory.user_id == current_user.id
    ).first()
    if not translation:
        raise HTTPException(status_code=404, detail="Translation not found")
    return translation

@router.delete("/translations/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_translation(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    translation = db.query(TranslationHistory).filter(
        TranslationHistory.id == id,
        TranslationHistory.user_id == current_user.id
    ).first()
    if not translation:
        raise HTTPException(status_code=404, detail="Translation not found")
    
    db.delete(translation)
    db.commit()
    return None
