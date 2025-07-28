from fastapi import APIRouter
from models.shipment import ShipmentModel, ProductInDB
from controllers import shipment_controller as controller

router = APIRouter()

# Create a shipment
@router.post("/", response_model=ProductInDB)
async def create_shipment(shipment: ShipmentModel):
    return await controller.create_shipment(shipment)

# Get all shipments
@router.get("/", response_model=list[ProductInDB])
async def all_shipments():
    return await controller.all_shipments()

# Get a single shipment
@router.get("/{shipment_id}", response_model=ProductInDB)
async def one_shipment(shipment_id: str):
    return await controller.one_shipment(shipment_id)

# Forward shipment (mark in transit)
@router.patch("/{shipment_id}/forward")
async def forward_shipment(shipment_id: str, location: dict):
    return await controller.forward_shipment(shipment_id, location)

# Receive shipment (mark delivered and update products)
@router.patch("/{shipment_id}/receive")
async def receive_shipment(shipment_id: str, location: dict):
    return await controller.receive_shipment(shipment_id, location)

# Split shipment into sub-shipments
@router.post("/{shipment_id}/split", response_model=list[ProductInDB])
async def split_shipment(shipment_id: str, sub_shipments: list[ShipmentModel]):
    return await controller.split_shipment(shipment_id, sub_shipments)
