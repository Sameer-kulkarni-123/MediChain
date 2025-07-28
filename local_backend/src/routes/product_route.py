from fastapi import APIRouter
from models.product import ProductInDB, ProductModel, LocationModel
from controllers import product_controller as controller

router = APIRouter()

@router.post("/", response_model=ProductInDB)
async def create_product(product: ProductModel):
    return await controller.create_product(product)

@router.get("/", response_model=list[ProductInDB])
async def all_products():
    return await controller.all_products()


@router.get("/{product_id}", response_model=ProductInDB)
async def get_product_by_id(product_id: str):
    return await controller.get_product_by_id(product_id)


@router.get("/location/{entity_type}/{entity_id}", response_model=List[ProductInDB])
async def get_products_by_location(entity_type: str, entity_id: str):
    """
    Get all products at a given entity type and ID.
    Example: /products/location/distributor/65c4a1b6b1d2e
    """
    return await controller.get_products_by_location(entity_id, entity_type)


@router.get("/transit", response_model=List[ProductInDB])
async def get_products_in_transit():
    return await controller.get_products_in_transit()


@router.get("/batch/{batch_id}", response_model=List[ProductInDB])
async def get_products_by_batch(batch_id: str):
    return await controller.get_products_by_batch(batch_id)


@router.get("/search/{name}", response_model=List[ProductInDB])
async def get_products_by_name(name: str):
    return await controller.get_products_by_name(name)

#updates the loaction as well as the intransit
@router.patch("/{product_id}/location")
async def update_product_location(product_id: str, new_location: LocationModel, in_transit: bool = False):
    """
    Update a product's location and in-transit status.
    """
    return await controller.update_product_location(product_id, new_location, in_transit)