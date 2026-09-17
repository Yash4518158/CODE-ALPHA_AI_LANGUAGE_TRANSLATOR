# AI Language Translator

A complete, professional full-stack AI Language Translation tool powered by local LLMs (Ollama) and RAG.

## Features
- **Local AI Translation:** Uses Ollama (`qwen2.5:0.5b` or `llama3.2:1b`) to generate high-quality translations completely locally.
- **Retrieval-Augmented Generation (RAG):** Uses `pgvector` to store and retrieve language rules and context, feeding it to the LLM to improve translation accuracy.
- **Full-Stack Architecture:** Built with React + Vite on the frontend and FastAPI + Python on the backend.
- **Secure Authentication:** JWT-based stateless authentication with hashed passwords (bcrypt).
- **Persistent History:** Saves user translation history in PostgreSQL.
- **Premium UI:** A dynamic, responsive, glassmorphism-inspired dark mode interface.

## Technology Stack
- **Frontend:** React, TypeScript, Vite, React Router, Axios, Lucide React, Vanilla CSS.
- **Backend:** FastAPI, Python 3.12, SQLAlchemy, Pydantic, Passlib, JWT.
- **Database:** PostgreSQL with `pgvector` extension.
- **AI/LLM:** Ollama (Local docker container).
- **Infrastructure:** Docker Compose.

## Prerequisites
- Docker Desktop
- Docker Compose
- At least 8-16GB RAM for running local LLMs and PostgreSQL

## Setup & Running

1. **Environment Setup**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. **Start the Application**
   Run the following command to build and start the entire stack:
   ```bash
   docker compose up --build
   ```

3. **Initialize Ollama Models**
   The first time you start the application, you need to pull the required models inside the Ollama container.
   Open a new terminal and run:
   ```bash
   docker exec -it <ollama_container_id> ollama pull qwen2.5:0.5b
   docker exec -it <ollama_container_id> ollama pull nomic-embed-text
   ```

4. **Access the App**
   - Frontend Dashboard: `http://localhost:5173`
   - Backend API Docs (Swagger): `http://localhost:8000/docs`

## Screenshots Placeholder
*(Add your screenshots here)*
- Login Page
- Translation Dashboard
- History Sidebar

## Future Improvements
- Implement streaming responses for LLM generation.
- Add an admin dashboard to curate the RAG knowledge base.
- Add audio pronunciation (TTS) for translated text.
