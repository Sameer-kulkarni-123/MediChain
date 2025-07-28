from fastapi import HTTPException
from models.order import ProductInDB, OrderModel
from config.db import db
from datetime import datetime
from bson import ObjectId

collection = db.get_collection("orders")

# Create an order
async def create_order(order: OrderModel):
    order_dict = order.model_dump(exclude_unset=True)
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
    if not ObjectId.is_valid(order_id):
        raise HTTPException(status_code=400, detail="Invalid order ID")
    
    doc = await collection.find_one({"_id": ObjectId(order_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    return ProductInDB(**doc)

# Update order status or details
async def update_order(order_id: str, update_data: dict):
    if not ObjectId.is_valid(order_id):
        raise HTTPException(status_code=400, detail="Invalid order ID")
    
    update_data["updatedAt"] = datetime.utcnow()
    
    result = await collection.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": update_data}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found or no changes made")
    return {"detail": "Order updated successfully"}

# Delete an order
async def delete_order(order_id: str):
    if not ObjectId.is_valid(order_id):
        raise HTTPException(status_code=400, detail="Invalid order ID")
    
    result = await collection.delete_one({"_id": ObjectId(order_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"detail": "Order deleted"}

# Update allocation (fulfill products)
async def update_allocation(order_id: str, fulfilled: bool):
    if not ObjectId.is_valid(order_id):
        raise HTTPException(status_code=400, detail="Invalid order ID")

    result = await collection.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"lineItems.allocations.fulfilled": fulfilled, "updatedAt": datetime.utcnow()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found or no changes made")
    return {"detail": f"Order allocation marked as {'fulfilled' if fulfilled else 'unfulfilled'}"}

# Get all orders for a specific retailer
async def orders_by_retailer(retailer_id: str):
    try:
        retailer_obj_id = ObjectId(retailer_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid retailer ID")

    cursor = collection.find({"retailerId": retailer_obj_id})
    orders = await cursor.to_list(length=None)
    if not orders:
        raise HTTPException(status_code=404, detail=f"No orders found for retailer {retailer_id}")
    
    return [ProductInDB(**order) for order in orders]


async def pending_orders():
    docs = await collection.find({"lineItems.allocations.fulfilled": False}).to_list(length=None)
    return [ProductInDB(**doc) for doc in docs]


async def pending_orders_by_retailer(retailer_id: str):
    try:
        retailer_obj_id = ObjectId(retailer_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid retailer ID")

    docs = await collection.find({
        "retailerId": retailer_obj_id,
        "lineItems.allocations.fulfilled": False
    }).to_list(length=None)

    if not docs:
        raise HTTPException(status_code=404, detail=f"No pending orders for retailer {retailer_id}")

    return [ProductInDB(**doc) for doc in docs]



async def add_path_to_order(order_id: str, allocation_index: int, path_data: list[dict]):
    """
    Add or update path for a specific allocation in an order.
    path_data: list of path segments (dicts) from optimizer
    """
    if not ObjectId.is_valid(order_id):
        raise HTTPException(status_code=400, detail="Invalid order ID")

    order = await collection.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    try:
        allocation = order["lineItems"]["allocations"][allocation_index]
    except (IndexError, KeyError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid allocation index")

    # Convert path_data into PathModel objects
    new_path = [PathModel(**p).dict() for p in path_data]

    # Update allocation
    allocation["path"] = new_path
    allocation["currentStage"] = 0
    allocation["fulfilled"] = False

    # Write back
    order["updatedAt"] = datetime.utcnow()
    result = await collection.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"lineItems.allocations": order["lineItems"]["allocations"], "updatedAt": order["updatedAt"]}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update path")

    return {"detail": "Path added successfully", "order_id": order_id}
