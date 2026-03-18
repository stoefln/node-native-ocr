const assert = require('assert')
const path = require('path')
const fs = require('fs-extra')

const {recognize, __internal} = require('../src')

const fixtures = file => path.join(__dirname, '..', 'test', 'fixtures', file)

async function main() {
  assert.strictEqual(__internal.getBackendName(), 'native')

  const buffer = await fs.readFile(fixtures('test.jpg'))

  const txt = await recognize(buffer, {lang: 'eng'})
  assert.strictEqual(typeof txt, 'string')
  assert.ok(txt.length > 0)

  const tsv = await recognize(buffer, {lang: 'eng', format: 'tsv'})
  assert.strictEqual(typeof tsv, 'string')
  assert.ok(tsv.includes('\t'))

  console.log('Windows OCR smoke test passed')
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
