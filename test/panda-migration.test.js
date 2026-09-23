const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')

test('site builds with Panda while retaining the original background and subtitle', () => {
  assert.match(read('_config.yml'), /^theme: panda$/m)
  const home = read('public/index.html')
  assert.match(home, /hexo-theme-panda/)
  assert.match(home, /风物长宜放眼量/)
  assert.match(home, /\/img\/home-img\.webp/)
  assert.match(home, /\/img\/home-dark\.webp/)
})
