# database.py
# Handles the MongoDB connection and exposes the tickets collection
# for use across the app (main.py will import from here).

import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()  # reads .env into environment variables

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")

client = AsyncIOMotorClient(MONGO_URI)
db = client[MONGO_DB_NAME]
tickets_collection = db["tickets"]