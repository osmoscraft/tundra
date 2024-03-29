- Context
  - Background behaves like SharedWorker in persistent and ServiceWorker in API
  - Currently a bug is blocking background worker from opening popup
    - Ref: https://github.com/GoogleChrome/developer.chrome.com/issues/2602
- Protocol
  - Popup -> Content
  - Content -> Background
  - Popup <-> Background
- Steps
  - Background listen to Popup and Content Script
  - Open popup
  - Popup listen to Background
  - Popup injects Content Script
  - Content Script send DOM string to background
  - Background process DOM string and send to Popup
  - Popup perform additional query against Background
- Future protocol
  - Popup <-> Background
  - Content <-> Background
- Future steps
  - Background listens on port
  - Background listens for user action
  - On user action, background requests DOM from Content
  - On user action, background opens Pop up
  - Pop up requests parsed DOM from background, whenever its ready
- Backup plan for performance improvement
  - Inject content script without user action
  - Perform DOM stringify on CPU idle callback and send to Background for temporary storage
