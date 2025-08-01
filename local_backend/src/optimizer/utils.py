def build_weighted_graph(connections):
    """
    connections: list of dicts, each with 'fromWalletAddress', 'toWalletAddress', 'costPerUnit', 'transitTimeDays'
    Returns: dict {node: [(neighbor, cost, time), ...]}
    """
    connections = [conn.dict() if hasattr(conn, "dict") else conn for conn in connections]
    graph = {}
    for conn in connections:
        src = conn['fromWalletAddress']
        dst = conn['toWalletAddress']
        cost = conn.get('costPerUnit', 1)
        time = conn.get('transitTimeDays', 1)
        graph.setdefault(src, []).append((dst, cost, time))
        # If bidirectional, uncomment the next line:
        # graph.setdefault(dst, []).append((src, cost, time))
    return graph

import heapq

def shortest_path(graph, src, dst, return_time=True):
    """
    Dijkstra's algorithm.
    If return_time=True, optimize for time, else for cost.
    Returns: (path, total_cost, total_time)
    """
    queue = [(0, 0, src, [])]  # (priority, cost, node, path)
    visited = set()
    while queue:
        priority, cost, node, path = heapq.heappop(queue)
        if node in visited:
            continue
        path = path + [node]
        if node == dst:
            return path, cost, priority
        visited.add(node)
        for neighbor, edge_cost, edge_time in graph.get(node, []):
            if neighbor not in visited:
                next_priority = priority + (edge_time if return_time else edge_cost)
                next_cost = cost + edge_cost
                heapq.heappush(queue, (next_priority, next_cost, neighbor, path))
    return