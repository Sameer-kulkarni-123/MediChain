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


async def bulk_update_inventory(retailer_walletAddress: str, updates: list[dict]):
    """
    Bulk update inventory with qtyRemaining, qtyAdded, productIds support.
    """
    retailer = await collection.find_one({"walletAddress": retailer_walletAddress})
    if not retailer:
        raise HTTPException(status_code=404, detail="Retailer not found")

    current_inventory = retailer.get("inventory", [])
    updated_inventory = []

    for product in current_inventory:
        name = product["productName"].lower()
        update_item = next((u for u in updates if u["productName"].lower() == name), None)

        if update_item:
            # Delete product if flagged
            if update_item.get("delete"):
                continue

            # Update qtyRemaining and qtyAdded
            qty_added = update_item.get("qtyAdded", 0)
            new_qty = product["qtyRemaining"] + qty_added

            if new_qty <= 0:
                continue  # remove product if no stock left

            product["qtyRemaining"] = new_qty
            product["qtyAdded"] = qty_added
            product["lastStockAddedDate"] = datetime.utcnow()

            # Merge productIds
            if "productIds" in update_item:
                product["productIds"] = list(
                    set(product.get("productIds", []) + update_item["productIds"])
                )

            # Update reorder level if provided
            if "reorderLevel" in update_item:
                product["reorderLevel"] = update_item["reorderLevel"]

            updated_inventory.append(product)
        else:
            updated_inventory.append(product)

    # Add new products
    for update_item in updates:
        name = update_item["productName"].lower()
        if not any(p["productName"].lower() == name for p in updated_inventory):
            if not update_item.get("delete") and update_item.get("qtyAdded", 0) > 0:
                updated_inventory.append({
                    "productName": update_item["productName"],
                    "qtyRemaining": update_item["qtyAdded"],
                    "qtyAdded": update_item["qtyAdded"],
                    "productIds": update_item.get("productIds", []),
                    "lastStockAddedDate": datetime.utcnow(),
                    "reorderLevel": update_item.get("reorderLevel", 0)
                })

    # Save inventory
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
    qty_added: int,
    reorder_level: int = None,
    product_ids: list[str] = None
):
    retailer = await collection.find_one({"walletAddress": retailer_walletAddress})
    if not retailer:
        raise HTTPException(status_code=404, detail="Retailer not found")

    inventory = retailer.get("inventory", [])
    updated = False

    for item in inventory:
        if item["productName"].lower() == product_name.lower():
            new_qty = item["qtyRemaining"] + qty_added

            if new_qty <= 0:
                # remove product if no stock left
                inventory.remove(item)
            else:
                item["qtyRemaining"] = new_qty
                item["qtyAdded"] = qty_added

                # Update date ONLY if stock is added
                if qty_added > 0:
                    item["lastStockAddedDate"] = datetime.utcnow()

                if reorder_level is not None:
                    item["reorderLevel"] = reorder_level

                if product_ids:
                    item["productIds"] = list(set(item.get("productIds", []) + product_ids))

            updated = True
            break

    # Add product if it doesn't exist (and qty_added > 0)
    if not updated and qty_added > 0:
        inventory.append({
            "productName": product_name,
            "qtyRemaining": qty_added,
            "qtyAdded": qty_added,
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

    if qty_added <= 0:
        return {"detail": f"Product '{product_name}' deleted successfully"}
    elif updated:
        return {"detail": f"Product '{product_name}' updated successfully"}
    else:
        return {"detail": f"Product '{product_name}' added successfully"}

##new codess
async def get_retailer_inventory(wallet_address: str, product_name: str):
    retailer = await collection.find_one({"walletAddress": wallet_address})
    if not retailer:
        return []
    return [
        item for item in retailer.get("inventory", [])
        if item["productName"].lower() == product_name.lower()
    ]

async def get_individual_product_inventory(product_id: str):
    async for retailer in collection.find():
        for item in retailer.get("inventory", []):
            if product_id in item.get("productIds", []):
                return item
    return None