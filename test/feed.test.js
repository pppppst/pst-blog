const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { createRequire } = require('node:module')
const moment = require('moment-timezone')

const feedFile = path.resolve(__dirname, '../themes/panda/scripts/panda/feed.js')

function generate(posts = [], memos = []) {
  let generator
  const collection = {
    sort() { return this }, filter() { return this }, limit() { return this },
    toArray() { return posts }
  }
  const hexo = {
    config: { url: 'https://example.com', title: 'Test', author: 'Author', timezone: 'Asia/Shanghai', language: 'zh-CN' },
    theme: { config: { feed: { enable: true }, memos: { enable: true } }, i18n: { __: () => key => key } },
    extend: { generator: { register(name, callback) { generator = callback } } },
    render: { renderSync: ({ text }) => `<p>${text}</p>` },
    log: { warn() {} }
  }
  vm.runInNewContext(fs.readFileSync(feedFile, 'utf8'), { hexo, require: createRequire(feedFile) })
  return generator.call(hexo, { posts: collection, data: { shuoshuo: memos } })
}

function post(raw, updated = '2026-10-17T12:00:00Z') {
  return {
    title: 'Post', raw, content: '<p>Body</p>',
    date: moment.utc('2026-09-01T00:00:00Z'), updated: moment.utc(updated),
    permalink: 'https://example.com/2026/09/01/post/', path: '2026/09/01/post/'
  }
}

test('RSS identity and updated timestamps ignore checkout mtimes', () => {
  const raw = '---\ntitle: Post\ndate: 2026-09-01\n---\nBody'
  const a = generate([post(raw)])[0].data
  const b = generate([post(raw, '2026-11-01T12:00:00Z')])[0].data
  assert.equal(a, b)
  assert.doesNotMatch(a, /\/u\//)
})

test('an explicit post revision produces one stable hash URL and a real redirect page', () => {
  const raw = '---\ndate: 2026-09-01\nupdated: 2026-10-17\n---\nBody'
  const a = generate([post(raw)])
  const b = generate([post(raw)])
  assert.equal(a[0].data, b[0].data)
  assert.match(a[1].path, /\/u\/[a-f0-9]{10}\/index.html$/)
  assert.match(a[1].data, /http-equiv="refresh"/)
  assert.notEqual(generate([post(raw + '\nRevision')])[1].path, a[1].path)
})

test('unquoted YAML dates and quoted memo dates share the same local-time identity', () => {
  const variants = [new Date('2026-09-02T20:23:00Z'), '2026-09-02 20:23:00', '2026-09-02T20:23', '2026-09-02T20:23:00.000Z']
  const feeds = variants.map(date => generate([], [{ date, content: 'Memo' }])[0].data)
  assert.equal(feeds[0], feeds[1])
  assert.equal(feeds[1], feeds[2])
  assert.equal(feeds[2], feeds[3], 'cached ISO timestamp must retain the original wall-clock time')
  assert.match(feeds[0], /\/memos\/2026-09-02T20-23\//)
  assert.match(feeds[0], /2026-09-02T12:23:00\.000Z/)
})

test('memo dates accept date-only values and skip invalid calendar dates', () => {
  const xml = generate([], [
    { date: '2026-09-02', content: 'Valid' },
    { date: '2026-02-30', content: 'Invalid' }
  ])[0].data
  assert.equal((xml.match(/<entry>/g) || []).length, 1)
  assert.match(xml, /\/memos\/2026-09-02T00-00\//)
})

test('the feed carries an absolute base URL for relative content images', () => {
  assert.match(generate()[0].data, /xml:base="https:\/\/example\.com\/"/)
})
