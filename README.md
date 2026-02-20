# Bellman-Ford Algorithm

## 📌 Overview

The **Bellman-Ford Algorithm** is used to find the shortest path from a single source vertex to all other vertices in a weighted graph.
It works even when the graph contains **negative edge weights** and can also detect **negative weight cycles**.

---

## 🚀 Features

* Supports negative edge weights
* Detects negative cycles
* Works for directed and undirected graphs
* Simple implementation

---

## 🧠 Algorithm Steps

1. Initialize distance of all vertices as infinity.
2. Set source distance = 0.
3. Relax all edges **V-1 times**.
4. Run one more iteration to check for negative cycles.

---

## ⏱️ Complexity

* **Time Complexity:** O(V × E)
* **Space Complexity:** O(V)

Where:

* V = number of vertices
* E = number of edges

---

## 📂 Pseudocode

```
function bellmanFord(vertices, edges, source):
    create distance array
    set all distances = infinity
    distance[source] = 0

    repeat V-1 times:
        for each edge (u, v, w):
            if distance[u] + w < distance[v]:
                distance[v] = distance[u] + w

    for each edge (u, v, w):
        if distance[u] + w < distance[v]:
            print("Negative weight cycle detected")
```

---

## 💻 Example (Python)

```python
def bellman_ford(vertices, edges, source):
    dist = [float('inf')] * vertices
    dist[source] = 0

    for _ in range(vertices - 1):
        for u, v, w in edges:
            if dist[u] != float('inf') and dist[u] + w < dist[v]:
                dist[v] = dist[u] + w

    for u, v, w in edges:
        if dist[u] != float('inf') and dist[u] + w < dist[v]:
            print("Negative weight cycle detected")
            return

    return dist


edges = [
    (0,1,-1),
    (0,2,4),
    (1,2,3),
    (1,3,2),
    (1,4,2),
    (3,2,5),
    (3,1,1),
    (4,3,-3)
]

print(bellman_ford(5, edges, 0))
```

---

## 📊 When to Use

✅ Graph has negative weights
✅ Need negative cycle detection
❌ Not ideal for very large dense graphs

---

## 📜 License

Free to use for learning and educational purposes.
