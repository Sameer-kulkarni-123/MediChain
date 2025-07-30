# db connection logic
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import certifi
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB = os.getenv("MONGO_DB")


client = AsyncIOMotorClient(MONGO_URI, tls=True, tlsAllowInvalidCertificates=False)
db = client[MONGO_DB]
