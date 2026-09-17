from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# --- Auth Schemas ---
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True

# --- Translation Schemas ---
class TranslationRequest(BaseModel):
    source_language: str
    target_language: str
    text: str

class TranslationResponse(BaseModel):
    id: int
    source_language: str
    target_language: str
    source_text: str
    translated_text: str
    created_at: datetime

    class Config:
        from_attributes = True
