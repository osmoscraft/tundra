# Alpha must have

- Menu: Combine LinkToId with Id
- Router: switch from get/write/search-File layer to get/write/search-Note layer in proxy to hide path<->id conversion
- Router: Hot swap internal navigation
- Clean up the naming inconsistency: add vs create, remove vs delete, modify vs update
- Sync: Automerge with higher timestamp
- System files: auto generate built-in gitignore
- System files: regenerate system files after clone
- DB Migration strategy
- implement soft delete for individual files
- Use node.js for testing (need sqlite 3.43)
- LiveLink: Enter key on the right edge should not open url

# Future

- Fine-tune ESC behavior in omnibox
- Live link should not handle entery keydown when cursor is at the edge
- Initial clone progress reporting
- Keyboard: entire app should have two tab stops: editor and panel
- When linking, the default option should be first matched link, rather than create new
- Omnibox: auto update reference when newly created file is renamed
- Autosave edits
- Need to handle invalid frontmatter state during auto save
- Tune clone performance, goal <2ms per file, baseline 4.5ms per file
- Load keybinding from synced storage
- Link insertion via autocomplete
- Add search unit tests
- Add a web hook that pushes haiku into markdown repo
- Improve color themet
- Line item text wrap
- Heading level based indentation
- Heading level based colorization
- Hierarchical note directory path support
- Allow undo to rewind local timestamp
- Fallback to full import when history is too long to catch up
- RxJS stream like search input handling
