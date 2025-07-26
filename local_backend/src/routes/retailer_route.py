from fastapi import APIRouter
from models.retailer import ProductInDB, RetailerModel, RetailerUpdateModel
from controllers import retailer_controller as controller

router = APIRouter()

@router.post("/", response_model=ProductInDB)
async def add_retailer(retailer : RetailerModel):
    return await controller.add_retailer(retailer)

@router.get("/", response_model=list[ProductInDB])
async def all_retailers():
    return await controller.all_retailers()

@router.get("/{retailer_id}", response_model=ProductInDB)
async def one_retailers(retailer_id):
    return await controller.one_retailers(retailer_id)

@router.delete("/{retailer_id}")
async def delete_retailer(retailer_id: str):
    return await controller.delete_retailer(retailer_id)

@router.patch("/{retailer_id}")
async def update_retailer(retailer_id: str, update_data: RetailerUpdateModel):
    return await controller.update_retailer(retailer_id, update_data)
