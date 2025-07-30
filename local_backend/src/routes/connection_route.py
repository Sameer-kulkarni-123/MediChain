from fastapi import APIRouter, Query
from typing import List, Dict, Any
from models.connection import ConnectionModel, ProductInDB, ConnectionUpdateModel
from controllers import connection_controller as controller

router = APIRouter()

@router.post("/", response_model=ProductInDB)
async def add_connection(connection: ConnectionModel):
    return await controller.add_connection(connection)

@router.get("/from/{from_walletAddress}", response_model=List[ProductInDB])
async def get_connection_from_id(from_walletAddress: str, to_type: str = Query(None)):
    return await controller.get_connection_from_id(from_walletAddress, to_type)

@router.get("/to/{to_walletAddress}", response_model=List[ProductInDB])
async def get_connection_to_id(to_walletAddress: str, from_type: str = Query(None)):
    return await controller.get_connection_to_id(to_walletAddress, from_type)

@router.get("/all/{entity_walletAddress}", response_model=List[ProductInDB])
async def get_connections_for_entity(entity_walletAddress: str):
    return await controller.get_connections_for_entity(entity_walletAddress)

@router.delete("/{from_walletAddress}/{to_walletAddress}")
async def delete_connection(from_walletAddress: str, to_walletAddress: str):
    return await controller.delete_connection(from_walletAddress, to_walletAddress)

@router.patch("/{from_walletAddress}/{to_walletAddress}")
async def update_connection(from_walletAddress: str, to_walletAddress: str, update_data: ConnectionUpdateModel):
    return await controller.update_connection(from_walletAddress, to_walletAddress, update_data)


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
    Returns adjacency list:
    {
        "walletAddress1": [{"to": "walletAddress2", "weight": cost}, ...],
        ...
    }
    """
    return await controller.get_graph()