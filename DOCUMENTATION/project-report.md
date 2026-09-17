# Project Overview: AI Language Translator

## 1. System Architecture
The application uses a modern microservices-style architecture deployed via Docker Compose:
- **Frontend Container:** Vite + React + TypeScript running on Alpine Node.
- **Backend Container:** FastAPI running on Python 3.12 slim.
- **Database Container:** PostgreSQL with the `pgvector` extension installed.
- **AI Engine Container:** Local Ollama running offline LLMs.

## 2. Folder Structure
```text
AI-Language-Translator/
│
├── FRONTEND/                # React Vite App
│   ├── src/
│   │   ├── components/
│   │   ├── context/         # AuthContext.tsx
│   │   ├── pages/           # Login, Register, Dashboard
│   │   ├── index.css        # Global styles & design system
│   │   └── api.ts           # Axios configuration with JWT interceptor
│   ├── package.json
│   └── Dockerfile
│
├── BACKEND/                 # FastAPI App
│   ├── app/
│   │   ├── api/             # auth.py, translation.py (Routes)
│   │   ├── auth/            # dependencies.py, security.py (JWT, Hashing)
│   │   ├── database/        # connection.py (SQLAlchemy)
│   │   ├── models/          # domain.py (SQLAlchemy models)
│   │   ├── schemas/         # domain.py (Pydantic schemas)
│   │   ├── rag/             # retrieval.py (Vector search logic)
│   │   ├── llm/             # ollama_client.py (Ollama API wrappers)
│   │   └── main.py          # FastAPI application entry point
│   ├── requirements.txt
│   └── Dockerfile
│
├── DOCUMENTATION/           # Project Reports & Docs
├── docker-compose.yml       # Orchestration
├── .env.example
└── README.md
```

## 3. Translation Flow & RAG Architecture
1. **Request:** The user submits a source text, source language, and target language via the React dashboard.
2. **Authentication:** The request includes a JWT. FastAPI validates the token in `dependencies.py` to ensure the user is logged in.
3. **Query Generation:** The backend constructs a semantic search query based on the translation task.
4. **Embedding Generation:** The backend calls Ollama (`nomic-embed-text`) to convert the query into a 768-dimensional vector.
5. **Retrieval:** SQLAlchemy queries PostgreSQL (`pgvector`) using the `<=>` cosine distance operator to find the most relevant language context from the `knowledge_base` table.
6. **Prompt Assembly:** The backend combines the retrieved context, system instructions, and user text.
7. **LLM Generation:** The backend sends the prompt to the Ollama Translation Model (`qwen2.5:0.5b` or `llama3.2:1b`).
8. **Storage:** The raw translation result is saved to the `translation_history` table associated with the user ID.
9. **Response:** The translation is returned to the user interface.

## 4. PostgreSQL Database Design
- **users:** Stores `id`, `username`, `email`, `hashed_password`, `created_at`.
- **translation_history:** Stores `id`, `user_id` (Foreign Key), `source_language`, `target_language`, `source_text`, `translated_text`.
- **knowledge_base:** Stores `id`, `content`, `category`, and `embedding` (Vector 768) for RAG context.

## 5. Security & Authentication
- All passwords are encrypted at rest using `bcrypt` (via `passlib`).
- Sessions are completely stateless.
- JWTs are generated upon login and required as `Bearer` tokens in the `Authorization` header for protected endpoints (`/translate`, `/translations`).

## 6. Docker & Environment Configuration
Environment variables strictly separate configuration from code. 
Key variables include:
- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET`: Secret key for signing tokens.
- `OLLAMA_BASE_URL`: Pointer to the docker-internal Ollama network (`http://ollama:11434`).

## 7. Frontend Design
The React application enforces a strict glassmorphism dark-mode aesthetic. 
- Colors are based on dynamic CSS variables (`var(--accent-gradient)`).
- Typography relies on modern fonts (Inter & Outfit).
- Interactivity is enhanced with CSS animations (`animate-fade-in`, `animate-pulse`) and Lucide React icons.

## 8. Troubleshooting
- **Ollama container fails to respond:** Ensure you have manually executed `docker exec -it <id> ollama pull <model-name>` first.
- **Database Connection Error:** The backend container waits for the postgres `healthcheck` before starting. If it fails, ensure `pgvector` image is downloading properly.
