The Bellman–Ford algorithm is a single-source shortest path algorithm used to find the minimum distance from a source vertex to all other vertices in a weighted graph.
Unlike Dijkstra’s algorithm, Bellman–Ford can handle negative edge weights and can also detect negative weight cycles.
🚀 Features
Works with directed and undirected graphs
Supports negative edge weights
Detects negative cycles
Simple and easy-to-implement logic
🧠 How It Works
Initialize distance to all vertices as infinity (∞) except the source (0).
Relax all edges V-1 times (where V = number of vertices).
Perform one more iteration:
If any distance still updates → a negative weight cycle exists.
