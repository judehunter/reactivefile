import * as fs from 'fs';
import {parse as parsePath} from 'path';
import * as yml from 'js-yaml';
import * as xml from 'fast-xml-parser';
import * as toml from '@iarna/toml';
import {observeData} from './react';

export type Obj<T = any> = Record<string, T>;

export class ReactiveFileObject {
  val: Obj;
  $: Obj; //alias of val for ease of use
  path: string;
  opts: LoadOptions;

  constructor(val: Obj, opts: LoadOptions, path?: string) {
    this.$ = this.val = val;
    this.opts = opts;
    this.path = opts.saveTo || path;

    this.react();
  }

  /**
   * Makes the underlying object reactive again.
   * Useful after adding a new key.
   */
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

  /**
   * Saves the data into the file asynchronously
   */
  async save() {
    const serialized = serialize(this.val, this.opts.type);
    if (parsePath(this.path).dir) await fs.promises.mkdir(parsePath(this.path).dir, {recursive: true});
    fs.writeFileSync(this.path, serialized, {encoding: this.opts.encoding})
  }

  /**
   * Saves the data into the file synchronously
   */
  saveSync() {
    const serialized = serialize(this.val, this.opts.type);
    if (parsePath(this.path).dir) fs.mkdirSync(parsePath(this.path).dir, {recursive: true});
    fs.writeFileSync(this.path, serialized, {encoding: this.opts.encoding})
  }
}

/**
 * Loads a file asynchronously and creates a new ReactiveFile.
 * @param path path to the file to be loaded
 * @param options fs and ReactiveFile options
 */
export async function load(path: string,
    {encoding = 'utf8', asyncSave = true, saveTo = null, deep = true, reactive = true, type = null}: LoadOptions = {}) {
  type = type || parsePath(path).ext.slice(1);
  const data = await fs.promises.readFile(path, {encoding});
  const parsed = parse(data, type);
  return new ReactiveFileObject(parsed, {encoding, asyncSave, saveTo, deep, reactive, type}, path);
}
/**
 * Loads a file synchronously and creates a new ReactiveFile.
 * @param path path to the file to be loaded
 * @param options fs and ReactiveFile options
 */
export function loadSync(path: string,
  {encoding = 'utf8', asyncSave = true, saveTo = null, deep = true, reactive = true, type = null}: LoadOptions = {}) {
  type = type || parsePath(path).ext.slice(1);
  const data = fs.readFileSync(path, {encoding});
  const parsed = parse(data, type);
  return new ReactiveFileObject(parsed, {encoding, asyncSave, saveTo, deep, reactive, type}, path);
}
/**
 * Creates a ReactiveFile from an already existing object.
 * @param obj the object
 * @param options fs and ReactiveFile options
 */
export function from(obj: Obj,
  {encoding = 'utf8', asyncSave = true, saveTo = null, deep = true, reactive = true, type = null}: LoadOptions = {}) {
  if (!saveTo) throw new Error('saveTo path must be defined!');
  type = type || parsePath(saveTo).ext.slice(1);
  return new ReactiveFileObject(obj, {encoding, asyncSave, saveTo, deep, reactive, type});
}

const types: Obj<[ParseFunction, SerializeFunction]> = {};

/**
 * Registers a parse and a serialize function for a given type/extension.
 * @param type The type or extension of the file.
 * Examples: `json`, `toml` (no dot!)
 * @param parse The parse function. Takes a string and returns an object.
 * @param serialize The serialize function. Takes an object and returns a string
 */
export function registerType(type: string, parse: ParseFunction, serialize: SerializeFunction) {
  types[type] = [parse, serialize];
}
/**
 * Copies the parse and serialize functions from another type into a new one.
 * @param typeName of your new type/extension.
 * Examples: `json`, `toml` (no dot!)
 * @param from Name of the type to be copied
 */
export function assignType(type: string, from: string) {
  types[type] = types[from];
}
/**
 * Registers a parse and a serialize function for given types/extensions.
 * @param types An array of types/extensions.
 * Example: `['yml', 'yaml']` (no dot!)
 * @param parse The parse function. Takes a string and returns an object.
 * @param serialize The serialize function. Takes an object and returns a string
 */
export function registerTypes(types: string[], parse: ParseFunction, serialize: SerializeFunction) {
  for (const type of types) {
    registerType(type, parse, serialize);
  }
}
/**
 * Copies the parse and serialize functions from another type into many new ones.
 * @param types An array of your new types/extensions.
 * Example: `['yml', 'yaml']` (no dot!)
 * @param from Name of the type to be copied
 */
export function assignTypes(types: string[], from: string) {
  for (const type of types) {
    assignType(type, from);
  }
}

function parse(str: string, type: string): Obj {
  return types[type][0](str);
}

function serialize(obj: Obj, type: string): string {
  return types[type][1](obj);
}

registerType('json', str => JSON.parse(str), obj => JSON.stringify(obj));
registerTypes(['yml', 'yaml'], str => yml.safeLoad(str), obj => yml.safeDump(obj));
registerType('toml', str => toml.parse(str), obj => toml.stringify(obj));
registerTypes(['xml', 'xaml'], str => xml.parse(str), obj => new xml.j2xParser({}).parse(obj));

export interface LoadOptions {
  encoding?: 'ascii' | 'base64' | 'binary' | 'hex' | 'latin1' | 'ucs-2' | 'ucs2' | 'utf-8' | 'utf16le' | 'utf8',
  asyncSave?: boolean,
  saveTo?: string,
  deep?: boolean,
  reactive?: boolean,
  type?: string
}

/**
 * A custom function for parsing the input string into an object.
 */
export type ParseFunction = (str: string) => Obj;
/**
 * A custom function for serializing the input object into a string.
 */
export type SerializeFunction = (obj: Obj) => string;
