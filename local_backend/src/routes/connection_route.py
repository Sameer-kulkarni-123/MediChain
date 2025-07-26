from fastapi import APIRouter
from starlette.routing import Route
from models.connection import ConnectionModel, ProductInDB
from controllers import connection_controller as  controller 

router = APIRouter()

@router.post("/", response_model=ProductInDB)
async def add_connection(connection: ConnectionModel):
    return await controller.add_connection(connection)

@router.get("/from/{from_id}", response_model=ProductInDB)
async def get_connection_from_id(from_id):
    return await controller.get_connection_from_id(from_id)


@router.get("/to/{to_id}", response_model=ProductInDB)
async def get_connection_to_id(to_id):
    return await controller.get_connection_from_id(to_id)

    
@router.get("/all/{entity_id}", response_model=ProductInDB)
async def get_connections_for_entity(entity_id):
    return await controller.get_connection_from_id(entity_id)


@router.delete("/{to_id}")
async def delete_distributor(distributor_id: str):
    return await controller.delete_distributor(distributor_id)

@router.patch("/{distributor_id}")
async def update_manufacturer(distributor_id: str, update_data: DistributorUpdateModel):
    return await controller.update_manufacturer(distributor_id, update_data)

