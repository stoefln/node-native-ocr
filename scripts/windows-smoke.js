const assert = require('assert')
const path = require('path')
const fs = require('fs-extra')
const {recognize} = require('../src')

const fixtures = file => path.join(__dirname, '..', 'test', 'fixtures', file)

const expectedTxt = '“Creativity is the\ngreatest rebellion in\nexistence.”\n\nOsho'
const expectedTsv = '1\t1\t0\t0\t0\t0\t0\t0\t999\t1339\t-1\t\n2\t1\t1\t0\t0\t0\t163\t451\t420\t369\t-1\t\n3\t1\t1\t1\t0\t0\t163\t451\t420\t147\t-1\t\n4\t1\t1\t1\t1\t0\t164\t451\t348\t46\t-1\t\n5\t1\t1\t1\t1\t1\t164\t451\t224\t46\t92\t“Creativity\n5\t1\t1\t1\t1\t2\t400\t452\t32\t36\t90\tis\n5\t1\t1\t1\t1\t3\t446\t451\t66\t37\t92\tthe\n4\t1\t1\t1\t2\t0\t163\t506\t420\t46\t-1\t\n5\t1\t1\t1\t2\t1\t163\t512\t167\t40\t91\tgreatest\n5\t1\t1\t1\t2\t2\t343\t506\t186\t37\t91\trebellion\n5\t1\t1\t1\t2\t3\t543\t507\t40\t35\t92\tin\n4\t1\t1\t1\t3\t0\t164\t561\t224\t37\t-1\t\n5\t1\t1\t1\t3\t1\t164\t561\t224\t37\t92\texistence.”\n3\t1\t1\t2\t0\t0\t175\t784\t111\t36\t-1\t\n4\t1\t1\t2\t1\t0\t175\t784\t111\t36\t-1\t\n5\t1\t1\t2\t1\t1\t175\t784\t111\t36\t91\tOsho'

async function main() {
  const buffer = await fs.readFile(fixtures('test.jpg'))

  const txt = await recognize(buffer, {lang: 'eng'})
  assert.strictEqual(txt, expectedTxt)

  const tsv = await recognize(buffer, {lang: 'eng', format: 'tsv'})
  assert.strictEqual(tsv, expectedTsv)

  console.log('Windows OCR smoke test passed')
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
