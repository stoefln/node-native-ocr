const test = require('ava').test

import {
  recognize
} from '../src'
import path from 'path'
import fs from 'fs-extra'


const fixtures = file => path.join(__dirname, 'fixtures', file)

const nodeNativeOcrJpg = fixtures('test.jpg')
const non_existing = fixtures('non-existing.jpg')

const test_read_error = (t, e, fn) => {
  t.is(e.code, 'ERR_READ_IMAGE', 'error code not match')
  t.is(e.message, 'Fails to read image.', 'error message not match')
}

test('recognize', async t => {
  //console.time('readfile')
  const buffer = await fs.readFile(nodeNativeOcrJpg)
  //console.timeEnd('readfile') // 8.422ms
  //console.time('recognize')
  const result = await recognize(buffer)
  //console.timeEnd('recognize') // 180ms
  t.is(result, '“Creativity is the\ngreatest rebellion in\nexistence.”\n\nOsho')
})


test('recognize, multiple languages', async t => {
  const buffer = await fs.readFile(nodeNativeOcrJpg)
  const result = await recognize(buffer, {
    lang: [
      'eng',
      'chi_sim'
    ]
  })
  t.is(result, '“Creativity is the\ngreatest rebellion in\nexistence.”\n\nOsho')
})

test('recognize non existing', async t => {
  const buffer = await fs.readFile(non_existing)
  try{

    const result = await recognize(buffer)
    console.log('reeesult', result)
  } catch(e){
    console.log('eeerror', e)
    t.is(true)
  }
})