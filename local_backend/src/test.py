import asyncio
from config.db import db

async def test_insert():
    await db.get_collection("test").insert_one({"name": "test"})
    print("Insert worked")

asyncio.run(test_insert())
