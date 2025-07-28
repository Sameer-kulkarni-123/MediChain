from fastapi import HTTPException
from models.connection import ProductInDB, ConnectionModel, ConnectionUpdateModel
from config.db import db
from bson import ObjectId

collection = db.get_collection('connections')

COLLECTION_MAP = {
    "manufacturer": db.manufacturers,
    "distributor": db.distributors,
    "retailer": db.retailers
}

async def add_connection(connection: ConnectionModel):
    # Validate fromType and toType
    if connection.fromType not in COLLECTION_MAP:
        raise HTTPException(status_code=400, detail=f"Invalid fromType: {connection.fromType}")
    if connection.toType not in COLLECTION_MAP:
        raise HTTPException(status_code=400, detail=f"Invalid toType: {connection.toType}")
    
    # Validate fromID and toID exist
    from_doc = await COLLECTION_MAP[connection.fromType].find_one({"_id": ObjectId(connection.fromID)})
    if not from_doc:
        raise HTTPException(status_code=404, detail=f"{connection.fromType.capitalize()} with ID {connection.fromID} not found.")
    
    to_doc = await COLLECTION_MAP[connection.toType].find_one({"_id": ObjectId(connection.toID)})
    if not to_doc:
        raise HTTPException(status_code=404, detail=f"{connection.toType.capitalize()} with ID {connection.toID} not found.")
    
    # Insert connection
    connection_dict = connection.model_dump(by_alias=True)
    result = await collection.insert_one(connection_dict)
    new_connection = await collection.find_one({"_id": result.inserted_id})
    return ProductInDB(**new_connection)


async def get_connection_from_id(from_id: str, to_type: str = None):
    query = {"fromID": from_id}
    if to_type:
        query["toType"] = to_type
    
    docs = await collection.find(query).to_list(length=100)
    if not docs:
        raise HTTPException(status_code=404, detail=f"No connections from {from_id}")
    return [ProductInDB(**doc) for doc in docs]


async def get_connection_to_id(to_id: str, from_type: str = None):
    query = {"toID": to_id}
    if from_type:
        query["fromType"] = from_type
    
    docs = await collection.find(query).to_list(length=100)
    if not docs:
        raise HTTPException(status_code=404, detail=f"No connections to {to_id}")
    return [ProductInDB(**doc) for doc in docs]


async def get_connections_for_entity(entity_id: str):
    docs = await collection.find({
        "$or": [
            {"fromID": entity_id},
            {"toID": entity_id}
        ]
    }).to_list(length=None)

    if not docs:
        raise HTTPException(status_code=404, detail=f"No connections found for ID {entity_id}")
    return [ProductInDB(**doc) for doc in docs]


async def delete_connection(from_id: str, to_id: str):
    result = await collection.delete_one({
        "fromID": from_id,
        "toID": to_id
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Connection not found")
    return {"detail": "Connection deleted"}


async def update_connection(from_id: str, to_id: str, update_data: ConnectionUpdateModel):
    update_dict = {k: v for k, v in update_data.dict(exclude_unset=True).items()}
    
    result = await collection.update_one(
        {"fromID": from_id, "toID": to_id},
        {"$set": update_dict}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Connection not found or nothing changed")
    
    return {"detail": "Connection updated successfully"}

#connections for s specific type
async def get_all_connections(from_type: str = None, to_type: str = None):
    query = {}
    if from_type:
        query["fromType"] = from_type
    if to_type:
        query["toType"] = to_type
    
    docs = await collection.find(query).to_list(length=None)
    return [ProductInDB(**doc) for doc in docs]


async def get_graph():
    graph = {}
    cursor = collection.find()
    async for conn in cursor:
        src = conn["fromID"]
        dst = conn["toID"]
        weight = conn.get("costPerUnit", 1)  # or distance
        if src not in graph:
            graph[src] = []
        graph[src].append({"to": dst, "weight": weight})
    return graph
