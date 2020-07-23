import * as fs from 'fs';
import * as path from 'path';
import {observeData} from './react';

export default class AutoFile {
  val: Record<string, any>;
  path: string;
  opts: LoadOptions;

  constructor(val: Record<string, any>, path: string, opts: LoadOptions) {
    this.val = val;
    this.opts = opts;
    this.path = opts.saveTo || path;

    observeData(this.val, () => {
      if (this.opts.asyncSave) this.save()
      else this.saveSync()
    });
  }

  static loadSync(path: string, {encoding = 'utf8', asyncSave = true, saveTo = null}: LoadOptions = {}) {
    const data = fs.readFileSync(path, {encoding});
    const parsed = this.parse(data);
    return new AutoFile(parsed, path, {encoding, asyncSave, saveTo});
  }

  static async load(path: string, {encoding = 'utf8', asyncSave = true, saveTo = null}: LoadOptions = {}) {
    const data = await fs.promises.readFile(path, {encoding});
    const parsed = this.parse(data);
    return new AutoFile(parsed, path, {encoding, asyncSave, saveTo});
  }

  static parse(str: string): Record<string, any> {
    return JSON.parse(str);
  }

  private async save() {
    const serialized = JSON.stringify(this.val);
    await fs.promises.mkdir(path.parse(this.path).dir, {recursive: true});
    fs.writeFileSync(this.path, serialized, {encoding: this.opts.encoding})
  }

  private saveSync() {
    const serialized = JSON.stringify(this.val)
    fs.mkdirSync(path.parse(this.path).dir, {recursive: true});
    fs.writeFileSync(this.path, serialized, {encoding: this.opts.encoding})
  }
}

export interface LoadOptions {
  encoding?: 'ascii' | 'base64' | 'binary' | 'hex' | 'latin1' | 'ucs-2' | 'ucs2' | 'utf-8' | 'utf16le' | 'utf8',
  asyncSave?: boolean,
  saveTo?: string
}
