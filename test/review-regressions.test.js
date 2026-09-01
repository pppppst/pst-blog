const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8')

test('Giscus remains disabled until its generated IDs are configured', () => {
  const config = read('_config.butterfly.yml')
  assert.match(config, /comments:\s+[\s\S]*?use:\s*(?:#.*)?\r?\n/)
  assert.doesNotMatch(config, /comments:\s+[\s\S]*?use:\s*Giscus/)
})

test('pnpm build policy and CI use one exact package manager version', () => {
  const pkg = JSON.parse(read('package.json'))
  const workspace = read('pnpm-workspace.yaml')
  const workflow = read('.github/workflows/deploy-from-source.yml')
  assert.equal(pkg.packageManager, 'pnpm@10.18.3')
  assert.match(workspace, /onlyBuiltDependencies:\s+- hexo-util/)
  assert.match(workspace, /ignoredBuiltDependencies:[\s\S]*- ejs[\s\S]*- fsevents[\s\S]*- highlight\.js/)
  assert.match(workflow, /version:\s*10\.18\.3/)
})

test('deployment validates the build and prevents stale concurrent publishes', () => {
  const workflow = read('.github/workflows/deploy-from-source.yml')
  assert.match(workflow, /concurrency:/)
  assert.match(workflow, /pnpm test/)
  assert.match(workflow, /pnpm run verify/)
})

test('SMTP validation passes secrets through environment variables', () => {
  const workflow = read('.github/workflows/comment-email-notify.yml')
  assert.doesNotMatch(workflow, /test -n "\$\{\{ secrets\./)
  assert.match(workflow, /SMTP_PASSWORD:\s*\$\{\{ secrets\.SMTP_PASSWORD \}\}/)
  assert.match(workflow, /test -n "\$SMTP_PASSWORD"/)
})

test('sitemap contains canonical blog and archive routes exactly once', () => {
  const sitemap = read('public/sitemap.xml')
  for (const url of ['https://pppppst.github.io/', 'https://pppppst.github.io/blog/', 'https://pppppst.github.io/archives/']) {
    assert.equal(sitemap.split(`<loc>${url}</loc>`).length - 1, 1, url)
  }
  assert.doesNotMatch(sitemap, /<loc>https:\/\/pppppst\.github\.io\/index\.html<\/loc>/)
})
