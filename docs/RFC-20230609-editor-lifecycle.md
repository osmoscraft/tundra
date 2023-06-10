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

# Case by case analysis

- Modes:
  - Cursor collapsed vs with selection
  - IME vs non-IME
- Actions:
  - Type a character no IME
    - Events:
      - (keydown, beforeinput, input) one or more times
      - keyup
  - Type a character IME
  - Enter
  - Backspace/Delete
    - Same as type a character
  - Paste
  - Cut
  - Drag and drop internal content
    - Events
      - beforeinput (delete)
      - input (delete)
      - beforeinput (insert)
      - input (insert)
  - Drop external content
  - Numpad escaped sequence alt code
  - Accent character input
