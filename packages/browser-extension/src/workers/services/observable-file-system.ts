import type { PromisifiedFS } from "@isomorphic-git/lightning-fs";

type ChangeRecord = WriteFileRecord | UnlinkRecord | MkdirRecord | RmdirRecord;
type WriteFileRecord = {
  method: "writeFile";
  args: Parameters<PromisifiedFS["writeFile"]>;
};
type UnlinkRecord = {
  method: "unlink";
  args: Parameters<PromisifiedFS["unlink"]>;
};
type MkdirRecord = {
  method: "mkdir";
  args: Parameters<PromisifiedFS["mkdir"]>;
};
type RmdirRecord = {
  method: "rmdir";
  args: Parameters<PromisifiedFS["rmdir"]>;
};

export interface FileSystemWrapperConfig {
  fsp: PromisifiedFS;
  onChange: (record: ChangeRecord) => void;
}
export class ObservableFileSystem {
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

  private wrap<Method extends Extract<keyof PromisifiedFS, string>>(method: Method): PromisifiedFS[Method] {
    return (async (...args: Parameters<PromisifiedFS[Method]>) => {
      const result = await (this.config.fsp[method] as any)(...args);
      this.config.onChange({
        method,
        args,
      } as ChangeRecord);

      return result;
    }) as any;
  }
}
