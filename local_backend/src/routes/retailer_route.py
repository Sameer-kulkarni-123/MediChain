from fastapi import APIRouter, Query
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

@router.get("/{retailer_walletAddress}", response_model=ProductInDB)
async def one_retailer(retailer_walletAddress: str):
    return await controller.one_retailers(retailer_walletAddress)

@router.delete("/{retailer_walletAddress}")
async def delete_retailer(retailer_walletAddress: str):
    return await controller.delete_retailer(retailer_walletAddress)

@router.patch("/{retailer_walletAddress}")
async def update_retailer(retailer_walletAddress: str, update_data: RetailerUpdateModel):
    return await controller.update_retailer(retailer_walletAddress, update_data)

# ---- Inventory Management ----

@router.get("/{retailer_walletAddress}/inventory")
async def get_inventory(retailer_walletAddress: str):
    return await controller.get_inventory(retailer_walletAddress)

@router.get("/{retailer_walletAddress}/inventory/{product_name}")
async def get_inventory_item(retailer_walletAddress: str, product_name: str):
    return await controller.get_inventory_item(retailer_walletAddress, product_name)

@router.patch("/{retailer_walletAddress}/inventory/bulk")
async def bulk_update_inventory(retailer_walletAddress: str, updates: List[dict]):
    return await controller.bulk_update_inventory(retailer_walletAddress, updates)

@router.patch("/{retailer_walletAddress}/inventory/{product_name}")
async def update_inventory_item(
    retailer_walletAddress: str,
    product_name: str,
    qty: int,
    reorder_level: int = None,
    product_ids: List[str] = Query(default=None)
):
    return await controller.update_inventory_item(
        retailer_walletAddress, product_name, qty, reorder_level, product_ids
    )
