from fastapi import APIRouter
from models.distributor import ProductInDB, DistributorModel, DistributorUpdateModel
from controllers import distributor_controller as controller

router = APIRouter()

@router.post("/", response_model=ProductInDB)
async def add_distributor(distributor : DistributorModel):
    return await controller.add_manufacturer(distributor)

@router.get("/", response_model=list[ProductInDB])
async def all_distributors():
    return await controller.all_distributors()

@router.get("/{distributor_id}", response_model=ProductInDB)
async def one_distributor(distributor_id):
    return await controller.one_distributor(distributor_id)

@router.delete("/{distributor_id}")
async def delete_distributor(distributor_id: str):
    return await controller.delete_distributor(distributor_id)

@router.patch("/{distributor_id}")
async def update_manufacturer(distributor_id: str, update_data: DistributorUpdateModel):
    return await controller.update_manufacturer(distributor_id, update_data)

@router.get("/{distributor_id}/inventory")
async def get_all_inventory(distributor_id: str):
    return await controller.get_all_inventory(distributor_id)

@router.get("/{distributor_id}/inventory/{product_name}")
async def get_inventory_item(distributor_id: str, product_name: str):
    return await controller.get_inventory_item(distributor_id, product_name)

@router.patch("/{distributor_id}/inventory/bulk")
async def bulk_update_inventory(distributor_id: str, updates: list[dict]):
    return await controller.bulk_update_inventory(distributor_id, updates)

@router.patch("/{distributor_id}/inventory/{product_name}")
async def update_inventory_item(distributor_id: str, product_name: str, qty: int):
    return await controller.update_inventory_item(distributor_id, product_name, qty)
