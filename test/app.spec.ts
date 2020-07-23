import rf from '../src';
import * as fs from 'fs';
import * as yml from 'js-yaml';
import * as xml from 'fast-xml-parser';
import * as toml from '@iarna/toml';

test('load JSON file', async () => {
  expect(rf.loadSync(__dirname + '/fixtures/jsonfile.json')).toBeDefined()
  expect(await rf.load(__dirname + '/fixtures/jsonfile.json')).toBeDefined()
})

const testObject = {
  abc: 'ghi',
  deep: {
    nested: {
      thing: 456
    }
  },
  array: [1, 4, 9]
}

test('JSON ReactiveFile', async () => {
  const from = __dirname + '/fixtures/jsonfile.json';
  const to = __dirname + '/temp/jsonfile.json';
  const data = await rf.load(from, {saveTo: to, asyncSave: false});
  data.val.abc = 'ghi';
  data.val.deep.nested.thing = 456;

  expect(JSON.parse((await fs.promises.readFile(to)).toString())).toEqual(testObject);
})

test('YAML ReactiveFile', async () => {
  const from = __dirname + '/fixtures/yamlfile.yml';
  const to = __dirname + '/temp/yamlfile.yml';
  const data = await rf.load(from, {saveTo: to, asyncSave: false});
  data.val.abc = 'ghi';
  data.val.deep.nested.thing = 456;

  expect(yml.safeLoad((await fs.promises.readFile(to)).toString())).toEqual(testObject);
})

test('TOML ReactiveFile', async () => {
  const from = __dirname + '/fixtures/tomlfile.toml';
  const to = __dirname + '/temp/tomlfile.toml';
  const data = await rf.load(from, {saveTo: to, asyncSave: false});
  data.val.abc = 'ghi';
  data.val.deep.nested.thing = 456;

  expect(toml.parse((await fs.promises.readFile(to)).toString())).toEqual(testObject);
})

test('XML ReactiveFile', async () => {
  const from = __dirname + '/fixtures/xmlfile.xml';
  const to = __dirname + '/temp/xmlfile.xml';
  const data = await rf.load(from, {saveTo: to, asyncSave: false});
  data.val.abc = 'ghi';
  data.val.deep.nested.thing = 456;

  expect(xml.parse((await fs.promises.readFile(to)).toString())).toEqual(testObject);
})

test('non-deep reactiveness', async () => {
  const from = __dirname + '/fixtures/jsonfile.json';
  const to = __dirname + '/temp/jsonfile.json';
  const data = await rf.load(from, {saveTo: to, deep: false, asyncSave: false});
  data.val.abc = 'ghi';
  data.val.deep.nested.thing = 456;

  expect(JSON.parse((await fs.promises.readFile(to)).toString())).toEqual(
    JSON.parse('{"abc": "ghi", "deep": {"nested": {"thing": 123}}, "array": [1, 4, 9]}')
  );
})

// afterAll(async () => {
//   fs.rmdirSync(__dirname + '/temp', {recursive: true});
// });