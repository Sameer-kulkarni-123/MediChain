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

@router.get("/{manufacturer_id}", response_model=ProductInDB)
async def one_manufacturers(manufacturer_id):
    return await controller.one_manufacturers(manufacturer_id)

@router.delete("/{manufacturer_id}")
async def delete_manufacturer(manufacturer_id: str):
    return await controller.delete_manufacturer(manufacturer_id)

@router.patch("/{manufacturer_id}")
async def update_manufacturer(manufacturer_id: str, update_data: ManufacturerUpdateModel):
    return await controller.update_manufacturer(manufacturer_id, update_data)

