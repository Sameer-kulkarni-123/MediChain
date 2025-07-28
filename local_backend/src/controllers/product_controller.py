from fastapi import HTTPException
from models.product import ProductInDB, ProductModel, LocationModel
from config.db import db
from datetime import datetime
from bson import ObjectId

collection = db.get_collection("products")

async def create_product(product: ProductModel):
    product_dict = product.model_dump(exclude_unset=True)
    product_dict["createdAt"] = product_dict.get("createdAt") or datetime.utcnow()
    result = await collection.insert_one(product_dict)
    new_product = await collection.find_one({"_id": result.inserted_id})
    return ProductInDB(**new_product)

async def all_products():
    try:
        await db.command("ping")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MongoDB not reachable: {str(e)}")
    products = []
    async for docs in collection.find():
        products.append(ProductInDB(**docs))
    return products

async def get_product_by_id(product_id: str):
    product = await collection.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductInDB(**product)


async def get_products_by_location(entity_id: str, entity_type: str):
    """
    Get all products currently at a specific manufacturer/distributor/retailer.
    """
    query = {"location.id": ObjectId(entity_id), "location.type": entity_type}
    cursor = collection.find(query)
    products = await cursor.to_list(length=None)
    return [ProductInDB(**p) for p in products]


async def get_products_in_transit():
    cursor = collection.find({"inTransit": True})
    products = await cursor.to_list(length=None)
    return [ProductInDB(**p) for p in products]


async def get_products_by_batch(batch_id: str):
    cursor = collection.find({"batchId": ObjectId(batch_id)})
    products = await cursor.to_list(length=None)
    return [ProductInDB(**p) for p in products]


async def get_products_by_name(name: str):
    cursor = collection.find({"productName": {"$regex": name, "$options": "i"}})
    products = await cursor.to_list(length=None)
    return [ProductInDB(**p) for p in products]



async def update_product_location(product_id: str, new_location: LocationModel, in_transit: bool = False):
    """
    Update the product's location (useful when shipment is completed).
    """
    update_data = {
        "location": new_location.model_dump(),
        "inTransit": in_transit
    }
    result = await collection.update_one({"_id": ObjectId(product_id)}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Product not found or no changes made")
    return {"detail": "Product location updated successfully"}