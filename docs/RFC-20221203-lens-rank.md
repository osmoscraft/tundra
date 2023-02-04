# Lens Rank

- The algorithm for scoring graph nodes in relation to a given entry point
- High level idea
  - Each query consists of two phases: forward propagation and backward propagation
  - Forward propagation is a BFS/DFS until desired depth is reached
  - Backward progation uses a stack created from the propagation
  - Each node can reflect, passthrough, and dissipate energy during both forward and backward progation
  - After the backward progation ends, the reflected energy on each represents the score
  - Preprocess nodes with topological sort to resolve cyclical dependency
- Observations
  - Let reflectation, passthrough, and dissipation rate be r, p, and d
  - p < 1 models the damping for each hop
  - p = 1 models zero damping, e.g. HTTP redirect
  - r model the level of activation on the node. To simplify, we can ignore the reflection caused by back propagation
  - d model the bias of the node, in case there is additional information indicating the value of the node should be reduced
  - A full forward and backward propagation query takes O(N), assuming the edges are indexed
