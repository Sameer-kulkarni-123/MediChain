from fastapi import HTTPException
from models.distributor import ProductInDB, DistributorModel, DistributorUpdateModel
from config.db import db
from datetime import datetime
from bson import ObjectId
import random


collection = db.get_collection("distributors")

async def add_distributor(distributor: DistributorModel):

    if await collection.find_one({"walletAddress": distributor.walletAddress}):
        raise HTTPException(status_code=400, detail="WalletAddress already exists")
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


async def one_distributor(distributor_walletAddress: str):
    doc = await collection.find_one({"walletAddress": distributor_walletAddress})
    if not doc:
        raise HTTPException(status_code=404, detail="Distributor not found")
    return ProductInDB(**doc)

    

async def delete_distributor(distributor_walletAddress: str):
    result = await collection.delete_one({"walletAddress": distributor_walletAddress})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Distributor not found")
    return {"detail": "Distributor deleted"}


async def update_distributor(distributor_walletAddress: str, update_data: DistributorUpdateModel):
    update_dict = {k: v for k, v in update_data.dict(exclude_unset=True).items()}

    result = await collection.update_one(
        {"walletAddress": distributor_walletAddress},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Distributor not found")

    if result.modified_count == 0:
        return {"detail": "No changes were made"} 

    return {"detail": "Distributor updated successfully"}

async def get_all_inventory(distributor_walletAddress: str):
    distributor = await collection.find_one({"walletAddress": distributor_walletAddress})
    if not distributor:
        raise HTTPException(status_code=404, detail="Distributor not found")
    
    return distributor.get("inventory", [])


async def get_inventory_item(distributor_walletAddress: str, product_name: str):
    distributor = await collection.find_one({"walletAddress": distributor_walletAddress})
    if not distributor:
        raise HTTPException(status_code=404, detail="Distributor not found")
    
    inventory = distributor.get("inventory", [])
    item = next((i for i in inventory if i["productName"].lower() == product_name.lower()), None)
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found in inventory")
    
    return item

async def bulk_update_inventory(distributor_walletAddress: str, updates: list[dict]):
    """
    Bulk update distributor inventory with productIds support.
    """
    entity = await collection.find_one({"walletAddress": distributor_walletAddress})
    if not entity:
        raise HTTPException(status_code=404, detail="Distributor not found")

    current_inventory = entity.get("inventory", [])
    updated_inventory = []

    for product in current_inventory:
        name = product["productName"]
        update_item = next((u for u in updates if u["productName"].lower() == name.lower()), None)

        if update_item:
            # Handle delete case
            if update_item.get("delete") or update_item.get("qty", product["qty"]) == 0:
                continue

            # Update quantity (increment if qty > 0)
            qty = update_item.get("qty", 0)
            product["qty"] = product["qty"] + qty if qty > 0 else product["qty"]

            # Merge productIds
            if "productIds" in update_item:
                product["productIds"] = list(set(product.get("productIds", []) + update_item["productIds"]))

            # Update reorderLevel if present
            if "reorderLevel" in update_item:
                product["reorderLevel"] = update_item["reorderLevel"]

            updated_inventory.append(product)
        else:
            updated_inventory.append(product)

    # Add new products
    for update_item in updates:
        name = update_item["productName"]
        if not any(p["productName"].lower() == name.lower() for p in updated_inventory):
            if not update_item.get("delete") and update_item.get("qty", 0) > 0:
                updated_inventory.append({
                    "productName": name,
                    "qty": update_item["qty"],
                    "productIds": update_item.get("productIds", []),
                    "reorderLevel": update_item.get("reorderLevel", 0)
                })

    result = await collection.update_one(
        {"walletAddress": distributor_walletAddress },
        {"$set": {"inventory": updated_inventory}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="No changes made to inventory")

    return {"detail": "Inventory updated successfully"}


async def update_inventory_item(distributor_walletAddress: str, product_name: str, qty: int, product_ids: list[str] = None, reorder_level: int = None):
    """
    Update or add a single inventory item with productIds support.
    """
    entity = await collection.find_one({"walletAddress": distributor_walletAddress})
    if not entity:
        raise HTTPException(status_code=404, detail="Distributor not found")

    inventory = entity.get("inventory", [])
    updated = False

    for item in inventory:
        if item["productName"].lower() == product_name.lower():
            if qty <= 0:
                inventory.remove(item)  # delete product
            else:
                item["qty"] = qty
                if reorder_level is not None:
                    item["reorderLevel"] = reorder_level

                if product_ids:
                    item["productIds"] = list(set(item.get("productIds", []) + product_ids))
            updated = True
            break

    if not updated and qty > 0:
        inventory.append({
            "productName": product_name,
            "qty": qty,
            "productIds": product_ids or [],
            "reorderLevel": reorder_level or 0
        })

    result = await collection.update_one(
        {"walletAddress": distributor_walletAddress},
        {"$set": {"inventory": inventory}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update inventory")

    if qty <= 0:
        return {"detail": f"Product '{product_name}' deleted successfully"}
    elif updated:
        return {"detail": f"Product '{product_name}' updated successfully"}
    else:
        return {"detail": f"Product '{product_name}' added successfully"}
