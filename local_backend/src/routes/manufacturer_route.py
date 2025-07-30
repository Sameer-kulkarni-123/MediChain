from fastapi import APIRouter
from models.manufacturer import ProductInDB, ManufacturerModel, ManufacturerUpdateModel
from controllers import manufacturer_controller as controller

router = APIRouter()

@router.post("/", response_model=ProductInDB)
async def add_manufacturer(manufacturer: ManufacturerModel):
    print("Add Manufacturer function called")
    return await controller.add_manufacturer(manufacturer)

@router.get("/", response_model=list[ProductInDB])
async def all_manufacturers():
    return await controller.all_manufacturers()

@router.get("/{manufacturer_walletAddress}", response_model=ProductInDB)
async def one_manufacturers(manufacturer_walletAddress):
    return await controller.one_manufacturers(manufacturer_walletAddress)

@router.delete("/{manufacturer_walletAddress}")
async def delete_manufacturer(manufacturer_walletAddress: str):
    return await controller.delete_manufacturer(manufacturer_walletAddress)

@router.patch("/{manufacturer_walletAddress}")
async def update_manufacturer(manufacturer_walletAddress: str, update_data: ManufacturerUpdateModel):
    return await controller.update_manufacturer(manufacturer_walletAddress, update_data)

