import os

import pymongo

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = "odoo_gandhinagar"

COLLECTIONS = [
    "users",
    "vehicles",
    "drivers",
    "trips",
    "maintenance_logs",
    "fuel_logs",
    "expenses",
]

UNIQUE_INDEXES = {
    "users": ["email"],
    "vehicles": ["registration_number"],
    "drivers": ["license_number"],
}


def init_db():
    client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.admin.command("ping")
    db = client[DB_NAME]

    for name in COLLECTIONS:
        db[name]

    for collection_name, fields in UNIQUE_INDEXES.items():
        for field in fields:
            db[collection_name].create_index(field, unique=True)

    print(f"Connected to MongoDB. Initialized '{DB_NAME}' with collections: {COLLECTIONS}")
    return client, db


if __name__ == "__main__":
    init_db()
