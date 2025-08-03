from fastapi import HTTPException
from models.retailer import ProductInDB, RetailerModel, RetailerUpdateModel
from config.db import db
from datetime import datetime
from bson import ObjectId
import random


collection = db.get_collection("retailers")


async def add_retailer(retailer : RetailerModel):

    retailer_dict = retailer.model_dump(exclude_unset=True)

    if await collection.find_one({"walletAddress": retailer_dict["walletAddress"]}):
        raise HTTPException(status_code=400, detail="Retailer with this walletAddress already exists")
   
    # Generate a unique retailerId
    suffix = random.randint(1000, 9999)
    retailer_id = f"ret_{suffix}"
    
    # Ensure uniqueness
    while await collection.find_one({"retailerId": retailer_id}):
        suffix = random.randint(1000, 9999)
        retailer_id = f"ret_{suffix}"

    
    retailer_dict["retailerId"] = retailer_id

    result = await collection.insert_one(retailer_dict)
    new_retailer = await collection.find_one({"_id": result.inserted_id})
    return ProductInDB(**new_retailer)


async def all_retailers():
    retailers = []
    async for docs in collection.find():
        retailers.append(ProductInDB(**docs))
    return retailers


async def one_retailers(retailer_walletAddress: str):
    doc = await collection.find_one({"walletAddress": retailer_walletAddress})
    if not doc:
        raise HTTPException(status_code=404, detail="retailer not found")
    return doc

    

async def delete_retailer(retailer_walletAddress: str):
    result = await collection.delete_one({"walletAddress": retailer_walletAddress})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=" retailer not found")
    return {"detail": "retailer deleted"}


async def update_retailer(retailer_walletAddress: str, update_data: RetailerUpdateModel):
    update_dict = {k: v for k, v in update_data.dict(exclude_unset=True).items()}

    result = await collection.update_one(
        {"walletAddress": retailer_walletAddress},
        {"$set": update_dict}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Retailer not found or nothing changed")
    
    return {"detail": "Retailer updated successfully"}


async def bulk_update_inventory(retailer_walletAddress: str, updates: list[BulkUpdateItem]):
    retailer = await collection.find_one({"walletAddress": retailer_walletAddress})
    if not retailer:
        raise HTTPException(status_code=404, detail="Retailer not found")

    current_inventory = retailer.get("inventory", [])
    updated_inventory = []

    for product in current_inventory:
        name = product["productName"].lower()
        update_item = next((u for u in updates if u.productName.lower() == name), None)

        if update_item:
            action = update_item.action
            qty_delta = update_item.qty

            if action == "remove":
                new_qty = product["qtyRemaining"] - qty_delta
                if update_item.productIds:
                    product["productIds"] = [
                        pid for pid in product.get("productIds", [])
                        if pid not in update_item.productIds
                    ]
            else:  # add
                new_qty = product["qtyRemaining"] + qty_delta
                if update_item.productIds:
                    product["productIds"] = list(
                        set(product.get("productIds", []) + update_item.productIds)
                    )

            if new_qty <= 0:
                continue  # product removed

            product["qtyRemaining"] = new_qty
            product["qtyAdded"] = qty_delta if action == "add" else 0
            if action == "add":
                product["lastStockAddedDate"] = datetime.utcnow()

            if update_item.reorderLevel is not None:
                product["reorderLevel"] = update_item.reorderLevel

            updated_inventory.append(product)
        else:
            updated_inventory.append(product)

    # Add new products (only if add)
    for update_item in updates:
        name = update_item.productName.lower()
        if update_item.action == "add" and not any(p["productName"].lower() == name for p in updated_inventory):
            if update_item.qty > 0:
                updated_inventory.append({
                    "productName": update_item.productName,
                    "qtyRemaining": update_item.qty,
                    "qtyAdded": update_item.qty,
                    "productIds": update_item.productIds or [],
                    "lastStockAddedDate": datetime.utcnow(),
                    "reorderLevel": update_item.reorderLevel or 0
                })

    result = await collection.update_one(
        {"walletAddress": retailer_walletAddress},
        {"$set": {"inventory": updated_inventory}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="No changes made to inventory")

    return {"detail": "Inventory updated successfully"}


async def update_inventory_item(
    retailer_walletAddress: str,
    product_name: str,
    qty: int,
    reorder_level: int = None,
    product_ids: list[str] = None,
    action: str = "add"
):
    """
    Update or remove a single inventory item.
    """
    retailer = await collection.find_one({"walletAddress": retailer_walletAddress})
    if not retailer:
        raise HTTPException(status_code=404, detail="Retailer not found")

    inventory = retailer.get("inventory", [])
    updated = False

    for item in inventory:
        if item["productName"].lower() == product_name.lower():
            if action == "remove":
                new_qty = item["qtyRemaining"] - qty
                if product_ids:
                    item["productIds"] = [pid for pid in item.get("productIds", []) if pid not in product_ids]
            else:
                new_qty = item["qtyRemaining"] + qty
                if product_ids:
                    item["productIds"] = list(set(item.get("productIds", []) + product_ids))

            if new_qty <= 0:
                inventory.remove(item)
            else:
                item["qtyRemaining"] = new_qty
                item["qtyAdded"] = qty if action == "add" else 0
                if action == "add":
                    item["lastStockAddedDate"] = datetime.utcnow()

                if reorder_level is not None:
                    item["reorderLevel"] = reorder_level

            updated = True
            break

    # Add if doesn't exist and action is add
    if not updated and action == "add" and qty > 0:
        inventory.append({
            "productName": product_name,
            "qtyRemaining": qty,
            "qtyAdded": qty,
            "productIds": product_ids or [],
            "lastStockAddedDate": datetime.utcnow(),
            "reorderLevel": reorder_level or 0
        })

    result = await collection.update_one(
        {"walletAddress": retailer_walletAddress},
        {"$set": {"inventory": inventory}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update inventory")

    return {"detail": f"Product '{product_name}' {'removed' if action == 'remove' else 'updated'} successfully"}



async def get_retailer_inventory_item(wallet_address: str, product_name: str):
    retailer = await collection.find_one({"walletAddress": wallet_address})
    if not retailer:
        return []
    return [
        item for item in retailer.get("inventory", [])
        if item["productName"].lower() == product_name.lower()
    ]

async def get_retailer_inventory(wallet_address: str):
    retailer = await collection.find_one({"walletAddress": wallet_address})
    if not retailer:
        return []
    return [
        item for item in retailer.get("inventory", [])
    ]

async def get_individual_product_inventory(product_id: str):
    async for retailer in collection.find():
        for item in retailer.get("inventory", []):
            if product_id in item.get("productIds", []):
                return item
    return None