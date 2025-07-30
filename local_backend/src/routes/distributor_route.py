from fastapi import APIRouter
from models.distributor import ProductInDB, DistributorModel, DistributorUpdateModel
from controllers import distributor_controller as controller

router = APIRouter()

@router.post("/", response_model=ProductInDB)
async def add_distributor(distributor : DistributorModel):
    return await controller.add_distributor(distributor)

@router.get("/", response_model=list[ProductInDB])
async def all_distributors():
    return await controller.all_distributors()

@router.get("/{distributor_walletAddress}", response_model=ProductInDB)
async def one_distributor(distributor_walletAddress):
    return await controller.one_distributor(distributor_walletAddress)

@router.delete("/{distributor_walletAddress}")
async def delete_distributor(distributor_walletAddress: str):
    return await controller.delete_distributor(distributor_walletAddress)

@router.patch("/{distributor_walletAddress}")
async def update_distributor(distributor_walletAddress: str, update_data: DistributorUpdateModel):
    return await controller.update_distributor(distributor_walletAddress, update_data)

@router.get("/{distributor_walletAddress}/inventory")
async def get_all_inventory(distributor_walletAddress: str):
    return await controller.get_all_inventory(distributor_walletAddress)

@router.get("/{distributor_walletAddress}/inventory/{product_name}")
async def get_inventory_item(distributor_walletAddress: str, product_name: str):
    return await controller.get_inventory_item(distributor_walletAddress, product_name)

@router.patch("/{distributor_walletAddress}/inventory/bulk")
async def bulk_update_inventory(distributor_walletAddress: str, updates: list[dict]):
    return await controller.bulk_update_inventory(distributor_walletAddress, updates)

@router.patch("/{distributor_walletAddress}/inventory/{product_name}")
async def update_inventory_item(distributor_walletAddress: str, product_name: str, qty: int, product_ids: list[str],reorder_level: int = None):
    return await controller.update_inventory_item(distributor_walletAddress, product_name, qty, product_ids, reorder_level)
