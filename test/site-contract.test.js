const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const publicDir = path.join(root, 'public')

function readPublic(relativePath) {
  return fs.readFileSync(path.join(publicDir, relativePath), 'utf8')
}

test('build exposes the approved top-level routes', () => {
  for (const route of [
    'index.html',
    'blog/index.html',
    'categories/index.html',
    'tags/index.html',
    'archives/index.html',
    'memos/index.html',
    'link/index.html'
  ]) {
    assert.equal(fs.existsSync(path.join(publicDir, route)), true, `missing ${route}`)
  }
})

test('build emits search, feed, and crawler artifacts', () => {
  for (const artifact of ['search.xml', 'atom.xml', 'sitemap.xml', 'baidusitemap.xml', 'robots.txt']) {
    assert.equal(fs.existsSync(path.join(publicDir, artifact)), true, `missing ${artifact}`)
  }
})

test('every generated post references an existing 1200 by 630 Open Graph image', () => {
  const ogDir = path.join(publicDir, 'og-images')
  const posts = fs.readdirSync(publicDir, { recursive: true })
    .filter(file => /^\d{4}[\\/]\d{2}[\\/]\d{2}[\\/][^\\/]+[\\/]index\.html$/.test(file))
  assert.ok(posts.length > 0, 'missing generated posts')

  for (const post of posts) {
    const html = readPublic(post)
    const ogUrl = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1]
    assert.ok(ogUrl, `missing og:image in ${post}`)
    const imageName = decodeURIComponent(new URL(ogUrl).pathname.split('/').pop())
    const png = fs.readFileSync(path.join(ogDir, imageName))
    assert.ok(png.length >= 24, `generated OG image is empty or truncated: ${imageName}`)
    assert.equal(png.readUInt32BE(16), 1200)
    assert.equal(png.readUInt32BE(20), 630)
  }
})

test('home page belongs to pst and does not expose reference identity', () => {
  const home = readPublic('index.html')
  assert.match(home, /pst(?:'s Blog|pppppst)/i)
  assert.doesNotMatch(home, /SpeechlessPanda|859635282@qq\.com/i)
})

test('generated site does not contain the default Hexo example post', () => {
  const files = fs.readdirSync(publicDir, { recursive: true })
    .filter(file => file.endsWith('.html'))
  const html = files.map(file => readPublic(file)).join('\n')
  assert.doesNotMatch(html, /Welcome to Hexo|Quick Start/)
})
