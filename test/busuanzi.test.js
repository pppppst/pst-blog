const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

function client() {
  const listeners = new Map()
  const scripts = []
  const timers = new Map()
  const fields = Object.fromEntries(['site_pv', 'site_uv', 'page_pv'].map(key => [key, { textContent: '', innerHTML: '', title: '' }]))
  const location = { pathname: '/' }
  const document = {
    readyState: 'complete',
    getElementById(id) { return fields[id.replace('busuanzi_value_', '')] },
    createElement() { return { remove() { this.removed = true } } },
    head: { appendChild(script) { scripts.push(script) } },
    addEventListener(type, fn) { listeners.set(type, fn) }
  }
  const context = { document, location, console, URL,
    setTimeout(fn) { const id = timers.size + 1; timers.set(id, fn); return id },
    clearTimeout(id) { timers.delete(id) }
  }
  context.window = context
  const code = fs.readFileSync(path.resolve(__dirname, '../themes/panda/source/js/busuanzi.js'), 'utf8')
  vm.runInNewContext(code, context)
  const callback = script => context[new URL(script.src).searchParams.get('jsonpCallback')]
  return { context, document, fields, scripts, timers, location, code, callback,
    event(type) { listeners.get(type)?.() }
  }
}

test('statistics preserve service identity and the full page referrer', () => {
  const c = client()
  assert.equal(c.scripts.length, 1)
  assert.match(c.scripts[0].src, /^https:\/\/busuanzi\.ibruce\.info\/busuanzi\?jsonpCallback=/)
  assert.equal(c.scripts[0].referrerPolicy, 'no-referrer-when-downgrade')
  c.callback(c.scripts[0])({ site_uv: 11, site_pv: 30, page_pv: 0 })
  assert.equal(c.fields.site_uv.textContent, '11')
  assert.equal(c.fields.site_pv.textContent, '30')
  assert.equal(c.fields.page_pv.textContent, '0')
  assert.equal(c.timers.size, 0)
})

test('a late response from the previous page cannot overwrite the new page counter', () => {
  const c = client()
  const oldCallback = c.callback(c.scripts[0])
  c.event('pjax:send')
  c.location.pathname = '/post/'
  c.event('pjax:complete')
  assert.equal(c.scripts.length, 2)
  c.callback(c.scripts[1])({ site_uv: 11, site_pv: 31, page_pv: 7 })
  oldCallback({ site_uv: 11, site_pv: 30, page_pv: 100 })
  assert.equal(c.fields.page_pv.textContent, '7')
  assert.equal(c.scripts[0].removed, true)
})

test('load errors and timeouts end the spinner without inventing a zero', () => {
  for (const failure of ['error', 'timeout']) {
    const c = client()
    if (failure === 'error') c.scripts[0].onerror()
    else [...c.timers.values()][0]()
    assert.equal(c.fields.page_pv.textContent, '—')
    assert.match(c.fields.page_pv.title, /暂不可用/)
  }
})

test('invalid service values are not displayed as visit counts', () => {
  const c = client()
  c.callback(c.scripts[0])({ site_pv: '<script>', site_uv: -1, page_pv: null })
  for (const field of Object.values(c.fields)) assert.equal(field.textContent, '—')
})

test('re-evaluating the client does not count an extra visit', () => {
  const c = client()
  vm.runInNewContext(c.code, c.context)
  assert.equal(c.scripts.length, 1)
})
