const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const { isCompleteSfnt, retry } = require('../lib/font-file')

function makeFont(size) {
  const font = Buffer.alloc(size)
  font.writeUInt32BE(0x00010000, 0)
  font.writeUInt16BE(1, 4)
  font.write('name', 12, 4, 'ascii')
  font.writeUInt32BE(28, 20)
  font.writeUInt32BE(4, 24)
  return font
}

test('font validation rejects a truncated sfnt table', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pst-font-test-'))
  const complete = path.join(dir, 'complete.ttf')
  const truncated = path.join(dir, 'truncated.ttf')
  fs.writeFileSync(complete, makeFont(32))
  fs.writeFileSync(truncated, makeFont(30))

  assert.equal(isCompleteSfnt(complete), true)
  assert.equal(isCompleteSfnt(truncated), false)
})

test('retry resolves after transient failures within the attempt limit', async () => {
  let attempts = 0
  const result = await retry(async () => {
    attempts += 1
    if (attempts < 3) throw new Error('temporary network failure')
    return 'downloaded'
  }, 3)

  assert.equal(result, 'downloaded')
  assert.equal(attempts, 3)
})
