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
  const result = await recognize(buffer, {lang: ['eng', 'ita']})
  //console.timeEnd('recognize') // 180ms
  t.is(result, '“Creativity is the\ngreatest rebellion in\nexistence.”\n\nOsho')
})

test('recognize with tsv output', async t => {
  //console.time('readfile')
  const buffer = await fs.readFile(nodeNativeOcrJpg)
  //console.timeEnd('readfile') // 8.422ms
  //console.time('recognize')
  const result = await recognize(buffer, {lang: 'eng', format: 'tsv'})
  //console.timeEnd('recognize') // 180ms
  t.is(result, '1\t1\t0\t0\t0\t0\t0\t0\t999\t1339\t-1\t\n2\t1\t1\t0\t0\t0\t163\t451\t420\t369\t-1\t\n3\t1\t1\t1\t0\t0\t163\t451\t420\t147\t-1\t\n4\t1\t1\t1\t1\t0\t164\t451\t348\t46\t-1\t\n5\t1\t1\t1\t1\t1\t164\t451\t224\t46\t92\t“Creativity\n5\t1\t1\t1\t1\t2\t400\t452\t32\t36\t90\tis\n5\t1\t1\t1\t1\t3\t446\t451\t66\t37\t92\tthe\n4\t1\t1\t1\t2\t0\t163\t506\t420\t46\t-1\t\n5\t1\t1\t1\t2\t1\t163\t512\t167\t40\t91\tgreatest\n5\t1\t1\t1\t2\t2\t343\t506\t186\t37\t91\trebellion\n5\t1\t1\t1\t2\t3\t543\t507\t40\t35\t92\tin\n4\t1\t1\t1\t3\t0\t164\t561\t224\t37\t-1\t\n5\t1\t1\t1\t3\t1\t164\t561\t224\t37\t92\texistence.”\n3\t1\t1\t2\t0\t0\t175\t784\t111\t36\t-1\t\n4\t1\t1\t2\t1\t0\t175\t784\t111\t36\t-1\t\n5\t1\t1\t2\t1\t1\t175\t784\t111\t36\t91\tOsho')
})

test('recognize, multiple languages', async t => {
  const buffer = await fs.readFile(nodeNativeOcrJpg)
  const result = await recognize(buffer, {
    lang: [
      'eng',
      'ita'
    ]
  })
  t.is(result, '“Creativity is the\ngreatest rebellion in\nexistence.”\n\nOsho')
})

test('recognize with invalid buffer', async t => {
  const invalidBuffer = Buffer.from('not a real image');
  const error = await t.throwsAsync(async () => {
    await recognize(invalidBuffer);
  });
  t.is(error.code, 'ERR_READ_IMAGE');
  t.is(error.message, 'Fails to read image.');
})