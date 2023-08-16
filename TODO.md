# Alpha must have

- Initial doc loading pollutes history
- Clean up the naming inconsistency: add vs create, remove vs delete, modify vs update
- DB Migration strategy
- Use node.js for testing (need sqlite 3.43)
- Determine frontmatter fields to support: created? updated? tags? title?

# Future

- Repo: Add convenience command to open github repo
- Status: multi-lines history
- Status: detailed sync progress
- Status: actionable messages
- Status: semantic color-coding
- Handle virtual nodes: files that are deleted but still referenced by other files
- Investigate Firefox compatibility
- Restore cursor between SPA navigations
- Local first: create local workspace
- Local first: auto generate built-in gitignore
- Local first: create remote from local state
- Manual merge during conflict resolution
- Maintain static test specs and a static spec generator
- Fine-tune ESC behavior in omnibox
- Live link: mouse click in text portion should not open the link
- First run: initial clone progress reporting
- Sync: allow clone by command
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
