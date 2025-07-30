from fastapi import HTTPException
from models.product import ProductInDB, ProductModel, LocationModel
from config.db import db
from datetime import datetime

collection = db.get_collection("products")


# Create Product
async def create_product(product: ProductModel):
    # Check if productId already exists
    existing = await collection.find_one({"productId": product.productId})
    if existing:
        raise HTTPException(status_code=400, detail="ProductId already exists")

    product_dict = product.model_dump(exclude_unset=True)
    product_dict["createdAt"] = product_dict.get("createdAt") or datetime.utcnow()

    await collection.insert_one(product_dict)
    new_product = await collection.find_one({"productId": product.productId})
    return ProductInDB(**new_product)


# Get All Products
async def all_products():
    products = []
    async for docs in collection.find():
        products.append(ProductInDB(**docs))
    return products


# Get Product by productId
async def get_product_by_id(product_id: str):
    product = await collection.find_one({"productId": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductInDB(**product)


# Get products by location
async def get_products_by_location(entity_walletAddress: str, entity_type: str):
    query = {"location.walletAddress": entity_walletAddress, "location.type": entity_type}
    cursor = collection.find(query)
    products = await cursor.to_list(length=None)
    return [ProductInDB(**p) for p in products]


# Get products in transit
async def get_products_in_transit():
    cursor = collection.find({"inTransit": True})
    products = await cursor.to_list(length=None)
    return [ProductInDB(**p) for p in products]


# Get products by batchId
async def get_products_by_batch(batch_id: str):
    cursor = collection.find({"batchId": batch_id})
    products = await cursor.to_list(length=None)
    return [ProductInDB(**p) for p in products]


# Get products by name (search)
async def get_products_by_name(name: str):
    cursor = collection.find({"productName": {"$regex": name, "$options": "i"}})
    products = await cursor.to_list(length=None)
    return [ProductInDB(**p) for p in products]


# Update product location
async def update_product_location(product_id: str, new_location: LocationModel, in_transit: bool = False):
    update_data = {
        "location": new_location.model_dump(),
        "inTransit": in_transit
    }
    result = await collection.update_one({"productId": product_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Product not found or no changes made")
    return {"detail": "Product location updated successfully"}


# Delete Product
async def delete_product(product_id: str):
    result = await collection.delete_one({"productId": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"detail": "Product deleted successfully"}
