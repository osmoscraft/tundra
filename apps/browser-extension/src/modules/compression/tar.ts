export interface FileInfo {
  name: string;
  type: string;
  size: number;
  header_offset: number;
}

// Based on https://github.com/ankitrohatgi/tarballjs
// MIT License
// Changes:
// Converted javascript to typescript
// Removed TarWriter
// Added UStar longname extraction
export class TarReader {
  private buffer!: ArrayBuffer;
  private fileInfo!: FileInfo[];

  readFile(file: Blob) {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
      reader.onload = (event) => {
        this.buffer = event.target!.result as ArrayBuffer;
        this.fileInfo = [];
        this._readFileInfo();
        resolve(this.fileInfo);
      };
      reader.readAsArrayBuffer(file);
    });
  }

  readArrayBuffer(arrayBuffer: ArrayBuffer) {
    this.buffer = arrayBuffer;
    this.fileInfo = [];
    this._readFileInfo();
    return this.fileInfo;
  }

  _readFileInfo() {
    this.fileInfo = [];
    let offset = 0;
    let file_size = 0;
    let file_name = "";
    let file_type = null;
    while (offset < this.buffer.byteLength - 512) {
      file_name = this._readFileName(offset); // file name
      // UStar header: https://en.wikipedia.org/wiki/Tar_(computing)
      const file_name_prefix = this._readString(offset + 345, 155);
      if (file_name.length == 0) {
        break;
      }
      file_type = this._readFileType(offset);
      file_size = this._readFileSize(offset);

      this.fileInfo.push({
        name: [file_name_prefix, file_name].filter(Boolean).join("/"),
        type: file_type,
        size: file_size,
        header_offset: offset,
      });

      offset += 512 + 512 * Math.trunc(file_size / 512);
      if (file_size % 512) {
        offset += 512;
      }
    }
  }

  getFileInfo() {
    return this.fileInfo;
  }

  _readString(str_offset: number, size: number) {
    let strView = new Uint8Array(this.buffer, str_offset, size);
    let i = strView.indexOf(0);
    let td = new TextDecoder();
    return td.decode(strView.slice(0, i));
  }

  _readFileName(header_offset: number) {
    let name = this._readString(header_offset, 100);
    return name;
  }

  _readFileType(header_offset: number) {
    // offset: 156
    let typeView = new Uint8Array(this.buffer, header_offset + 156, 1);
    let typeStr = String.fromCharCode(typeView[0]);
    if (typeStr == "0") {
      return "file";
    } else if (typeStr == "5") {
      return "directory";
    } else {
      return typeStr;
    }
  }

  _readFileSize(header_offset: number) {
    // offset: 124
    let szView = new Uint8Array(this.buffer, header_offset + 124, 12);
    let szStr = "";
    for (let i = 0; i < 11; i++) {
      szStr += String.fromCharCode(szView[i]);
    }
    return parseInt(szStr, 8);
  }

  _readFileBlob(file_offset: number, size: number, mimetype: string) {
    let view = new Uint8Array(this.buffer, file_offset, size);
    let blob = new Blob([view], { type: mimetype });
    return blob;
  }

  _readFileBinary(file_offset: number, size: number) {
    let view = new Uint8Array(this.buffer, file_offset, size);
    return view;
  }

  _readTextFile(file_offset: number, size: number) {
    let view = new Uint8Array(this.buffer, file_offset, size);
    let td = new TextDecoder();
    return td.decode(view);
  }

  getTextFile(file_name: string) {
    let info = this.fileInfo.find((info) => info.name == file_name);
    if (info) {
      return this._readTextFile(info.header_offset + 512, info.size);
    }
  }

  getFileBlob(file_name: string, mimetype: string) {
    let info = this.fileInfo.find((info) => info.name == file_name);
    if (info) {
      return this._readFileBlob(info.header_offset + 512, info.size, mimetype);
    }
  }

  getFileBinary(file_name: string) {
    let info = this.fileInfo.find((info) => info.name == file_name);
    if (info) {
      return this._readFileBinary(info.header_offset + 512, info.size);
    }
  }
}
