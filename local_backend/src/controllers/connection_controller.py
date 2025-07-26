from this import d
from fastapi import HTTPException
from models.connection import ProductInDB, ConnectionModel, ConnectionUpdateModel
from config.db import db
from datetime import datetime
from bson import ObjectId
import random

collection = db.get_collection('connections')

COLLECTION_MAP = {
    "manufacturer": db.manufacturers,
    "distributor": db.distributors,
    "retailer": db.retailers
}

async def add_connection(connection: ConnectionModel):
    # Validate fromType
    if connection.fromType not in COLLECTION_MAP:
        raise HTTPException(status_code=400, detail=f"Invalid fromType: {connection.fromType}")
    # Validate toType
    if connection.toType not in COLLECTION_MAP:
        raise HTTPException(status_code=400, detail=f"Invalid toType: {connection.toType}")
    # Validate fromID exists
    from_collection = COLLECTION_MAP[connection.fromType]
    from_doc = await from_collection.find_one({"_id": ObjectId(connection.fromID)})
    if not from_doc:
        raise HTTPException(status_code=404, detail=f"{connection.fromType.capitalize()} with ID {connection.fromID} not found.")
    
     # Validate toID exists
    to_collection = COLLECTION_MAP[connection.toType]
    to_doc = await to_collection.find_one({"_id": ObjectId(connection.toID)})
    if not to_doc:
        raise HTTPException(status_code=404, detail=f"{connection.toType.capitalize()} with ID {connection.toID} not found.")
    
    # If valid, insert connection
    connection_dict = connection.model_dump(by_alias=True)
    result = await db.connections.insert_one(connection_dict)
    new_connection = await db.connections.find_one({"_id": result.inserted_id})
    return ProductInDB(**new_connection)


# the manufacturer will always remain from and retial we be in to and distributor

async def get_connection_from_id(from_id: str, to_type: str = None):
    query = {"fromId": from_id}
    if to_type:
        query["toType"] = to_type
    cursor = collection.find(query)
    docs = await cursor.to_list(length=100)
    if not docs:
        raise HTTPException(status_code=404, detail=f"No connections from {from_id}")
    return docs



async def get_connection_to_id(to_id: str, from_type: str = None):
    query = {"toId": to_id}
    if from_type:
        query["fromType"] = from_type
    cursor = collection.find(query)
    docs = await cursor.to_list(length=100)
    if not docs:
        raise HTTPException(status_code=404, detail=f"No connections to {to_id}")
    return docs


async def get_connections_for_entity(entity_id: str):
    connections = await collection.find({
        "$or": [
            {"fromId": entity_id},
            {"toId": entity_id}
        ]
    }).to_list(length=None)

    if not connections:
        raise HTTPException(status_code=404, detail=f"No connections found for ID {entity_id}")
    
    return connections


async def delete_connections(from_id: str, to_id: str):
    result = await collection.delete_one({
        "fromId": from_id,
        "toId": to_id
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Connection not found")
    return {"detail": "Connection deleted"}



async def update_connection(from_id: str, to_id:str,  update_data:ConnectionUpdateModel ):
    update_dict = {k: v for k, v in update_data.dict(exclude_unset=True).items()}

    result = await collection.update_one(
        {"fromId": from_id },
        {"toId": to_id},
        {"$set": update_dict}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="connection not found or nothing changed")
    
    return {"detail": "connection updated successfully"}

