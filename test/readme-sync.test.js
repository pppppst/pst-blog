const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

test('README sync creates the publish directory before copying', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pst-readme-sync-'))
  const publicDir = path.join(root, 'public')
  fs.writeFileSync(path.join(root, 'README.md'), '# test')

  let afterGenerate
  global.hexo = {
    base_dir: root,
    public_dir: publicDir,
    log: { info() {}, warn() {} },
    extend: {
      filter: {
        register(name, callback) {
          if (name === 'after_generate') afterGenerate = callback
        }
      }
    }
  }

  const modulePath = require.resolve('../scripts/events/sync_readme_to_public')
  delete require.cache[modulePath]
  require(modulePath)
  afterGenerate()

  assert.equal(fs.readFileSync(path.join(publicDir, 'README.md'), 'utf8'), '# test')
  delete global.hexo
})
