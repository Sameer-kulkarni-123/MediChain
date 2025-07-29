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
    
# View full inventory for a retailer
async def get_inventory(retailer_id: str):
    retailer = await collection.find_one({"retailerId": retailer_id})
    if not retailer:
        raise HTTPException(status_code=404, detail="Retailer not found")
    return retailer.get("inventory", [])

# View inventory for a single product
async def get_inventory_item(retailer_id: str, product_name: str):
    retailer = await collection.find_one({"retailerId": retailer_id})
    if not retailer:
        raise HTTPException(status_code=404, detail="Retailer not found")

    inventory = retailer.get("inventory", [])
    for item in inventory:
        if item["productName"].lower() == product_name.lower():
            return item

    raise HTTPException(status_code=404, detail=f"Product '{product_name}' not found in inventory")


async def update_inventory_item(retailer_id: str, product_name: str, qty: int, reorder_level: int = None):
    retailer = await collection.find_one({"retailerId": retailer_id})
    if not retailer:
        raise HTTPException(status_code=404, detail="Retailer not found")

    inventory = retailer.get("inventory", [])
    updated = False

    # Loop through inventory to update or delete product
    for item in inventory:
        if item["productName"].lower() == product_name.lower():
            if qty <= 0:
                # Delete product if qty is 0 or less
                inventory.remove(item)
            else:
                # Update existing product
                item["qty"] = qty
                if reorder_level is not None:
                    item["reorderLevel"] = reorder_level
            updated = True
            break

    # If product not found and qty > 0, add it
    if not updated and qty > 0:
        inventory.append({
            "productName": product_name,
            "qty": qty,
            "reorderLevel": reorder_level or 0
        })

    result = await collection.update_one(
        {"retailerId": retailer_id},
        {"$set": {"inventory": inventory}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update inventory")

    # Prepare message for the response
    if qty <= 0:
        return {"detail": f"Inventory item '{product_name}' deleted successfully"}
    elif updated:
        return {"detail": f"Inventory item '{product_name}' updated successfully"}
    else:
        return {"detail": f"Inventory item '{product_name}' added successfully"}
