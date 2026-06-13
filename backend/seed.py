"""
Seed Script — Generates fake clinic data and inserts into MongoDB.
Run from backend/ directory:
    python seed.py

Generates:
  - 1000 patients
  - 5000 visits (linked to patients)
"""
import asyncio
import random
from datetime import datetime, timedelta

from faker import Faker
from motor.motor_asyncio import AsyncIOMotorClient

fake = Faker()
random.seed(42)
Faker.seed(42)

MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "dentalcopilot"

DIAGNOSES = [
    "Dental Caries – Class I", "Dental Caries – Class II", "Dental Caries – Class III",
    "Gingivitis", "Chronic Periodontitis", "Periapical Abscess",
    "Dental Fracture", "Tooth Impaction", "Malocclusion",
    "Bruxism", "Dry Socket", "Oral Ulcer", "Hypersensitivity",
]

TREATMENTS = [
    "Composite Filling", "Amalgam Filling", "Root Canal Treatment",
    "Tooth Extraction", "Scaling and Root Planing", "Crown Placement",
    "Bridge Installation", "Dental Implant Consultation",
    "Fluoride Treatment", "Teeth Whitening", "Orthodontic Adjustment",
    "Night Guard Fitting", "Emergency Palliative Treatment",
]

CONDITIONS = [
    "Diabetes", "Hypertension", "Asthma", "Heart Disease",
    "Osteoporosis", "HIV/AIDS", "Cancer (in remission)",
    "Blood Thinners", "Kidney Disease", "None",
]

ALLERGIES = ["Penicillin", "Aspirin", "Latex", "Ibuprofen", "Codeine", "Sulfa drugs"]


def random_past_date(days_back: int = 365 * 3) -> datetime:
    delta = timedelta(days=random.randint(0, days_back))
    return datetime.utcnow() - delta


async def seed():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    # Clear existing
    await db.patients.delete_many({})
    await db.visits.delete_many({})
    print("🗑️  Cleared existing patients and visits.")

    # ── Patients ──────────────────────────────────────────────────────────
    patients = []
    for _ in range(1000):
        num_conditions = random.choices([0, 1, 2], weights=[0.6, 0.3, 0.1])[0]
        num_allergies = random.choices([0, 1, 2], weights=[0.7, 0.2, 0.1])[0]
        now = datetime.utcnow()
        patients.append({
            "name": fake.name(),
            "age": random.randint(5, 85),
            "gender": random.choice(["Male", "Female"]),
            "phone": fake.numerify("##########"),
            "email": fake.email(),
            "conditions": random.sample([c for c in CONDITIONS if c != "None"], num_conditions),
            "allergies": random.sample(ALLERGIES, num_allergies),
            "notes": fake.sentence() if random.random() < 0.2 else None,
            "created_at": now,
            "updated_at": now,
        })

    result = await db.patients.insert_many(patients)
    patient_ids = [str(oid) for oid in result.inserted_ids]
    print(f"✅ Inserted {len(patient_ids)} patients.")

    # ── Visits ────────────────────────────────────────────────────────────
    visits = []
    for _ in range(5000):
        patient_id = random.choice(patient_ids)
        visit_date = random_past_date()
        diagnosis = random.choice(DIAGNOSES)
        treatment = random.choice(TREATMENTS)

        visits.append({
            "patient_id": patient_id,
            "date": visit_date,
            "chief_complaint": fake.sentence(nb_words=6) if random.random() < 0.7 else None,
            "diagnosis": diagnosis,
            "treatment": treatment,
            "teeth_involved": random.sample(
                [f"#{n}" for n in range(1, 33)],
                random.randint(1, 3),
            ),
            "medications_prescribed": random.sample(
                ["Ibuprofen 400mg", "Amoxicillin 500mg", "Metronidazole 400mg",
                 "Paracetamol 500mg", "Chlorhexidine mouthwash"],
                random.randint(0, 2),
            ),
            "follow_up_date": visit_date + timedelta(days=random.randint(7, 90))
                if random.random() < 0.5 else None,
            "notes": fake.sentence() if random.random() < 0.4 else None,
            "cost": round(random.uniform(500, 15000), 2),
            "created_at": visit_date,
        })

    await db.visits.insert_many(visits)
    print(f"✅ Inserted {len(visits)} visits.")

    client.close()
    print("\n🎉 Seeding complete! Run the API and explore at http://localhost:8000/docs")


if __name__ == "__main__":
    asyncio.run(seed())
