# Scratchpad

- File v1->v2 schema migration
  - file.list method implementation
  - file.search method implementation
  - Add commit, push, fetch, merge methods in graph
  - Refactor list and search into generic sql utils

# Alpha must have

- Prevent merge when in conflict
- Decide json vs. yaml for persistence and editing
- Refactor: add graph layer to handle meta + dirty tracking
- Use node.js for testing (need sqlite 3.43)
- Auto generate built-in gitignore
- Regenerate system files after clone
- Better system files scaffolding
- Backlink display in bottom panel suggestion bar (when omnibox not open)
- Link insertion via omnibox
- Hot swap internal navigation
- Autosave edits
- Need to handle invalid frontmatter state during auto save
- Ignore system files in search
- DB Migration strategy
- Tune clone performance, goal <2ms per file, baseline 4.5ms per file

# Future

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
