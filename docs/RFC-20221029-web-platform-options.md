# Platform Options

- Browser Extension (Active development)
  - Pro: Extended browser API
  - Con: Installation needed
- Browser Web App
  - Pro: Universal access
  - Con: Lack of CORS
- Headless Server App
  - Pro: OS level API access
  - Con: Installer and Upgrade complexity
- GUI Desktop App
  - Pro: Best UX
  - Con: Large binary. Installer and Upgrade challenges. Portability

## Browser Extension Details

- Option 1
  - Extension origin contains everything.
  - Appears to be used by OnePassword
  - Simplest rpc
  - Pro: Offline friendly, without service worker
  - Con: tinykb.com needs to duplicate all the data and user config
- Option 3
  - Pro: least dependency on browser extension
  - Con: limited web experience without browser extension. Complex rpc
  - tinykb.com origin
    - UI, Worker and IndexedDB
  - Extension origin
    - Networking only
    - CORS fetch util
    - Is extension logic accessible from the tinykb.com Worker scope?
- Option 2
  - tinykb.com origin
    - UI
  - Extension origin
    - Worker and networking
