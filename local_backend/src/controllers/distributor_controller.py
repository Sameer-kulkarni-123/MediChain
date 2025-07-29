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

async def bulk_update_inventory(entity_id: str, updates: list[dict], entity_type: str = "retailer"):
    """
    Bulk update inventory:
      - Increment qty if > 0
      - Add product if it doesn't exist
      - Delete product if qty=0 or 'delete'=True

    updates = [
        {"productName": "Paracetamol", "qty": 10},
        {"productName": "Ibuprofen", "delete": True},
        {"productName": "Aspirin", "qty": 0}   # will be deleted
    ]
    """
    field_name = "retailerId" if entity_type == "retailer" else "distributorId"

    entity = await collection.find_one({field_name: entity_id})
    if not entity:
        raise HTTPException(status_code=404, detail=f"{entity_type.capitalize()} not found")

    current_inventory = entity.get("inventory", [])

    # Build new inventory list
    updated_inventory = []
    for product in current_inventory:
        name = product["productName"]

        # Check if this product has an update
        update_item = next((u for u in updates if u["productName"] == name), None)

        if update_item:
            # Handle delete cases
            if update_item.get("delete") or update_item.get("qty", product["qty"]) == 0:
                continue  # skip product (delete)
            
            # Update qty (increment or replace)
            qty = update_item.get("qty", 0)
            product["qty"] = product["qty"] + qty if qty > 0 else product["qty"]

            # Update reorder level if provided
            if "reorderLevel" in update_item:
                product["reorderLevel"] = update_item["reorderLevel"]

            updated_inventory.append(product)
        else:
            # No updates, keep the product
            updated_inventory.append(product)

    # Handle new products that aren't in current inventory
    for update_item in updates:
        name = update_item["productName"]
        if not any(p["productName"] == name for p in updated_inventory):
            if not update_item.get("delete") and update_item.get("qty", 0) > 0:
                updated_inventory.append({
                    "productName": name,
                    "qty": update_item["qty"],
                    "reorderLevel": update_item.get("reorderLevel", 0)
                })

    # Save updated inventory
    result = await collection.update_one(
        {field_name: entity_id},
        {"$set": {"inventory": updated_inventory}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="No changes made to inventory")

    return {"detail": "Inventory updated successfully"}


async def update_inventory_item(distributor_id: str, product_name: str, qty: int):
    distributor = await collection.find_one({"distributorId": distributor_id})
    if not distributor:
        raise HTTPException(status_code=404, detail="Distributor not found")

    inventory = distributor.get("inventory", [])
    updated = False

    for item in inventory:
        if item["productName"].lower() == product_name.lower():
            if qty <= 0:
                # Delete product if qty is 0
                inventory.remove(item)
            else:
                # Update existing product quantity
                item["qty"] = qty
            updated = True
            break

    # If product not found and qty > 0, add it
    if not updated and qty > 0:
        inventory.append({
            "productName": product_name,
            "qty": qty,
            "reorderLevel": 0  # default if you want
        })

    # Update inventory in DB
    result = await collection.update_one(
        {"distributorId": distributor_id},
        {"$set": {"inventory": inventory}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update inventory")

    # Response messages
    if qty <= 0:
        return {"detail": f"Product '{product_name}' deleted from inventory"}
    elif updated:
        return {"detail": f"Product '{product_name}' updated successfully"}
    else:
        return {"detail": f"Product '{product_name}' added successfully"}

