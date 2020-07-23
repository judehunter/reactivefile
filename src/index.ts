import * as fs from 'fs';
import {parse as parsePath} from 'path';
import * as yml from 'js-yaml';
import * as xml from 'fast-xml-parser';
import * as toml from '@iarna/toml';
import {observeData} from './react';

class ReactiveFile {
  val: Record<string, any>;
  path: string;
  opts: LoadOptions;

  constructor(val: Record<string, any>, path: string, opts: LoadOptions) {
    this.val = val;
    this.opts = opts;
    this.path = opts.saveTo || path;

    this.react();
  }

  static loadSync(path: string,
      {encoding = 'utf8', asyncSave = true, saveTo = null, deep = true, reactive = true, type = null}: LoadOptions = {}) {
    type = type || parsePath(path).ext.slice(1);
    const data = fs.readFileSync(path, {encoding});
    const parsed = this.parse(data, type);
    return new ReactiveFile(parsed, path, {encoding, asyncSave, saveTo, deep, reactive, type});
  }

  static async load(path: string,
      {encoding = 'utf8', asyncSave = true, saveTo = null, deep = true, reactive = true, type = null}: LoadOptions = {}) {
    type = type || parsePath(path).ext.slice(1);
    const data = await fs.promises.readFile(path, {encoding});
    const parsed = this.parse(data, type);
    return new ReactiveFile(parsed, path, {encoding, asyncSave, saveTo, deep, reactive, type});
  }

  private static types: Record<string, [ParseFunction, SerializeFunction]> = {};
  static registerType(type: string, parse: ParseFunction, serialize: SerializeFunction) {
    this.types[type] = [parse, serialize];
  }
  static assignType(type: string, from: string) {
    this.types[type] = this.types[from];
  }
  static registerTypes(types: string[], parse: ParseFunction, serialize: SerializeFunction) {
    for (const type of types) {
      this.registerType(type, parse, serialize);
    }
  }
  static assignTypes(types: string[], from: string) {
    for (const type of types) {
      this.assignType(type, from);
    }
  }

  react() {
    if (!this.opts.reactive) return;
    const notify = () => {
      // IF NEW VALUE IS AN OBJECT, OBSERVE IT!!!
      if (this.opts.asyncSave) this.save()
      else this.saveSync()
    };
    observeData(this.val, this.opts.deep, notify);
    notify();
  }

  private static parse(str: string, type: string): Record<string, any> {
    return this.types[type][0](str);
  }

  private static serialize(obj: any, type: string): string {
    return this.types[type][1](obj);
  }

  private async save() {
    const serialized = ReactiveFile.serialize(this.val, this.opts.type);
    await fs.promises.mkdir(parsePath(this.path).dir, {recursive: true});
    fs.writeFileSync(this.path, serialized, {encoding: this.opts.encoding})
  }

  private saveSync() {
    const serialized = ReactiveFile.serialize(this.val, this.opts.type);
    fs.mkdirSync(parsePath(this.path).dir, {recursive: true});
    fs.writeFileSync(this.path, serialized, {encoding: this.opts.encoding})
  }
}

ReactiveFile.registerType('json', str => JSON.parse(str), obj => JSON.stringify(obj));
ReactiveFile.registerTypes(['yml', 'yaml'], str => yml.safeLoad(str), obj => yml.safeDump(obj));
ReactiveFile.registerType('toml', str => toml.parse(str), obj => toml.stringify(obj));
ReactiveFile.registerTypes(['xml', 'xaml'], str => xml.parse(str), obj => new xml.j2xParser({}).parse(obj));

export default ReactiveFile;


export interface LoadOptions {
  encoding?: 'ascii' | 'base64' | 'binary' | 'hex' | 'latin1' | 'ucs-2' | 'ucs2' | 'utf-8' | 'utf16le' | 'utf8',
  asyncSave?: boolean,
  saveTo?: string,
  deep?: boolean,
  reactive?: boolean,
  type?: string
}

type ParseFunction = (str: string) => any;
type SerializeFunction = (obj: any) => string;
