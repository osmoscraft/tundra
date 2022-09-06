export interface IStorageModule {
  write(requests: WriteFileRequest[]): Promise<void>;
  read(ids: string[]): Promise<StorageItem[]>;
  clear(): Promise<void>;
  on<Type extends keyof StorageEventMap>(type: Type, listener: (data: StorageEventMap[Type]) => any): void;
}

export interface StorageEventMap {
  change: StorageChangeRecord[];
}

export interface StorageChangeRecord {
  id: string;
  content: string | null;
  prevContent: string | null;
}

export interface WriteFileRequest {
  id: string;
  content: string | null;
}

export interface StorageItem {
  id: string;
  content: string | null;
  isDeleted?: boolean;
}

export class StorageModule implements IStorageModule {
  private inMemStore: Record<string, StorageItem> = {};
  private events = new EventTarget();

  async write(requests: WriteFileRequest[]): Promise<void> {
    const changeRecords = await Promise.all(
      requests.map(async (req) => {
        const prevContent = this.inMemStore[req.id].content;
        this.inMemStore[req.id] = {
          id: req.id,
          content: req.content,
          ...(req.content === null ? { isDeleted: true } : undefined),
        };

        const changeRecord: StorageChangeRecord = {
          id: req.id,
          content: req.content,
          prevContent: prevContent,
        };

        return changeRecord;
      })
    );

    this.events.dispatchEvent(new CustomEvent("change", { detail: changeRecords }));
  }

  async read(ids: string[]): Promise<StorageItem[]> {
    return ids.map((id) => this.inMemStore[id]).filter((item) => !!item);
  }

  async clear() {
    this.inMemStore = {};
  }

  on<Type extends keyof StorageEventMap>(type: Type, listener: (data: StorageEventMap[Type]) => any): void {
    const wrappedListener = ((e: CustomEvent) => listener(e.detail)) as EventListener;
    this.events.addEventListener(type, wrappedListener);
  }
}
