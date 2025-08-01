# filepath: c:\Users\glaks\Desktop\Hackathon\PROJECT2\MediChain\local_backend\src\routes\optimizer_route.py

from fastapi import APIRouter, Query
from optimizer.algorithm import optimize_supply_path

router = APIRouter()

@router.get("/test-optimize")
async def test_optimize(
    product_name: str = Query("Paracetamol 500mg"),  # exact name from your data
    required_qty: int = Query(10),                   # choose a test quantity
    target_wallet: str = Query("0xR1"),              # valid wallet from your retailers
    is_cold_storage: bool = Query(False)             # test with normal first
):
    result = await optimize_supply_path(
        product_name=product_name,
        required_qty=required_qty,
        target_wallet=target_wallet,
        is_cold_storage=is_cold_storage
    )
    return result
