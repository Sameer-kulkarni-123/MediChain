import asyncio
from config.db import db

async def test():
    print(await db.list_collection_names())

asyncio.run(test())
