# DentalCopilot AI 🦷

> AI-powered clinical assistant for dentists and small dental clinics.

## MVP Features (Phase 0)

| Feature | Status |
|---|---|
| Patient CRUD | ✅ Ready |
| Visit History | ✅ Ready |
| Document Upload (PDF, image) | ✅ Ready |
| RAG Ingestion (ChromaDB) | ✅ Ready |
| Patient Summary (AI) | ✅ Ready |
| Document Q&A (AI) | ✅ Ready |
| Insurance Q&A (AI) | ✅ Ready |
| No-Show Prediction (ML) | ✅ Ready |

---

## Stack

| Layer | Technology |
|---|---|
| API | FastAPI + Pydantic v2 |
| Database | MongoDB (Motor async driver) |
| Vector Store | ChromaDB |
| Embeddings | `BAAI/bge-small-en-v1.5` |
| LLM | Ollama (Mistral / LLaMA 3) |
| ML | XGBoost + scikit-learn |

---

## Quick Start

### 1. Prerequisites

- Python 3.11+
- Docker (for MongoDB)
- [Ollama](https://ollama.com) installed

### 2. Start MongoDB

```bash
cd backend
docker-compose up -d
```

MongoDB UI → http://localhost:8081 (admin / admin123)

### 3. Install dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Configure environment

```bash
cp .env.example .env
# Edit .env if needed
```

### 5. Start Ollama

```bash
ollama pull mistral
ollama serve
```

### 6. Seed fake data

```bash
python seed.py
```

### 7. Train ML model

```bash
python -m app.ml.train_no_show
```

### 8. Run the API

```bash
uvicorn app.main:app --reload --port 8000
```

Swagger UI → http://localhost:8000/docs

---

## API Overview

### Patients
```
POST   /patients          Create patient
GET    /patients          List all patients
GET    /patients/{id}     Get patient
PUT    /patients/{id}     Update patient
DELETE /patients/{id}     Delete patient
```

### Visits
```
POST   /visits                    Log a visit
GET    /visits/patient/{id}       Get visit history
GET    /visits/{visit_id}         Get single visit
```

### Documents
```
POST   /documents/upload              Upload + auto-ingest to RAG
GET    /documents/patient/{id}        List patient documents
```

### AI
```
POST   /ai/patient-summary    Generate AI clinical summary
POST   /ai/query              RAG Q&A over documents
POST   /ai/insurance-query    Insurance coverage Q&A
POST   /ai/predict-noshow     No-show risk prediction
```

---

## Project Structure

```
backend/
├── app/
│   ├── api/              # FastAPI routers
│   ├── services/         # Business logic
│   ├── db/               # MongoDB connection
│   ├── models/           # Pydantic schemas
│   ├── rag/              # Ingest + retrieve pipeline
│   └── ml/               # XGBoost training
├── seed.py               # Fake data generator
├── docker-compose.yml    # MongoDB + Mongo Express
├── requirements.txt
└── .env.example
```

---

## Week 1 Checklist

- [x] FastAPI running
- [x] MongoDB connected
- [x] Patient CRUD
- [x] Visit CRUD
- [x] PDF Upload
- [x] ChromaDB ingestion
