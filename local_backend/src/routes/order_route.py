from fastapi import APIRouter
from models.order import OrderModel, ProductInDB
from controllers import order_controller as controller

router = APIRouter()

@router.post("/", response_model=ProductInDB)
async def create_order(order: OrderModel):
    return await controller.create_order(order)

@router.get("/", response_model=list[ProductInDB])
async def all_orders():
    return await controller.all_orders()


@router.get("/retailer/{retailer_id}", response_model=list[ProductInDB])
async def get_orders_by_retailer(retailer_id: str):
    return await controller.orders_by_retailer(retailer_id)

# Get all pending orders
@router.get("/pending", response_model=list[ProductInDB])
async def get_all_pending_orders():
    return await controller.pending_orders()

# Get pending orders for a specific retailer
@router.get("/pending/{retailer_id}", response_model=list[ProductInDB])
async def get_pending_orders_by_retailer(retailer_id: str):
    return await controller.pending_orders_by_retailer(retailer_id)


@router.get("/{order_id}", response_model=ProductInDB)
async def one_order(order_id: str):
    return await controller.one_order(order_id)

@router.patch("/{order_id}")
async def update_order(order_id: str, update_data: dict):
    return await controller.update_order(order_id, update_data)


@router.delete("/{order_id}")
async def delete_order(order_id: str):
    return await controller.delete_order(order_id)


@router.patch("/{order_id}/allocation")
async def update_allocation(order_id: str, fulfilled: bool):
    return await controller.update_allocation(order_id, fulfilled)


@router.patch("/{order_id}/allocations/{allocation_index}/path")
async def add_path(order_id: str, allocation_index: int, path_data: list[dict]):
    """
    Add optimizer-generated path to the allocation.
    path_data = [
        {
          "fromType":"manufacturer",
          "fromId":"M111",
          "toType":"distributor",
          "toId":"D202",
          "etaDays":3.0
        },
        {
          "fromType":"distributor",
          "fromId":"D202",
          "toType":"retailer",
          "toId":"R303",
          "etaDays":1.5
        }
    ]
    """
    return await controller.add_path_to_order(order_id, allocation_index, path_data)

