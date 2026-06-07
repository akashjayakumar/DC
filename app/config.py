from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # MongoDB
    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db_name: str = "dentalcopilot"

    # Gemini
    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"

    # ChromaDB
    chroma_persist_dir: str = "./chroma_store"

    # File uploads
    upload_dir: str = "./uploads"

    # App
    app_env: str = "development"
    app_port: int = 8000

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
