from fastapi import APIRouter
from models.product import ProductInDB, ProductModel
from controllers import product_controller as controller

router = APIRouter()

@router.post("/", response_model=ProductInDB)
async def create_product(product: ProductModel):
    return await controller.create_product(product)

@router.get("/", response_model=list[ProductInDB])
async def all_products():
    return await controller.all_products()
