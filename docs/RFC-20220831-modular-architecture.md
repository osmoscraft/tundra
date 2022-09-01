# High level design

- Core
  - What: frames content
  - Least powerful language (plaintext), highly portable
  - Emit events on all mutations
  - Passive (avoid self-mutation). All mutations are imperatively driven by modules
- Modules
  - Have access to standard APIs
    - Networking
    - Remote module loading
    - Inter-module communication
    - Module storage
    - Pakcage update management
  - Operate on the frames, create meaningful user applications
  - End-to-end isolates for highest modularity

# Interface

```typescript
export async function main() {
  const graph: IGraphModule = {} as any;
  const search: ISearchModule = {} as any;
  const sync: ISyncModule = {} as any;
  const gui: IGuiModule = {} as any;

  gui.addEventListener("loadFrame", chain(gui.load, graph.getFrames));
  gui.addEventListener("saveFrame", graph.saveFrames);
  gui.addEventListener("syncAll", chain(sync.pull, sync.push));
  gui.addEventListener("pull", sync.pull);
  gui.addEventListener("push", sync.push);
  gui.addEventListener("search", chain(gui.search, search.search));

  graph.addEventListener("framesChanged", sync.digestChanges);
  graph.addEventListener("framesChanged", search.digestChanges);

  sync.addEventListener("updateAvailable", graph.saveFrames);
}

export interface IGuiModule extends EventTarget {
  load(...args: any[]): void;
  search(...args: any[]): void;
}

export interface IGraphModule extends EventTarget {
  getFrames(...args: any[]): void;
  saveFrames(...args: any[]): void;
}

export interface ISearchModule extends EventTarget {
  search(...args: any[]): void;
  updateIndex(...args: any[]): void;
  digestChanges: EventListener;
}

export interface ISyncModule extends EventTarget {
  digestChanges: EventListener;
  pull(): void;
  push(): void;
}

export function chain(...args: any[]) {
  return {} as any;
}
```
