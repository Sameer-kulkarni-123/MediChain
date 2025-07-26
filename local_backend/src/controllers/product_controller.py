from fastapi import HTTPException
from models.product import ProductInDB, ProductModel
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
