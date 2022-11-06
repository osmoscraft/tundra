# Blob Storage V3

- [prev](./RFC-20221105-blob-storage-v2.md)

## Concepts

- Append-only Changelogs, with CID
- Row position (ROW) in Changelog represents commit
- Rewritable Blob keyed by OID
- Local state represented by Ref to CID:ROW
- Incrementally backup with Images

## Operations

- Create objects
  - Client send CID:ROW, OID and object value to server
  - Server check if CID:ROW is latest. If not, reject request.
  - Server append OID to Changelog (See Changelog rollover)
  - Server write object write to OID.blob
  - Server returns CID:ROW pair
  - Client applies the change
  - Client updates Ref to latest CID:ROW
- Update objects
  - Same as Create
- Delete objects
  - Same as Create, except the value written to OID.blob is NIL
- Get changes
  - Client send CID:ROW to server
  - Server returns all OID and object values newer than CID:ROW, and returns latest CID:ROW
  - Client applies all changes.
  - Client update Ref to latest CID:ROW
- Clone (dumb)
  - Server enumerate all blobs and latest Changelog
  - Server return CID:ROW, and all blobs that are not NIL
  - Client apply all changes
  - Client set Ref to CID:ROW
- Clone (smart)
  - Server returns images of all blobs and latest CID:ROW
  - Client restore all images
  - Client set Ref to CID:ROW
- Clone (with imaging, see Imaging spec)
  - Server lists all imaging blobs with IID
  - Server returns the list of IIDs
  - Client downloads images with all IIDs
  - Client unpack the image to retrive all blob OIDs, values, and latest CID:ROW
  - Client performs Get changes with the latest CID:ROW

## Changelog format

```
<OID>
<OID>
<OID>
.
.
.
```

## Changelog rollover

- Performed by server as needed during Create/Update/Delete
- Each Changelog contains 10k records (page size adjustable)
- When Changelog reaches limit, create new Changelog at CID.blob

## Changelog compression

- Performed on demand, by worker
- Triggered manually or by CRON
- Duplicated OIDs can be omitted
- Line endings are preseved to maintain row stability for CID:ROW Ref
- Before compression
  ```
  1001
  1002
  1002
  1003
  1001
  ```
- After compression
  ```
  (blank)
  (blank)
  1002
  1003
  1001
  ```

## Changelog imaging

- Performaned on demand, by worker
- Triggered after rollover, or by CRON
- Summarize a changelog's content into a single blob
- The blob shares the same id: IID.blob contains all the information as in CID.blob

## Imaging (alternative)

- Peformed on demand, by worker
- Triggered manually or by CRON
- An Image contains the state of all of blobs, and the CID:ROW for the latest blob
- Each Image is stored as IID.blob
