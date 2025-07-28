from fastapi import HTTPException
from models.shipment import ShipmentModel, ProductInDB
from config.db import db
from datetime import datetime
import random

collection = db.get_collection("shipments")
products_collection = db.get_collection("products")


# Helper: Generate unique shipmentId
async def generate_shipment_id():
    while True:
        suffix = random.randint(1000, 9999)
        shipment_id = f"ship_{suffix}"
        exists = await collection.find_one({"shipmentId": shipment_id})
        if not exists:
            return shipment_id


# Create a new shipment
async def create_shipment(shipment: ShipmentModel):
    shipment_dict = shipment.model_dump(exclude_unset=True)
    shipment_dict["shipmentId"] = await generate_shipment_id()
    shipment_dict["createdAt"] = datetime.utcnow()
    shipment_dict["updatedAt"] = datetime.utcnow()

    result = await collection.insert_one(shipment_dict)

    # Update product units
    if shipment.unitIds:
        await products_collection.update_many(
            {"productId": {"$in": shipment.unitIds}},
            {
                "$set": {
                    "batchId": shipment_dict["shipmentId"],
                    "location": shipment.location,
                    "inTransit": shipment.inTransit
                }
            }
        )

    new_shipment = await collection.find_one({"_id": result.inserted_id})
    return ProductInDB(**new_shipment)


# Get all shipments
async def all_shipments():
    docs = await collection.find().to_list(length=None)
    return [ProductInDB(**doc) for doc in docs]


# Get one shipment by shipmentId
async def one_shipment(shipment_id: str):
    doc = await collection.find_one({"shipmentId": shipment_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return ProductInDB(**doc)


# Forward a shipment (mark in transit)
async def forward_shipment(shipment_id: str, location: dict):
    result = await collection.update_one(
        {"shipmentId": shipment_id},
        {
            "$set": {
                "inTransit": True,
                "location": location,
                "updatedAt": datetime.utcnow()
            }
        }
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Shipment not found")

    return {"detail": "Shipment forwarded"}


# Receive a shipment (mark inTransit=false)
async def receive_shipment(shipment_id: str, location: dict):
    shipment = await collection.find_one({"shipmentId": shipment_id})
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    # Update shipment
    await collection.update_one(
        {"shipmentId": shipment_id},
        {
            "$set": {
                "inTransit": False,
                "location": location,
                "updatedAt": datetime.utcnow()
            }
        }
    )

    # Update product locations
    if shipment.get("unitIds"):
        await products_collection.update_many(
            {"productId": {"$in": shipment["unitIds"]}},
            {
                "$set": {
                    "location": location,
                    "inTransit": False
                }
            }
        )

    return {"detail": "Shipment received and products updated"}


# Split a shipment into sub-shipments
async def split_shipment(shipment_id: str, sub_shipments: list[ShipmentModel]):
    parent = await collection.find_one({"shipmentId": shipment_id})
    if not parent:
        raise HTTPException(status_code=404, detail="Parent shipment not found")

    # Mark parent as opened
    await collection.update_one(
        {"shipmentId": shipment_id},
        {"$set": {"status": "opened", "updatedAt": datetime.utcnow()}}
    )

    created_shipments = []
    for sub in sub_shipments:
        sub_data = sub.model_dump(exclude_unset=True)
        sub_data["parentShipmentId"] = shipment_id
        sub_data["shipmentId"] = await generate_shipment_id()
        sub_data["createdAt"] = datetime.utcnow()
        sub_data["updatedAt"] = datetime.utcnow()
        result = await collection.insert_one(sub_data)

        # Update product units
        if sub.unitIds:
            await products_collection.update_many(
                {"productId": {"$in": sub.unitIds}},
                {"$set": {"batchId": sub_data["shipmentId"]}}
            )

        created_shipments.append(await collection.find_one({"_id": result.inserted_id}))

    return [ProductInDB(**doc) for doc in created_shipments]
