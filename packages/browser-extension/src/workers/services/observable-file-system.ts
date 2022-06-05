import type { PromisifiedFS } from "@isomorphic-git/lightning-fs";

export type ChangeDetails = WriteFileDetails | UnlinkDetailes | MkdirDetails | RmdirDetails;
type BaseChangeDetails = {
  action: string;
  args: any[];
};
interface WriteFileDetails extends BaseChangeDetails {
  action: "writeFile";
  args: Parameters<PromisifiedFS["writeFile"]>;
}
interface UnlinkDetailes extends BaseChangeDetails {
  action: "unlink";
  args: Parameters<PromisifiedFS["unlink"]>;
}
interface MkdirDetails extends BaseChangeDetails {
  action: "mkdir";
  args: Parameters<PromisifiedFS["mkdir"]>;
}
interface RmdirDetails extends BaseChangeDetails {
  action: "rmdir";
  args: Parameters<PromisifiedFS["rmdir"]>;
}

export interface FileSystemWrapperConfig {
  fsp: PromisifiedFS;
}
export class ObservableFileSystem extends EventTarget {
  init: PromisifiedFS["init"];
  readdir: PromisifiedFS["readdir"];
  readFile: PromisifiedFS["readFile"];
  stat: PromisifiedFS["stat"];
  lstat: PromisifiedFS["lstat"];
  writeFile: PromisifiedFS["writeFile"];
  unlink: PromisifiedFS["unlink"];
  mkdir: PromisifiedFS["mkdir"];
  rmdir: PromisifiedFS["rmdir"];

  constructor(private config: FileSystemWrapperConfig) {
    super();

    this.init = this.config.fsp.init.bind(this.config.fsp);
    this.readdir = this.config.fsp.readdir.bind(this.config.fsp);
    this.readFile = this.config.fsp.readFile.bind(this.config.fsp);
    this.stat = this.config.fsp.stat.bind(this.config.fsp);
    this.lstat = this.config.fsp.lstat.bind(this.config.fsp);
    this.writeFile = this.wrap("writeFile");
    this.unlink = this.wrap("unlink");
    this.mkdir = this.wrap("mkdir");
    this.rmdir = this.wrap("rmdir");
  }

  private wrap<Action extends Extract<keyof PromisifiedFS, string>>(action: Action): PromisifiedFS[Action] {
    return (async (...args: Parameters<PromisifiedFS[Action]>) => {
      const result = await (this.config.fsp[action] as any)(...args);
      this.dispatchEvent(
        new CustomEvent<BaseChangeDetails>("change", {
          detail: {
            action,
            args,
          },
        })
      );

      return result;
    }) as any;
  }
}
