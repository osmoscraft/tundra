# Alpha must have

- Capture current page on click from browser (with extension action)
- Trim existing date strings to ISO date granularity to resolve yaml syntax highlight issue
- Prevent unloading when thers are unsaved changes

# Future

- Omnibox: autoupdate after inserting a link to draft note, keep the title in the source up to date
- Respectful crawling: push visited pages' title and url to temp storage for link insertion. (with just current tab permission)
- Theming: CSS variable based theme definition
- Resolve URL to canonical URL
- Use node.js for testing (need sqlite 3.43)
- Repo: Add convenience command to open github repo
- Status: multi-lines history
- Status: detailed sync progress
- Status: actionable messages
- Status: semantic color-coding
- Persist last used github connection in local storage in case of DB error
- Handle virtual nodes: files that are deleted but still referenced by other files
- Investigate Firefox compatibility
- Restore cursor between SPA navigations
- Local first: bootstrap app without remote
- Local first: push locally bootstrapped app to remote
- Local first: auto generate built-in gitignore
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
- Line item text wrap
- Heading level based indentation
- Heading level based colorization
- Hierarchical note directory path support
- Allow undo to rewind local timestamp
- Fallback to full import when history is too long to catch up
- RxJS stream like search input handling
