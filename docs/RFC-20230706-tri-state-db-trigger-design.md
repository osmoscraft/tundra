# Tri-state sync design principles

[Continued from](./RFC-20230703-tri-state-version-control.md)

- The state of each file is always consistent
  - DB Write should allow invalid state
    - The spec does not cover the protection the Writes
  - DB Read should never yield invalid state
- Each file can be descontructed into a sequence of events
  - Each file can have 0 to 3 events
  - Each event must be of one of the three types: local, remote, synced
  - No two events can have the same type
  - Replaying the sequence of events will always render the same end results
  - Grouping events in a sequence and replaying the groups should yield the same end results, as long as the groups following timestamp order
  - When multiple events or groups from one file have the same timestamp, they can be replayed in any order in relation to each other
- Validity
  - timestamp guarantee
    - local.time > synced.time if local exists
    - remote.time > synced.time if remote exists
    - Using strict > because copying remote into synced should suggest remote to be obsolete
  - local should not exist when one of merge conditions are met
    - local.content is the same as synced.content and local.time <= remote.time
    - local.content is the same as remote.content
  - remote should not exist when one of merge conditions are met
    - remote.content is the same as synced.content and remote.time <= local.time
  - sync.content cannot be null
  - At least one of local.content, remote.content, synced.content must exist
- Efficiency
  - Avoid recursive triggers. The resolution must finish in one pass
  - Exploit trigger ordering. Earlier triggers should reduce work for later triggers

# Next step

- Design DB mutations that prevents accidental override of synced content
- All remote changes must be manually merged
  - Unless the changed content is identical to synced content
