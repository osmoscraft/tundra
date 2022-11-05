# Tech stack

## Storage

- GitHub and GitLab
  - Good redundancy, mature technology
  - Zero-cost hosting
  - Require existing account
- CloudFlare R2 (and other S3 compatible blob storage)
- File system backed by Git

## Networking

- Server side runtime
  - Most robust
- GitHub Action or GitLab CI/CD
  - Subject to quota limit
- Browser extension
  - Subject to browser fetch limitation

## App packaging

- Web app
  - Require backend or extension
- Browser extension
  - Not hackable
  - No persisted background code
- GitHub Pages
  - Most hackable
  - Delay between builds
  - Difficult developer experience
- Native app
  - Good cross-platform UI framework is rare
- Electron/Tauri/Wails Web app
  - Durability challenges
