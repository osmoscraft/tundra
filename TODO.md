# Bugs

- Navigating from a file results in content update but the URL remains unchanged, leading to accidental overwrite of content
- GitHUb file rename causes sync error

# Beta backlog

- Capture: capture from browser context menu when there is a text selection
- Capture: scrub tracking search params in URL
- Capture: smart title parsing against hyphenated or colon separated title
- Capture: use canonical URL during capture
- Community: change announcements
- Community: convert key RFCs into blog posts
- Community: documentation
- Community: sponsorship options
- Community: support forum
- Community: web site
- Editing: avoid spellcheck on URLs
- Editing: avoid spellcheck on timestamps
- First run: generate gitignore on local boostrap init
- First run: in context help menu
- First run: initial clone progress reporting
- First run: load keybinding immediate after clone without page reload
- Formatting: heading level based indentation
- Formatting: including Line item text wrap
- Formatting: separation between display format and storage format
- Keyboard: auto-focus first content line on opening note
- Keyboard: escape to cancel selection
- Keyboard: fine-tune ESC behavior in omnibox
- Lifecycle: allow reverting current file to last known remote state
- Lifecycle: autosave edits
- Lifecycle: deleted file should not appear in search results
- Lifecycle: enter read-only mode after note is deleted
- Lifecycle: handle files that are deleted but still referenced by other files
- Lifecycle: prevent autosave with invalid frontmatter metadata
  Lifecycle: sync command cannot be issued while another sync is running (or newer result will be lost)
- Links: link insertion via on-canvas autocompletion
- Links: mouse click in text portion should allow edit
- Migration: Add a web hook that pushes haiku into markdown repo
- Migration: Convert all osmosmemo notes as bookmarks (stretch goal: retain timemstamp from git blame)
- Omnibox: handle ctrl p and ctrl shift p while inside omnibox
- Omnibox: display action mode, e.g. Linking, Opening, either in input or in menu options
- Omnibox: RxJS stream like search input handling with debounce and throttle
- Omnibox: Simplify the modes by relying on post creation fragile selection state and undo stack
- Packaging: support Firefox by forking background script
- Performance: share a single background worker across multiple tabs, using chrome offscreen API
- Performance: preload background worker on install and browser startup, using chrome offscreen API
- Performance: use SQLite built-in "INSERT OR REPLACE INTO" for upserts
- Quality: Migrate live test to node.js test once sqlite 3.43 ships
- Quality: persist FSM spec generator output as version controlled asset
- Quality: unit test for broadcast utils. It is not testable in a single tab
- Quality: http request triggers blocking tooltip at bottom-left corner
- Settings: When server side keyboard config has breaking change, client might not be able to open options page
- Status: actionable messages
- Status: detailed sync progress
- Status: progressive discloure of multi-lines history
- Status: reflect error state with red indicator
- Status: reflect git graph change status in HUD (separate from buffer status)
- Status: semantic color-coding of status bar (separate from HUD indicator)
- Storage: Hierarchical note directory path support
- Storage: use relative path and file extension in storage, and use atomic ID string in UI
- Sync: clone command
- Sync: fallback to full import when history is too long to catch up
- Sync: improve clone performance, goal <2ms per file, baseline 4.5ms per file
- Sync: manual merge during conflict resolution
- Sync: open github command
- Sync: persist last used github connection in local storage in case of DB error
- Sync: support gitlab
- Sync: replace git tree/commit/ref operations with graphql mutation CreateCommitonBranch
- Theming: CSS variable based theme definition
- Theming: heading level based colorization
- Theming: migrate all js color values to css class + variable
- Theming: user stylesheet override
- Workspace: multi-tab editing with conflict prevention
- Workspace: status display should auto update when any tab updates
- Workspace: restore cursor between SPA navigations

# Future

# Beta done

- Editing: spell checker
- Keyboard: backlink ref and omnibox menu should allow arrow key navigation with a single tab stop
- Keyboard: ESC to close search panel
- Omnibox: At least one of menu item should always be selected
- Omnibox: Search command with prefix per-word, not just per-line
- Links: the default option should be first matched link, rather than create new
