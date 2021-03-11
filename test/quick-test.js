const recognize = require('../src').recognize

const path  = require('path')
const fs = require('fs-extra')

const fixtures = file => path.join(__dirname, 'fixtures', file)

const nodeNativeOcrJpg = fixtures('test.jpg')
const non_existing = fixtures('non-existing.jpg')

async function test1() {
  //console.time('readfile')
  const buffer = await fs.readFile(nodeNativeOcrJpg)
  //console.timeEnd('readfile') // 8.422ms
  //console.time('recognize')
  const result = await recognize(buffer)
  //console.timeEnd('recognize') // 180ms
  //t.is(result, '“Creativity is the\ngreatest rebellion in\nexistence.”\n\nOsho')
}

async function test2() {
  const buffer = await fs.readFile(nodeNativeOcrJpg)
  const result = await recognize(buffer, {
    lang: [
      'eng',
      'deu'
    ]
  })
  //t.is(result, '“Creativity is the\ngreatest rebellion in\nexistence.”\n\nOsho')
}

async function test3()  {
  try{
    const buffer = await fs.readFile(non_existing)
    const result = await recognize(buffer)
    console.log('reeesult', result)
  } catch(e){
    console.log('eeerror', e)
    //t.is(true)
  }
}

(async() => {
  await test1()
  await test2()
  // await test3()
})()
