from fastapi import HTTPException
from models.distributor import ProductInDB, DistributorModel, DistributorUpdateModel
from config.db import db
from datetime import datetime
from bson import ObjectId
import random


collection = db.get_collection("distributor")

async def add_distributor(distributor: DistributorModel):

    # Generate a unique distributorId
    suffix = random.randint(1000, 9999)
    distributor_id = f"dist_{suffix}"

    # Ensure uniqueness
    while await collection.find_one({"distributorId": distributor_id}):
        suffix = random.randint(1000, 9999)
        distributor_id = f"dist_{suffix}"

    distributor_dict = distributor.model_dump(exclude_unset=True)
    distributor_dict["distributorId"] = distributor_id

    result = await collection.insert_one(distributor_dict)
    new_distributor = await collection.find_one({"_id": result.inserted_id})
    return ProductInDB(**new_distributor)


async def all_distributors():
    distributors = []
    async for docs in collection.find():
        distributors.append(ProductInDB(**docs))
    return distributors


async def one_distributor(distributor_id: str):
    doc = await collection.find_one({"distributorId": distributor_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Distributor not found")
    return doc

    

async def delete_distributor(distributor_id: str):
    result = await collection.delete_one({"distributorId": distributor_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Distributor not found")
    return {"detail": "Distributor deleted"}


async def update_distributor(distributor_id: str, update_data: DistributorUpdateModel):
    update_dict = {k: v for k, v in update_data.dict(exclude_unset=True).items()}

    result = await collection.update_one(
        {"distributorId": distributor_id},
        {"$set": update_dict}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Distributor not found or nothing changed")
    
    return {"detail": "Distributor updated successfully"}


async def get_all_inventory(distributor_id: str):
    distributor = await collection.find_one({"distributorId": distributor_id})
    if not distributor:
        raise HTTPException(status_code=404, detail="Distributor not found")
    
    return distributor.get("inventory", [])


async def get_inventory_item(distributor_id: str, product_name: str):
    distributor = await collection.find_one({"distributorId": distributor_id})
    if not distributor:
        raise HTTPException(status_code=404, detail="Distributor not found")
    
    inventory = distributor.get("inventory", [])
    item = next((i for i in inventory if i["productName"].lower() == product_name.lower()), None)
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found in inventory")
    
    return item

async def update_inventory(distributor_id: str, inventory_data: list[dict]):
    """
    inventory_data = [{"productName": "Paracetamol", "qty": 50, "reorderLevel": 5}, ...]
    """
    distributor = await collection.find_one({"distributorId": distributor_id})
    if not distributor:
        raise HTTPException(status_code=404, detail="Distributor not found")

    # Update the entire inventory
    result = await collection.update_one(
        {"distributorId": distributor_id},
        {"$set": {"inventory": inventory_data}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Inventory not updated")

    return {"detail": "Inventory updated successfully"}


async def update_inventory_item(distributor_id: str, product_name: str, qty: int):
    result = await collection.update_one(
        {"distributorId": distributor_id, "inventory.productName": product_name},
        {"$set": {"inventory.$.qty": qty}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Item not found or quantity not updated")

    return {"detail": f"Quantity for {product_name} updated"}
