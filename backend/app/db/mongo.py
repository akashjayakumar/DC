from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

# Module-level client — created once, reused across requests
_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongo_uri)
    return _client


def get_db():
    return get_client()[settings.mongo_db_name]


# Collections — import these directly in services
def get_patients_collection():
    return get_db()["patients"]


def get_visits_collection():
    return get_db()["visits"]


def get_appointments_collection():
    return get_db()["appointments"]


def get_documents_collection():
    return get_db()["documents"]


async def ping_db() -> bool:
    """Health-check: returns True if MongoDB is reachable."""
    try:
        await get_client().admin.command("ping")
        return True
    except Exception:
        return False
