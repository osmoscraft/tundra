# Alpha must have

- Router: draft url handling
- Router: Hot swap internal navigation
- Router: Rethink where to use id vs. path
- Omnibox: add option to create blank files
- Omnibox: Escape to close menu when not focusing on input box
- Clean up the naming inconsistency: add vs create, remove vs delete, modify vs update
- Sync: Automerge with higher timestamp
- System files: auto generate built-in gitignore
- System files: regenerate system files after clone
- DB Migration strategy
- implement soft delete for individual files
- Use node.js for testing (need sqlite 3.43)

# Future

- Autosave edits
- Need to handle invalid frontmatter state during auto save
- Tune clone performance, goal <2ms per file, baseline 4.5ms per file
- Load keybinding from synced storage
- Link insertion via autocomplete
- Add search unit tests
- Add a web hook that pushes haiku into markdown repo
- Improve color theme
- Line item text wrap
- Heading level based indentation
- Heading level based colorization
- Hierarchical note directory path support
- Allow undo to rewind local timestamp
- Fallback to full import when history is too long to catch up
