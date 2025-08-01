from fastapi import HTTPException
from models.order import ProductInDB, OrderModel, PathModel
from controllers import product_controller as controller

from config.db import db
from datetime import datetime
from bson import ObjectId
import random
import string

collection = db.get_collection("orders")

# Create an order

async def generate_unique_order_id():
    """
    Generates a unique orderId like 'OXXXX' where XXXX is a random 4-digit number.
    Checks MongoDB for uniqueness.
    """
    while True:
        order_id = "O" + "".join(random.choices(string.digits, k=4))
        existing = await collection.find_one({"orderId": order_id})
        if not existing:
            return order_id

async def create_order(order: OrderModel):
    order_dict = order.model_dump(exclude_unset=True)

    # Auto-generate orderId if not provided
    if not order_dict.get("orderId"):
        order_dict["orderId"] = await generate_unique_order_id()

    order_dict["createdAt"] = datetime.utcnow()
    order_dict["updatedAt"] = datetime.utcnow()

    result = await collection.insert_one(order_dict)
    new_order = await collection.find_one({"_id": result.inserted_id})
    return ProductInDB(**new_order)


# Get all orders
async def all_orders():
    orders = []
    async for docs in collection.find():
        orders.append(ProductInDB(**docs))
    return orders

# Get one order by ID
async def one_order(order_id: str):
    doc = await collection.find_one({"orderId": order_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    return ProductInDB(**doc)


# Update order status or details
async def update_order(order_id: str, update_data: dict):
    update_data["updatedAt"] = datetime.utcnow()

    result = await collection.update_one(
        {"orderId": order_id},
        {"$set": update_data}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found or no changes made")
    return {"detail": "Order updated successfully"}


# Delete an order
async def delete_order(order_id: str):
    result = await collection.delete_one({"orderId": order_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"detail": "Order deleted"}

# Update allocation (fulfill products)
async def update_allocation(order_id: str, fulfilled: bool):
    result = await collection.update_one(
        {"orderId": order_id},
        {"$set": {"lineItems.allocations.fulfilled": fulfilled, "updatedAt": datetime.utcnow()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found or no changes made")
    return {"detail": f"Order allocation marked as {'fulfilled' if fulfilled else 'unfulfilled'}"}


# Get all orders for a specific retailer
async def orders_by_retailer(retailer_walletAddress: str):
    cursor = collection.find({"retailerWalletAddress": retailer_walletAddress})
    orders = await cursor.to_list(length=None)

    if not orders:
        raise HTTPException(
            status_code=404, 
            detail=f"No orders found for retailer {retailer_walletAddress}"
        )

    return [ProductInDB(**order) for order in orders]



# Get all pending orders for a specific retailer
async def pending_orders_by_retailer(retailer_walletAddress: str):
    docs = await collection.find({
        "retailerWalletAddress": retailer_walletAddress,
        "lineItems.allocations.fulfilled": False
    }).to_list(length=None)

    if not docs:
        raise HTTPException(
            status_code=404, 
            detail=f"No pending orders for retailer {retailer_walletAddress}"
        )

    return [ProductInDB(**doc) for doc in docs]



# Update path for allocations with fromWalletAddress / toWalletAddress
async def add_path_to_order(order_id: str, allocation_index: int, path_data: list[dict]):
    order = await collection.find_one({"orderId": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    try:
        allocation = order["lineItems"]["allocations"][allocation_index]
    except (IndexError, KeyError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid allocation index")

    # Validate and convert path data
    new_path = [PathModel(**p).dict() for p in path_data]
    allocation["path"] = new_path
    allocation["currentStage"] = 0
    allocation["fulfilled"] = False

    order["updatedAt"] = datetime.utcnow()
    result = await collection.update_one(
        {"orderId": order_id},
        {
            "$set": {
                "lineItems.allocations": order["lineItems"]["allocations"],
                "updatedAt": order["updatedAt"]
            }
        }
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update path")

    return {"detail": "Path added successfully", "order_id": order_id}


async def orders_by_distributor(distributor_walletAddress: str):
    """
    Fetch all orders where the distributor is either the sender or receiver 
    in the allocations.path array.
    """
    cursor = collection.find({
        "lineItems.allocations.path": {
            "$elemMatch": {
                "fromWalletAddress": distributor_walletAddress
            }
        }
    })

    orders = await cursor.to_list(length=None)

    if not orders:
        raise HTTPException(
            status_code=404,
            detail=f"No orders found for distributor {distributor_walletAddress}"
        )

    return [ProductInDB(**order) for order in orders]

# Get all pending orders for a specific distributor
async def pending_orders_by_distributor(distributor_walletAddress: str):
    """
    Pending orders where distributor exists in path and allocations.fulfilled = False
    """
    docs = await collection.find({
        "lineItems.allocations.fulfilled": False,
        "lineItems.allocations.path": {
            "$elemMatch": {
                "fromWalletAddress": distributor_walletAddress
            }
        }
    }).to_list(length=None)

    if not docs:
        raise HTTPException(
            status_code=404,
            detail=f"No pending orders found for distributor {distributor_walletAddress}"
        )

    return [ProductInDB(**doc) for doc in docs]

# Get new orders (status = created) for a specific distributor
async def new_orders_by_distributor(distributor_walletAddress: str):
    """
    Fetch new orders (status = 'created') where the distributor is in allocations.path
    """
    docs = await collection.find({
        "status": "created",   # only new orders
        "lineItems.allocations.path": {
            "$elemMatch": {
                "fromWalletAddress": distributor_walletAddress
            }
        }
    }).to_list(length=None)

    if not docs:
        raise HTTPException(
            status_code=404,
            detail=f"No new orders found for distributor {distributor_walletAddress}"
        )

    return [ProductInDB(**doc) for doc in docs]


# Update allocation fulfilled for a specific allocation
async def update_allocations_fulfilled_by_products(product_ids: list[str]):
    if not product_ids:
        raise HTTPException(status_code=400, detail="No product IDs provided")

    updated_orders = []

    for product_id in product_ids:
        # Find product
        product = await controller.get_product_by_id(product_id)

        # Find the order containing this productId
        order = await collection.find_one({
            "lineItems.allocations.productUnitIds": product_id
        })
        if not order:
            continue

        allocations = order["lineItems"]["allocations"]
        updated = False

        # Update ALL matching allocations
        for allocation in allocations:
            if product_id in allocation.get("productUnitIds", []):
                destination_wallet = allocation["path"]["toWalletAddress"]
                allocation["fulfilled"] = (
                    product.location is not None
                    and product.location.walletAddress == destination_wallet
                    and not product.inTransit
                )
                updated = True

        if not updated:
            continue

        # Update order status (completed if all fulfilled)
        all_fulfilled = all(a["fulfilled"] for a in allocations)
        order_status = "completed" if all_fulfilled else "in-transit"
        order["updatedAt"] = datetime.utcnow()

        # Save back to DB
        await collection.update_one(
            {"_id": order["_id"]},
            {
                "$set": {
                    "lineItems.allocations": allocations,
                    "status": order_status,
                    "updatedAt": order["updatedAt"],
                }
            }
        )

        updated_orders.append({
            "orderId": order["orderId"],
            "updatedProductId": product_id,
            "orderStatus": order_status
        })

    if not updated_orders:
        raise HTTPException(status_code=404, detail="No matching orders/allocations found")

    return {"updated": updated_orders}



# Update order status using product IDs
async def update_order_status_by_products(product_ids: list[str], status: str):
    valid_statuses = ["created", "in-transit", "completed", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    if not product_ids:
        raise HTTPException(status_code=400, detail="No product IDs provided")

    updated_orders = []

    for product_id in product_ids:
        # Find the order containing this productId
        order = await collection.find_one({
            "lineItems.allocations.productUnitIds": product_id
        })
        if not order:
            continue

        # Update the order status
        result = await collection.update_one(
            {"_id": order["_id"]},
            {"$set": {"status": status, "updatedAt": datetime.utcnow()}}
        )

        if result.modified_count > 0:
            updated_orders.append(order["orderId"])

    if not updated_orders:
        raise HTTPException(status_code=404, detail="No matching orders found")

    return {"updatedOrders": updated_orders, "newStatus": status}

