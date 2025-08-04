from controllers.retailer_controller import all_retailers
from controllers.distributor_controller import all_distributors
from controllers.connection_controller import get_all_connections
from controllers.product_controller import get_products_by_name
from optimizer.utils import build_weighted_graph, shortest_path
from controllers.manufacturer_controller import all_manufacturers
from controllers.product_controller import get_product_by_id


def calculate_eta(path, connections_lookup):
    """
    Calculate total ETA (in days) by summing transitTimeDays for each edge in the path.
    """
    total_days = 0
    for i in range(len(path) - 1):
        from_node = path[i]
        to_node = path[i + 1]
        # lookup for the edge in connections
        edge_key = (from_node, to_node)
        if edge_key in connections_lookup:
            total_days += connections_lookup[edge_key]
    return total_days

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
    
    if not products:
        # Decide what to do if the product is not found
        # Either return a default value or raise an error
        return 1  # default weight
    
    # If you expect a single product match:
    return products[0].unitWeight


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
    # print(f"[INPUT] product_name={product_name}, required_qty={required_qty}, target_wallet={target_wallet}, cold_storage={is_cold_storage}")

    product_weight = await get_weights_product(product_name)
    # print(f"[DEBUG] Product weight: {product_weight}")

    connections = await get_all_connections()
    connections = [conn.dict() if hasattr(conn, "dict") else conn for conn in connections]
    # print(f"[DEBUG] Total connections retrieved: {len(connections)}")

    # Build a lookup for transit times (place here)
    connections_lookup = {}
    for conn in connections:
        key = (conn["fromWalletAddress"], conn["toWalletAddress"])
        connections_lookup[key] = conn.get("transitTimeDays", 0)

    graph = build_weighted_graph(connections, product_weight, required_qty)
    # print(f"[DEBUG] Graph nodes: {len(graph)}")
    # for node, edges in graph.items():
    #     print(f"    {node} -> {edges}")

    inventories = await get_all_inventories(product_name)
    # print(f"[DEBUG] Inventories found for '{product_name}': {list(inventories.keys())}")

    if not inventories:
        # print("[WARN] No inventories found for product!")
        return {
            "status": "partial",
            "wait_recommendation": {
                "message": f"Product '{product_name}' not found in the system."
            }
        }

    # Get all retailers and distributors for entity type check
    retailers = await all_retailers()
    distributors = await all_distributors()
    retailer_wallets = {r.walletAddress for r in retailers}
    distributor_wallets = {d.walletAddress for d in distributors}

    # print("[DEBUG] Building source nodes...")
    source_nodes = []

    for wallet, items in inventories.items():
        if wallet == target_wallet:
            # print(f"    [SKIP] Wallet {wallet} is target wallet.")
            continue

        # Skip retailers if we don't allow them as sources
        if wallet in retailer_wallets:
            # print(f"    [SKIP] Wallet {wallet} is a retailer (not valid source).")
            continue

        total_available = 0
        product_ids = []

        # print(f"    Checking inventory for wallet {wallet}...")
        for item in items:
            if getattr(item, 'productIds', []):
                valid_product_ids = []
                for pid in item.productIds:
                    try:
                        product = await get_product_by_id(pid)
                    except Exception as e:
                        # print(f"        [ERROR] Failed fetching product {pid}: {e}")
                        continue

                    if product and not getattr(product, 'inTransit', False):
                        valid_product_ids.append(pid)

                if valid_product_ids:
                    product_ids.extend(valid_product_ids)
                    total_available += len(valid_product_ids)
            else:
                if not getattr(item, 'inTransit', False):
                    qty = getattr(item, 'qty', getattr(item, 'qtyRemaining', 1))
                    total_available += qty

        if total_available > 0:
            if wallet not in graph or not graph.get(wallet):
                # print(f"    [SKIP] Wallet {wallet} has stock but is not connected in graph.")
                continue

            # print(f"    [ADD] Wallet {wallet} added as source node. total_available={total_available}, product_ids={product_ids}")
            source_nodes.append({
                "wallet": wallet,
                "available_qty": total_available,
                "product_ids": product_ids,
            })
        else:
            print(f"    [SKIP] Wallet {wallet} has no available stock.")

    # If no source nodes available
    if not source_nodes:
        # print("[WARN] No source nodes found!")
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

    # Try to fulfill from a single node
    single_node_candidates = []
    for src in source_nodes:
        if src["available_qty"] >= required_qty:
            result = shortest_path(graph, src['wallet'], target_wallet, return_time=is_cold_storage)
            # print(f"    [PATH CHECK] {src['wallet']} -> {target_wallet} = {result}")

            if result and result[0] is not None:
                path, cost, time = result
                hops = len(path)
                single_node_candidates.append({
                    "wallet": src['wallet'],
                    "path": path,
                    "cost": cost,
                    "eta_time": calculate_eta(path, connections_lookup),
                    "priority": (cost if not is_cold_storage else time, hops, -src["available_qty"]),
                    "product_ids": src['product_ids'][:required_qty],
                    "available_qty": src['available_qty']
                })
        else:
            # print(f"    [INFO] Wallet {src['wallet']} has only {src['available_qty']} units, need {required_qty}.")
            continue

    if single_node_candidates:
        single_node_candidates.sort(key=lambda x: x["priority"])
        best = single_node_candidates[0]
        # print(f"[SUCCESS] Fulfilled by single node {best['wallet']}")
        return {
            "allocations": [{
                "source": best["wallet"],
                "path": best["path"],
                "product_ids": best["product_ids"],
                "total_cost": best["cost"],
                "allocated_qty": required_qty,
                "eta_time": best["eta_time"]

            }],
            "status": "complete"
        }

    # Multi-node allocation
    # print("[DEBUG] Attempting multi-node allocation...")
    scored_sources = []
    for src in source_nodes:
        result = shortest_path(graph, src['wallet'], target_wallet, return_time=is_cold_storage)
        if not result or result[0] is None:
            # print(f"    [SKIP] No path from {src['wallet']} to {target_wallet}.")
            continue

        path, cost, time = result
        hops = len(path)
        scored_sources.append({
            "wallet": src['wallet'],
            "path": path,
            "cost": cost,
            "eta_time": calculate_eta(path, connections_lookup),
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
            "allocated_qty": take_qty,
            "eta_time": source["eta_time"]
        })
        qty_remaining -= take_qty

    if qty_remaining == 0:
        # print("[SUCCESS] Multi-node allocation complete.")
        return {"allocations": allocations, "status": "complete"}

    if allocations:
        # print("[PARTIAL] Only partially fulfilled.")
        return {
            "allocations": allocations,
            "status": "partial",
            "wait_recommendation": {
                "message": f"Only {required_qty - qty_remaining} units available for {product_name}. Please wait for restock."
            }
        }

    # print("[FAIL] No allocation possible.")
    wait_plan = await suggest_wait_strategy(graph, inventories, product_name, target_wallet, cold_storage=is_cold_storage)
    return {
        "allocations": [],
        "status": "partial",
        "wait_recommendation": wait_plan
    }
