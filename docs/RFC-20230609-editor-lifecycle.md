# Editor lifecycle

- Initial loading: markdown to html
- Edit:
  - Before change: mark affected lines as dirty
  - Apply content change
    - Addition, paste
    - Deletion, cut
  - After change: digest all the dirty lines
    - Apply styles
- Save:
  - html to markdown
