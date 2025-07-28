from fastapi import HTTPException
from models.shipment import ShipmentModel, ProductInDB
from config.db import db
from datetime import datetime
from bson import ObjectId

collection = db.get_collection("shipments")
products_collection = db.get_collection("products")

# Create a new shipment (manufacturer packs crate)
async def create_shipment(shipment: ShipmentModel):
    shipment_dict = shipment.model_dump(exclude_unset=True)
    shipment_dict["createdAt"] = datetime.utcnow()
    shipment_dict["updatedAt"] = datetime.utcnow()

    result = await collection.insert_one(shipment_dict)

    # Update all product units' batch and location
    if shipment.unitIds:
        await products_collection.update_many(
            {"_id": {"$in": shipment.unitIds}},
            {
                "$set": {
                    "batchId": result.inserted_id,
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


# Get one shipment by ID
async def one_shipment(shipment_id: str):
    if not ObjectId.is_valid(shipment_id):
        raise HTTPException(status_code=400, detail="Invalid shipment ID")
    doc = await collection.find_one({"_id": ObjectId(shipment_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return ProductInDB(**doc)


# Forward a shipment (mark in transit, update location)
async def forward_shipment(shipment_id: str, location: dict):
    if not ObjectId.is_valid(shipment_id):
        raise HTTPException(status_code=400, detail="Invalid shipment ID")

    result = await collection.update_one(
        {"_id": ObjectId(shipment_id)},
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


# Receive a shipment (mark inTransit=false, update product locations)
async def receive_shipment(shipment_id: str, location: dict):
    if not ObjectId.is_valid(shipment_id):
        raise HTTPException(status_code=400, detail="Invalid shipment ID")

    shipment = await collection.find_one({"_id": ObjectId(shipment_id)})
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    # Update shipment
    await collection.update_one(
        {"_id": ObjectId(shipment_id)},
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
            {"_id": {"$in": shipment["unitIds"]}},
            {
                "$set": {
                    "location": location,
                    "inTransit": False
                }
            }
        )

    return {"detail": "Shipment received and products updated"}


# Split a shipment into sub-shipments (distributor)
async def split_shipment(shipment_id: str, sub_shipments: list[ShipmentModel]):
    if not ObjectId.is_valid(shipment_id):
        raise HTTPException(status_code=400, detail="Invalid parent shipment ID")

    parent = await collection.find_one({"_id": ObjectId(shipment_id)})
    if not parent:
        raise HTTPException(status_code=404, detail="Parent shipment not found")

    # Mark parent shipment as opened
    await collection.update_one(
        {"_id": ObjectId(shipment_id)},
        {"$set": {"status": "opened", "updatedAt": datetime.utcnow()}}
    )

    created_shipments = []
    for sub in sub_shipments:
        sub_data = sub.model_dump(exclude_unset=True)
        sub_data["parentShipmentId"] = ObjectId(shipment_id)
        sub_data["createdAt"] = datetime.utcnow()
        sub_data["updatedAt"] = datetime.utcnow()
        result = await collection.insert_one(sub_data)

        # Update product units to point to new sub-shipment
        if sub.unitIds:
            await products_collection.update_many(
                {"_id": {"$in": sub.unitIds}},
                {"$set": {"batchId": result.inserted_id}}
            )

        created_shipments.append(await collection.find_one({"_id": result.inserted_id}))

    return [ProductInDB(**doc) for doc in created_shipments]
