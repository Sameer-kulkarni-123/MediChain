from fastapi import HTTPException
from models.retailer import ProductInDB, RetailerModel, RetailerUpdateModel
from config.db import db
from datetime import datetime
from bson import ObjectId
import random


collection = db.get_collection("retailers")


async def add_retailer(retailer : RetailerModel):
   
    # Generate a unique retailerId
    suffix = random.randint(1000, 9999)
    retailer_id = f"ret_{suffix}"
    
    # Ensure uniqueness
    while await collection.find_one({"retailerId": retailer_id}):
        suffix = random.randint(1000, 9999)
        retailer_id = f"ret_{suffix}"

    retailer_dict = retailer.model_dump(exclude_unset=True)
    retailer_dict["retailerId"] = retailer_id

    result = await collection.insert_one(retailer_dict)
    new_retailer = await collection.find_one({"_id": result.inserted_id})
    return ProductInDB(**new_retailer)


async def all_retailers():
    retailers = []
    async for docs in collection.find():
        retailers.append(ProductInDB(**docs))
    return retailers


async def one_retailers(retailer_id: str):
    doc = await collection.find_one({"retailerId": retailer_id})
    if not doc:
        raise HTTPException(status_code=404, detail="retailer not found")
    return doc

    

async def delete_retailer(retailer_id: str):
    result = await collection.delete_one({"retailerId": retailer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=" retailer not found")
    return {"detail": "retailer deleted"}


async def update_retailer(retailer_id: str, update_data: RetailerUpdateModel):
    update_dict = {k: v for k, v in update_data.dict(exclude_unset=True).items()}

    result = await collection.update_one(
        {"retailerId": retailer_id},
        {"$set": update_dict}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Retailer not found or nothing changed")
    
    return {"detail": "Retailer updated successfully"}



     