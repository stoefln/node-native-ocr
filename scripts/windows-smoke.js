const assert = require('assert')
const path = require('path')
const fs = require('fs-extra')
const {recognize} = require('../src')

const fixtures = file => path.join(__dirname, '..', 'test', 'fixtures', file)

async function main() {
  const buffer = await fs.readFile(fixtures('test.jpg'))

  const txt = await recognize(buffer, {lang: 'eng'})
  assert.strictEqual(typeof txt, 'string')

  const tsv = await recognize(buffer, {lang: 'eng', format: 'tsv'})
  assert.strictEqual(typeof tsv, 'string')

  console.log('Windows OCR smoke test passed')
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
