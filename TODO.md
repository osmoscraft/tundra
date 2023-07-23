# Alpha must have

- Backlink display in bottom panel suggestion bar (when omnibox not open)
- Link insertion via omnibox
- Clean up the naming inconsistency: add vs create, remove vs delete, modify vs update
- Automerge with higher timestamp
- Better system files scaffolding
  - Auto generate built-in gitignore
  - Regenerate system files after clone
- Hot swap internal navigation
- Autosave edits
- Need to handle invalid frontmatter state during auto save
- Ignore system files in search
- DB Migration strategy
- implement soft delete for individual files
- Use node.js for testing (need sqlite 3.43)

# Future

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
