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
  - Format list indentation
  - html to markdown

# DOM Event lifecycle

- keydown
  - Handle commands: move, link, undo/redo, format, save...
  - Cannot detect composition
- compositionstart
- copy
  - Format copying content
- paste
  - Mark dirty lines
  - Format pasting content
- cut
  - Mark dirty lines
  - Format pasting content
- beforeinput
  - Mark dirty lines
  - Must ignore composition
- input
- compositionend
- keyup
  - Digest changes
  - A lot of unwanted events (e.g. number keys from IME)
  - Cannot detect composition
