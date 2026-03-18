const assert = require('assert')
const path = require('path')
const fs = require('fs-extra')

const {recognize, __internal} = require('../src')

const fixtures = file => path.join(__dirname, '..', 'test', 'fixtures', file)
const ITERATIONS = 20

process.on('uncaughtException', error => {
  console.error('uncaughtException in windows-native-harness')
  console.error(error && error.stack ? error.stack : error)
  process.exitCode = 1
})

process.on('unhandledRejection', error => {
  console.error('unhandledRejection in windows-native-harness')
  console.error(error && error.stack ? error.stack : error)
  process.exitCode = 1
})

async function main() {
  console.log('windows-native-harness: backend check')
  assert.strictEqual(__internal.getBackendName(), 'native')

  console.log('windows-native-harness: read fixture')
  const buffer = await fs.readFile(fixtures('test.jpg'))

  for (let index = 0; index < ITERATIONS; index += 1) {
    console.log(`windows-native-harness: txt iteration ${String(index + 1)}/${String(ITERATIONS)}`)
    const text = await recognize(buffer, {lang: 'eng'})
    assert.strictEqual(typeof text, 'string')
    assert.ok(text.length > 0)
  }

  console.log('windows-native-harness: tsv iteration')
  const tsv = await recognize(buffer, {lang: 'eng', format: 'tsv'})
  assert.strictEqual(typeof tsv, 'string')
  assert.ok(tsv.includes('\t'))

  console.log(`Windows native harness passed (${String(ITERATIONS)} txt runs + 1 tsv run)`)
}

main().catch(error => {
  console.error('windows-native-harness: main failed')
  console.error(error && error.stack ? error.stack : error)
  process.exitCode = 1
})