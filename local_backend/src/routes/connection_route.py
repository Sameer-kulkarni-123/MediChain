from fastapi import APIRouter, Query
from typing import List, Dict, Any
from models.connection import ConnectionModel, ProductInDB, ConnectionUpdateModel
from controllers import connection_controller as controller

router = APIRouter()

@router.post("/", response_model=ProductInDB)
async def add_connection(connection: ConnectionModel):
    return await controller.add_connection(connection)

@router.get("/from/{from_id}", response_model=List[ProductInDB])
async def get_connection_from_id(from_id: str, to_type: str = Query(None)):
    return await controller.get_connection_from_id(from_id, to_type)

@router.get("/to/{to_id}", response_model=List[ProductInDB])
async def get_connection_to_id(to_id: str, from_type: str = Query(None)):
    return await controller.get_connection_to_id(to_id, from_type)

@router.get("/all/{entity_id}", response_model=List[ProductInDB])
async def get_connections_for_entity(entity_id: str):
    return await controller.get_connections_for_entity(entity_id)

@router.delete("/{from_id}/{to_id}")
async def delete_connection(from_id: str, to_id: str):
    return await controller.delete_connection(from_id, to_id)

@router.patch("/{from_id}/{to_id}")
async def update_connection(from_id: str, to_id: str, update_data: ConnectionUpdateModel):
    return await controller.update_connection(from_id, to_id, update_data)


@router.get("/all", response_model=List[ProductInDB])
async def get_all_connections(
    from_type: str = Query(None), 
    to_type: str = Query(None)
):
    """
    Get all connections filtered by from_type and/or to_type.
    Example: /connections/all?from_type=manufacturer&to_type=distributor
    """
    return await controller.get_all_connections(from_type, to_type)


@router.get("/graph", response_model=Dict[str, List[Dict[str, Any]]])
async def get_graph():
    """
    Get a graph representation of all connections.
    Returns adjacency list format:
    {
        "fromID1": [{"to": "toID1", "weight": cost}, {"to": "toID2", "weight": cost}],
        ...
    }
    """
    return await controller.get_graph()