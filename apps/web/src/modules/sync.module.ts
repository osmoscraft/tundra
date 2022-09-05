export interface ISyncModule {
  addLocal(changes: LocalChange[]): void;
  pull(): void;
  push(): void;
  on<Type extends keyof ChangesetEventMap>(type: Type, listener: (data: ChangesetEventMap[Type]) => any): void;
}

export interface LocalChange {
  id: string;
  prevContent: string | null;
  content: string | null;
}

export interface RemoteChange {
  id: string;
  content: string | null;
}

export interface ChangesetEventMap {
  localChanged: any;
  remoteChanged: any;
}

export class SyncModule implements ISyncModule {
  private localChanges: LocalChange[] = [];
  private remoteChanges: RemoteChange[] = [];

  addLocal(changes: LocalChange[]): void {
    changes.forEach((change) => {
      const existingItem = this.localChanges.find((item) => item.id === change.id);
      if (existingItem) {
        existingItem.content = change.content;
      } else {
        this.localChanges.push(change);
      }
    });
  }

  addRemote(remoteChanges: RemoteChange[]): void {
    this.remoteChanges = remoteChanges;
  }

  pull(): void {}

  push(): void {}

  on<Type extends keyof ChangesetEventMap>(type: Type, listener: (data: ChangesetEventMap[Type]) => any): void {}
}
