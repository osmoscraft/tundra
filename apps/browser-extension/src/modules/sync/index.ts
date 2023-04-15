import type { GithubConnection } from "./github/config-storage";
import type { ZipItem } from "./github/operations/download";
import { downloadZip } from "./github/operations/download";
import { getArchive } from "./github/proxy/get-archive";

export type ISyncService = Pick<SyncService, keyof SyncService>;
export class SyncService extends EventTarget {
  importGithubArchive(connection: GithubConnection) {
    return getArchive(connection).then((archive) =>
      downloadZip(archive.zipballUrl, (item) =>
        this.dispatchEvent(new CustomEvent<ImportItemInit>("importItem", { detail: item }))
      )
    );
  }
}

export type ImportItemInit = ZipItem;
