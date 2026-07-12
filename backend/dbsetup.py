import os
import pymongo

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = "odoo_gandhinagar"
COLLECTION_NAME = "signup"


def init_db():
    client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.admin.command("ping")

    db = client[DB_NAME]
    if COLLECTION_NAME not in db.list_collection_names():
        db.create_collection(COLLECTION_NAME)

    signup = db[COLLECTION_NAME]
    print(f"Connected to MongoDB and initialized '{DB_NAME}.{COLLECTION_NAME}'.")
    return client, db, signup




if __name__ == "__main__":
    init_db()

