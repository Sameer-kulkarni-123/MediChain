from controllers.retailer_controller import all_retailers
from controllers.distributor_controller import all_distributors
from controllers.connection_controller import get_all_connections
from controllers.product_controller import get_products_by_name
from optimizer.utils import build_weighted_graph, shortest_path
from controllers.manufacturer_controller import all_manufacturers

async def get_all_inventories(product_name):
    inventories = {}
    retailers = await all_retailers()
    distributors = await all_distributors()
    for entity in retailers + distributors:
        wallet = entity.walletAddress
        items = [
            item for item in getattr(entity, 'inventory', [])
            if getattr(item, 'productName', '').lower() == product_name.lower()
        ]
        if items:
            inventories[wallet] = items
    return inventories

async def get_weights_product(product_name):
    products = await get_products_by_name(product_name)
    for product in products:
        product_weight = product.unitWeight
    
    return product_weight


async def suggest_wait_strategy(graph, inventories, product_name, target_wallet, cold_storage=False):
    if cold_storage:
        return {
            "message": "Product requires cold storage, but no suitable nodes support cold storage at this time."
        }
    if not inventories:
        return {
            "message": f"Product '{product_name}' not found in the system."
        }
    return {
        "message": f"Product '{product_name}' is currently out of stock across the network."
    }

async def optimize_supply_path(product_name, required_qty, target_wallet, is_cold_storage=False):
    product_weight = await get_weights_product(product_name)
    connections = await get_all_connections()
    connections = [conn.dict() if hasattr(conn, "dict") else conn for conn in connections]
    graph = build_weighted_graph(connections, product_weight,required_qty )
    inventories = await get_all_inventories(product_name)

    # CASE: Product not found at all
    if not inventories:
        return {
            "status": "partial",
            "wait_recommendation": {
                "message": f"Product '{product_name}' not found in the system."
            }
        }

    # Build source nodes with cold storage logic, SKIP the target_wallet itself!
    source_nodes = []
    for wallet, items in inventories.items():
        if wallet == target_wallet:
            continue  # Do not consider the target's own stock as a source
        available_items = [item for item in items if not getattr(item, 'inTransit', False)]
        # Cold storage check
        if is_cold_storage and not getattr(items[0], 'supportsColdStorage', False):
            continue
        total_available = sum(getattr(item, 'qtyRemaining', 1) for item in available_items)
        product_ids = []
        for item in available_items:
            product_ids.extend(getattr(item, 'productIds', []))
        if total_available > 0:
            source_nodes.append({
                "wallet": wallet,
                "available_qty": total_available,
                "product_ids": product_ids,
                "supportsColdStorage": getattr(items[0], 'supportsColdStorage', False),
            })

    
    # CASE: No available stock (with/without cold storage)
    if not source_nodes:
        # Step 7: Check manufacturers who can produce the product
        manufacturers = await all_manufacturers()
        available_manufacturers = [
            m for m in manufacturers if product_name in (m.productsProduced or [])
        ]
        if available_manufacturers:
            manufacturer_info = [
                {
                    "manufacturer": m.name,
                    "wallet": m.walletAddress,
                    "production_time_days": next(
                        (pt.days for pt in m.productionTimes if pt.productName == product_name),
                        "Unknown"
                    )
                }
                for m in available_manufacturers
            ]
            return {
                "status": "partial",
                "wait_recommendation": {
                    "message": f"No stock found, but manufacturers are available to produce '{product_name}'.",
                    "producers": manufacturer_info
                }
            }

        msg = (
            "Product requires cold storage, but no suitable nodes support cold storage at this time."
            if is_cold_storage else
            f"Product '{product_name}' is currently out of stock across the network and not produced by any manufacturer."
        )
        return {
            "status": "partial",
            "wait_recommendation": {
                "message": msg
            }
        }


    # Try to fulfill from a single node if possible (prefer fewer hops, more available)
    single_node_candidates = []
    for src in source_nodes:
        if src["available_qty"] >= required_qty:
            result = shortest_path(graph, src['wallet'], target_wallet, return_time=is_cold_storage)
            if result and result[0] is not None:
                path, cost, time = result
                hops = len(path)
                single_node_candidates.append({
                    "wallet": src['wallet'],
                    "path": path,
                    "cost": cost,
                    "time": time,
                    "priority": (cost if not is_cold_storage else time, hops, -src["available_qty"]),
                    "product_ids": src['product_ids'][:required_qty],
                    "available_qty": src['available_qty']
                })
    if single_node_candidates:
        # Prefer lowest cost/time, then fewer hops, then more available
        single_node_candidates.sort(key=lambda x: x["priority"])
        best = single_node_candidates[0]
        return {
            "allocations": [{
                "source": best["wallet"],
                "path": best["path"],
                "product_ids": best["product_ids"],
                "total_cost": best["cost"],
                "allocated_qty": required_qty
            }],
            "status": "complete"
        }

    # Otherwise, allocate from multiple nodes (partial allowed)
    # Score all sources by cost/time, hops, and available qty
    scored_sources = []
    for src in source_nodes:
        result = shortest_path(graph, src['wallet'], target_wallet, return_time=is_cold_storage)
        if not result or result[0] is None:
            continue
        path, cost, time = result
        hops = len(path)
        scored_sources.append({
            "wallet": src['wallet'],
            "path": path,
            "cost": cost,
            "time": time,
            "priority": (cost if not is_cold_storage else time, hops, -src["available_qty"]),
            "product_ids": src['product_ids'],
            "available_qty": src['available_qty']
        })
    scored_sources.sort(key=lambda x: x["priority"])

    allocations = []
    qty_remaining = required_qty
    for source in scored_sources:
        if qty_remaining <= 0:
            break
        take_qty = min(qty_remaining, source['available_qty'])
        allocations.append({
            "source": source['wallet'],
            "path": source['path'],
            "product_ids": source['product_ids'][:take_qty],
            "total_cost": source['cost'],
            "allocated_qty": take_qty
        })
        qty_remaining -= take_qty

    # CASE: Complete fulfillment across multiple nodes
    if qty_remaining == 0:
        return {
            "allocations": allocations,
            "status": "complete"
        }

    # CASE: Partial fulfillment
    if allocations:
        return {
            "allocations": allocations,
            "status": "partial",
            "wait_recommendation": {
                "message": f"Only {required_qty - qty_remaining} units available for {product_name}. Please wait for restock."
            }
        }

    # CASE: No allocations possible (should not reach here if source_nodes is not empty)
    wait_plan = await suggest_wait_strategy(graph, inventories, product_name, target_wallet, cold_storage=is_cold_storage)
    return {
        "allocations": [],
        "status": "partial",
        "wait_recommendation": wait_plan
    }