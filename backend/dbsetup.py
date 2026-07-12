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


def init_db():
    client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.admin.command("ping")

    db = client[DB_NAME]

    for name in COLLECTIONS:
        if name not in db.list_collection_names():
            db.create_collection(name)

    # Unique indexes -> business rules from PS ("registration number must be unique" etc.)
    db["users"].create_index("email", unique=True)
    db["vehicles"].create_index("registration_number", unique=True)
    db["drivers"].create_index("license_number", unique=True)

    print(f"Connected to MongoDB. Initialized '{DB_NAME}' with collections: {COLLECTIONS}")
    return client, db


if __name__ == "__main__":
    init_db()
