# Bugs

# Alpha release checklist

# Beta backlog

- Capture: cache visited pages' title and url to temp storage for link insertion, using only activeTab permission
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
- First run: generate gitignore on local boostrap init
- First run: initial clone progress reporting
- First run: push locally bootstrapped app to remote
- First run: in context help menu
- Formatting: heading level based indentation
- Formatting: including Line item text wrap
- Formatting: separation between display format and storage format
- Keyboard: backlink ref and omnibox menu should allow arrow key navigation with a single tab stop
- Keyboard: escape to cancel selection
- Keyboard: fine-tune ESC behavior in omnibox
- Keyboard: auto-focus first content line on opening note
- Keyboard: paragraph jumps with page up/down
- Lifecycle: allow reverting current file to last known remote state
- Lifecycle: autosave edits
- Lifecycle: deleted file should not appear in search results
- Lifecycle: enter read-only mode after note is deleted
- Lifecycle: handle files that are deleted but still referenced by other files
- Lifecycle: prevent autosave with invalid frontmatter metadata
- Links: auto select title after Ctrl+K returns, allowing immediate title revision
- Links: auto update reference when newly created file is renamed
- Links: link insertion via on-canvas autocompletion
- Links: mouse click in text portion should allow edit
- Links: the default option should be first matched link, rather than create new
- Migration: Add a web hook that pushes haiku into markdown repo
- Migration: Convert all osmosmemo notes as bookmarks (stretch goal: retain timemstamp from git blame)
- Omnibox: display action mode, e.g. Linking, Opening, either in input or in menu options
- Omnibox: RxJS stream like search input handling with debounce and throttle
- Packaging: support Firefox
- Quality: Migrate live test to node.js test once sqlite 3.43 ships
- Quality: persist FSM spec generator output as version controlled asset
- Status: actionable messages
- Status: detailed sync progress
- Status: progressive discloure of multi-lines history
- Status: reflect error state with red indicator
- Status: reflect git graph change status in HUD (separate from buffer status)
- Status: semantic color-coding of status bar (separate from HUD indicator)
- Storage: Hierarchical note directory path support
- Sync: clone command
- Sync: fallback to full import when history is too long to catch up
- Sync: improve clone performance, goal <2ms per file, baseline 4.5ms per file
- Sync: manual merge during conflict resolution
- Sync: open github command
- Sync: persist last used github connection in local storage in case of DB error
- Sync: support gitlab
- Theming: CSS variable based theme definition
- Theming: heading level based colorization
- Theming: migrate all js color values to css class + variable
- Theming: user stylesheet override
- Workspace: autoupdate after inserting a link to draft note, keep the title in the source up to date
- Workspace: multi-tab editing with conflict prevention
- Workspace: restore cursor between SPA navigations

# Future
