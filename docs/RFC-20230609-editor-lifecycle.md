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
  - Digest changes (round 1)
- compositionend
  - Digest changes (round 2)
- keyup
  - A lot of unwanted events (e.g. number keys from IME)
  - Cannot detect composition

# Edge cases

- Drag and drop
  - beforeinput (delete)
  - input (delete)
  - beforeinput (insert)
  - input (insert)
- IME composition
- Alt-numpad composition
