import ReactiveFile from '../src';
import * as fs from 'fs';
import * as yml from 'js-yaml';
import * as xml from 'fast-xml-parser';
import * as toml from '@iarna/toml';

test('load JSON file', async () => {
  expect(ReactiveFile.loadSync(__dirname + '/fixtures/jsonfile.json')).toBeDefined()
  expect(await ReactiveFile.load(__dirname + '/fixtures/jsonfile.json')).toBeDefined()
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
  const data = await ReactiveFile.load(from, {saveTo: to, asyncSave: false});
  data.val.abc = 'ghi';
  data.val.deep.nested.thing = 456;
  
  expect(JSON.parse((await fs.promises.readFile(to)).toString())).toEqual(testObject);
})

test('YAML ReactiveFile', async () => {
  const from = __dirname + '/fixtures/yamlfile.yml';
  const to = __dirname + '/temp/yamlfile.yml';
  const data = await ReactiveFile.load(from, {saveTo: to, asyncSave: false});
  data.val.abc = 'ghi';
  data.val.deep.nested.thing = 456;

  expect(yml.safeLoad((await fs.promises.readFile(to)).toString())).toEqual(testObject);
})

test('TOML ReactiveFile', async () => {
  const from = __dirname + '/fixtures/tomlfile.toml';
  const to = __dirname + '/temp/tomlfile.toml';
  const data = await ReactiveFile.load(from, {saveTo: to, asyncSave: false});
  data.val.abc = 'ghi';
  data.val.deep.nested.thing = 456;

  expect(toml.parse((await fs.promises.readFile(to)).toString())).toEqual(testObject);
})

test('XML ReactiveFile', async () => {
  const from = __dirname + '/fixtures/xmlfile.xml';
  const to = __dirname + '/temp/xmlfile.xml';
  const data = await ReactiveFile.load(from, {saveTo: to, asyncSave: false});
  data.val.abc = 'ghi';
  data.val.deep.nested.thing = 456;

  expect(xml.parse((await fs.promises.readFile(to)).toString())).toEqual(testObject);
})

test('non-deep reactivity', async () => {
  const from = __dirname + '/fixtures/jsonfile.json';
  const to = __dirname + '/temp/jsonfile.json';
  const data = await ReactiveFile.load(from, {saveTo: to, deep: false, asyncSave: false});
  data.val.abc = 'ghi';
  data.val.deep.nested.thing = 456;

  expect(JSON.parse((await fs.promises.readFile(to)).toString())).toEqual(
    {...testObject, deep: {nested: {thing: 123}}}
  );
})

test('add key and .react()', async () => {
  const from = __dirname + '/fixtures/jsonfile.json';
  const to = __dirname + '/temp/jsonfile.json';
  const data = await ReactiveFile.load(from, {saveTo: to, asyncSave: false});
  data.val.abc = 'ghi';
  data.val.deep.nested.thing = 456;

  expect(JSON.parse((await fs.promises.readFile(to)).toString())).toEqual(testObject);

  data.val.newkey = 123;
  data.react();

  expect(JSON.parse((await fs.promises.readFile(to)).toString())).toEqual({...testObject, newkey: 123});
})

test('.assignType()', async () => {
  {
    const from = __dirname + '/fixtures/customjsonfile.custom';
    const to = __dirname + '/temp/customjsonfile.custom';

    ReactiveFile.assignType('mytype', 'json');

    const data = await ReactiveFile.load(from, {saveTo: to, asyncSave: false, type: 'mytype'});
    data.val.abc = 'ghi';
    data.val.deep.nested.thing = 456;

    expect(JSON.parse((await fs.promises.readFile(to)).toString())).toEqual(testObject);
  }
  {
    const from = __dirname + '/fixtures/customjsonfile.custom';
    const to = __dirname + '/temp/customjsonfile.custom';

    ReactiveFile.assignType('custom', 'json');

    const data = await ReactiveFile.load(from, {saveTo: to, asyncSave: false});
    data.val.abc = 'ghi';
    data.val.deep.nested.thing = 456;

    expect(JSON.parse((await fs.promises.readFile(to)).toString())).toEqual(testObject);
  }
})

test('$ alias', async () => {
  const from = __dirname + '/fixtures/jsonfile.json';
  const to = __dirname + '/temp/jsonfile.json';
  const data = await ReactiveFile.load(from, {saveTo: to, asyncSave: false});
  data.$.abc = 'ghi';
  data.$.deep.nested.thing = 456;

  expect(JSON.parse((await fs.promises.readFile(to)).toString())).toEqual(testObject);
})

// comment this out for debugging purposes
afterEach(async () => {
  fs.rmdirSync(__dirname + '/temp', {recursive: true});
});