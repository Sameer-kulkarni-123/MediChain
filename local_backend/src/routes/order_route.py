from fastapi import APIRouter, Query 
from models.order import OrderModel, ProductInDB, PendingAllocation, FulfillRequest
from controllers import order_controller as controller

router = APIRouter()

@router.post("/", response_model=ProductInDB)
async def create_order(order: OrderModel):
    return await controller.create_order(order)

@router.get("/", response_model=list[ProductInDB])
async def all_orders():
    return await controller.all_orders()

@router.get("/retailer/{retailer_walletAddress}", response_model=list[ProductInDB])
async def get_orders_by_retailer(retailer_walletAddress: str):
    return await controller.orders_by_retailer(retailer_walletAddress)


# Get pending orders for a specific retailer
@router.get("/pending/{retailer_walletAddress}", response_model=list[ProductInDB])
async def get_pending_orders_by_retailer(retailer_walletAddress: str):
    return await controller.pending_orders_by_retailer(retailer_walletAddress)

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
    path_data example:
    [
        {
          "fromType":"manufacturer",
          "fromWalletAddress":"0x123",
          "toType":"distributor",
          "toWalletAddress":"0x456",
          "etaDays":3.0
        }
    ]
    """
    return await controller.add_path_to_order(order_id, allocation_index, path_data)


@router.get("/distributor/{distributor_walletAddress}", response_model=list[ProductInDB])
async def get_orders_by_distributor(distributor_walletAddress: str):
    return await controller.orders_by_distributor(distributor_walletAddress)


@router.get("/pending/distributor/{distributor_walletAddress}", response_model=list[ProductInDB])
async def get_pending_orders_by_distributor(distributor_walletAddress: str):
    return await controller.pending_orders_by_distributor(distributor_walletAddress)


@router.get("/new/distributor/{distributor_walletAddress}", response_model=list[ProductInDB])
async def get_new_orders_by_distributor(distributor_walletAddress: str):
    return await controller.new_orders_by_distributor(distributor_walletAddress)



# Update allocations & status based on product IDs
@router.patch("/allocations/fulfilled")
async def update_allocations_fulfilled(product_ids: list[str]):
    """
    Update allocations fulfillment and order status based on product IDs.
    """
    return await controller.update_allocations_fulfilled_by_products(product_ids)


# Update order status
@router.patch("/status/by-products")
async def set_order_status_by_products(product_ids: list[str], status: str):
    """
    Update order status using product IDs (provided by user).
    """
    return await controller.update_order_status_by_products(product_ids, status)


@router.patch("/fulfill/data", response_model=dict)
async def fulfill_allocations_for_distributor(
    data: FulfillRequest
):
    return await controller.fulfill_distributor_allocations(data.distributor_wallet, data.order_id)


@router.get("/pending-allocations/{distributor_walletAddress}", response_model=list[PendingAllocation])
async def get_pending_allocations(distributor_walletAddress: str):
    return await controller.get_pending_allocations_for_distributor(distributor_walletAddress)


