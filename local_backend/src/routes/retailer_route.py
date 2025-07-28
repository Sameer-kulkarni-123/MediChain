from fastapi import APIRouter
from typing import List
from models.retailer import ProductInDB, RetailerModel, RetailerUpdateModel
from controllers import retailer_controller as controller

router = APIRouter()

# ---- Retailer CRUD ----
@router.post("/", response_model=ProductInDB)
async def add_retailer(retailer: RetailerModel):
    return await controller.add_retailer(retailer)

@router.get("/", response_model=List[ProductInDB])
async def all_retailers():
    return await controller.all_retailers()

@router.get("/{retailer_id}", response_model=ProductInDB)
async def one_retailers(retailer_id: str):
    return await controller.one_retailers(retailer_id)

@router.delete("/{retailer_id}")
async def delete_retailer(retailer_id: str):
    return await controller.delete_retailer(retailer_id)

@router.patch("/{retailer_id}")
async def update_retailer(retailer_id: str, update_data: RetailerUpdateModel):
    return await controller.update_retailer(retailer_id, update_data)


# ---- Inventory Management ----

# View full inventory for a retailer
@router.get("/{retailer_id}/inventory")
async def get_inventory(retailer_id: str):
    return await controller.get_inventory(retailer_id)

# View a single product in inventory
@router.get("/{retailer_id}/inventory/{product_name}")
async def get_inventory_item(retailer_id: str, product_name: str):
    return await controller.get_inventory_item(retailer_id, product_name)

# Bulk update inventory (add/update/delete multiple items)
@router.patch("/{retailer_id}/inventory/bulk")
async def bulk_update_inventory(retailer_id: str, updates: List[dict]):
    return await controller.bulk_update_inventory(retailer_id, updates)

# Add/Update/Delete a single product in inventory (qty 0 deletes it)
@router.patch("/{retailer_id}/inventory/{product_name}")
async def update_inventory_item(
    retailer_id: str,
    product_name: str,
    qty: int,
    reorder_level: int = None
):
    return await controller.update_inventory_item(retailer_id, product_name, qty, reorder_level)
