import AutoFile from '../src';
import * as fs from 'fs';

it('should load JSON file', () => {
  expect(AutoFile.loadSync(__dirname + '/fixtures/jsonfile.json')).toBeDefined()
})

it('should make AutoFile', async () => {
  const p = __dirname + '/fixtures/jsonfile.json';
  const data = AutoFile.loadSync(p, {saveTo: p});
  console.log(data);
  data.val.abc = 'ghi';
  data.val.deep.nested.thing = 456;

  expect(JSON.parse((await fs.promises.readFile(p)).toString())).toEqual(
    JSON.parse('{"abc": "ghi", "deep": {"nested": {"thing": 456}}, "array": [1, 4, 9]}')
  );
})

// afterAll(async () => {
//   fs.rmdirSync(__dirname + '/temp', {recursive: true});
// });