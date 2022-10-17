# Vanilla JS Challenges

## Issues

- State management
  - Platform event system is not ideal
    - Temporal dependency hell
    - Event has no replay (ala rxjs)
    - Difficult type interface
- Dependency injection
  - Difficult for web component where constructor is not exposed
- Efficient UI update
  - Large repaint
  - Focus and cursor selection management
- Async UI rendering
  - Web component lifecycle complexity
    - Narrow window for data injection

## Solutions

- FP
- Utility-first libraries
