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

# Add a new connection
async def add_connection(connection: ConnectionModel):

    existing = await collection.find_one({
        "fromWalletAddress": connection.fromWalletAddress,
        "toWalletAddress": connection.toWalletAddress
    })
    if existing:
        raise HTTPException(
            status_code=400, 
            detail=f"Connection from {connection.fromWalletAddress} to {connection.toWalletAddress} already exists."
    )

    # Validate fromType and toType
    if connection.fromType not in COLLECTION_MAP:
        raise HTTPException(status_code=400, detail=f"Invalid fromType: {connection.fromType}")
    if connection.toType not in COLLECTION_MAP:
        raise HTTPException(status_code=400, detail=f"Invalid toType: {connection.toType}")
    
    # Validate wallet addresses from related collections
    from_doc = await COLLECTION_MAP[connection.fromType].find_one({"walletAddress": connection.fromWalletAddress})
    if not from_doc:
        raise HTTPException(
            status_code=404, 
            detail=f"{connection.fromType.capitalize()} with wallet address {connection.fromWalletAddress} not found."
        )
        
    to_doc = await COLLECTION_MAP[connection.toType].find_one({"walletAddress": connection.toWalletAddress})
    if not to_doc:
        raise HTTPException(
            status_code=404, 
            detail=f"{connection.toType.capitalize()} with wallet address {connection.toWalletAddress} not found."
        )

    # Insert connection
    connection_dict = connection.model_dump(by_alias=True)
    result = await collection.insert_one(connection_dict)
    new_connection = await collection.find_one({"_id": result.inserted_id})
    return ProductInDB(**new_connection)


async def get_connection_from_id(from_walletAddress: str, to_type: str = None):
    query = {"fromWalletAddress": from_walletAddress}
    if to_type:
        query["toType"] = to_type
    
    docs = await collection.find(query).to_list(length=100)
    if not docs:
        raise HTTPException(status_code=404, detail=f"No connections from {from_walletAddress}")
    return [ProductInDB(**doc) for doc in docs]



async def get_connection_to_id(to_walletAddress: str, from_type: str = None):
    query = {"toWalletAddress": to_walletAddress}
    if from_type:
        query["fromType"] = from_type
    
    docs = await collection.find(query).to_list(length=100)
    if not docs:
        raise HTTPException(status_code=404, detail=f"No connections to {to_walletAddress}")
    return [ProductInDB(**doc) for doc in docs]



async def get_connections_for_entity(entity_walletAddress: str):
    docs = await collection.find({
        "$or": [
            {"fromWalletAddress": entity_walletAddress},
            {"toWalletAddress": entity_walletAddress}
        ]
    }).to_list(length=None)

    if not docs:
        raise HTTPException(status_code=404, detail=f"No connections found for ID {entity_walletAddress}")
    return [ProductInDB(**doc) for doc in docs]



async def delete_connection(from_walletAddress: str, to_walletAddress: str):
    result = await collection.delete_one({
        "fromWalletAddress": from_walletAddress,
        "toWalletAddress": to_walletAddress
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Connection not found")
    return {"detail": "Connection deleted"}



async def update_connection(from_walletAddress: str, to_walletAddress: str, update_data: ConnectionUpdateModel):
    update_dict = {k: v for k, v in update_data.dict(exclude_unset=True).items()}
    
    result = await collection.update_one(
        {"fromWalletAddress": from_walletAddress, "toWalletAddress": to_walletAddress},
        {"$set": update_dict}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Connection not found or nothing changed")
    
    return {"detail": "Connection updated successfully"}


#connections for a specific type
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
        src = conn["fromWalletAddress"]
        dst = conn["toWalletAddress"]
        weight = conn.get("costPerUnit", 1)  # or distance
        if src not in graph:
            graph[src] = []
        graph[src].append({"to": dst, "weight": weight})
    return graph
