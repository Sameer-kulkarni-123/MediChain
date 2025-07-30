from fastapi import HTTPException
from models.manufacturer import ProductInDB, ManufacturerModel, ManufacturerUpdateModel
from config.db import db
from datetime import datetime
from bson import ObjectId
import random


collection = db.get_collection("manufacturers")


async def add_manufacturer(manufacturer: ManufacturerModel):

    if await collection.find_one({"walletAddress": manufacturer.walletAddress}):
        raise HTTPException(status_code=400, detail="WalletAddress already exists")
   
    # Generate a unique manufacturerId
    suffix = random.randint(1000, 9999)
    manufacturer_id = f"manu_{suffix}"
    
    # Ensure uniqueness
    while await collection.find_one({"manufacturerId": manufacturer_id}):
        suffix = random.randint(1000, 9999)
        manufacturer_id = f"manu_{suffix}"

    manufacturer_dict = manufacturer.model_dump(exclude_unset=True)
    manufacturer_dict["manufacturerId"] = manufacturer_id

    result = await collection.insert_one(manufacturer_dict)
    new_manufacturer = await collection.find_one({"_id": result.inserted_id})
    return ProductInDB(**new_manufacturer)


async def all_manufacturers():
    manufacturers = []
    async for docs in collection.find():
        manufacturers.append(ProductInDB(**docs))
    return manufacturers


async def one_manufacturers(manufacturer_walletAddress: str):
    doc = await collection.find_one({"walletAddress": manufacturer_walletAddress})
    if not doc:
        raise HTTPException(status_code=404, detail="Manufacturer not found")
    return doc

    
async def delete_manufacturer(manufacturer_walletAddress: str):
    result = await collection.delete_one({"walletAddress": manufacturer_walletAddress})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Manufacturer not found")
    return {"detail": "Manufacturer deleted"}


async def update_manufacturer(manufacturer_walletAddress: str, update_data: ManufacturerUpdateModel):
    update_dict = {k: v for k, v in update_data.dict(exclude_unset=True).items()}

    result = await collection.update_one(
        {"walletAddress": manufacturer_walletAddress},
        {"$set": update_dict}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Manufacturer not found or nothing changed")
    
    return {"detail": "Manufacturer updated successfully"}





     