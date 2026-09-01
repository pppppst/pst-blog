const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const root = path.resolve(__dirname, '..')
const publicDir = path.join(root, 'public')

function readPublic(relativePath) {
  return fs.readFileSync(path.join(publicDir, relativePath), 'utf8')
}

function generatedPostRoutes() {
  return fs.readdirSync(publicDir, { recursive: true })
    .filter(file => /^\d{4}[\\/]\d{2}[\\/]\d{2}[\\/][^\\/]+[\\/]index\.html$/.test(file))
}

function firstGeneratedPostRoute() {
  const [post] = generatedPostRoutes()
  assert.ok(post, 'missing generated posts')
  return post
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

test('build serves an optimized WebP home background instead of the PNG', () => {
  const imagePath = path.join(publicDir, 'img', 'home-img.webp')
  assert.equal(fs.existsSync(imagePath), true, 'missing optimized home-img.webp')

  const image = fs.readFileSync(imagePath)
  assert.equal(image.subarray(0, 4).toString('ascii'), 'RIFF')
  assert.equal(image.subarray(8, 12).toString('ascii'), 'WEBP')
  assert.ok(image.length < 600 * 1024, `home-img.webp exceeds 600 KiB: ${image.length} bytes`)

  for (const route of ['index.html', 'blog/index.html', 'archives/index.html', 'categories/index.html']) {
    const html = readPublic(route)
    assert.match(html, /\/img\/home-img\.webp/, route)
    assert.doesNotMatch(html, /\/img\/home-img\.png/, route)
  }
})

test('every generated post references an existing 1200 by 630 Open Graph image', () => {
  const ogDir = path.join(publicDir, 'og-images')
  const posts = generatedPostRoutes()
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

test('author card renders a visible dark GitHub social icon', () => {
  const home = readPublic('index.html')
  assert.match(
    home,
    /<div class="card-info-social-icons"><a class="social-icon" href="https:\/\/github\.com\/pppppst"[^>]*title="GitHub"><i class="fab fa-github" style="color: #24292f;"><\/i><\/a>/
  )
})

test('root landing types its subtitle once and leaves the completed text visible', () => {
  const home = readPublic('index.html')
  const typedCalls = []
  const context = {
    document: { getElementById: () => ({ textContent: '' }) },
    Typed: function (selector, options) {
      typedCalls.push({ selector, options })
      return { destroy() {} }
    },
    btf: {
      addGlobalFn() {},
      getScript() { throw new Error('Typed.js should already be available in this test') }
    }
  }
  context.window = context

  const subtitleScripts = [...home.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map(match => match[1])
    .filter(script => script.includes('window.typedJSFn') || script.includes('function subtitleType'))
  assert.equal(subtitleScripts.length, 2, 'missing generated subtitle scripts')
  vm.runInNewContext(subtitleScripts.join('\n'), context)

  assert.equal(typedCalls.length, 1)
  assert.equal(typedCalls[0].selector, '#subtitle')
  assert.deepEqual(Array.from(typedCalls[0].options.strings), ['风物长宜放眼量'])
  assert.equal(typedCalls[0].options.loop, false)
  assert.equal(typedCalls[0].options.showCursor, false)
})

test('blog subtitle stays static without starting Typed.js', () => {
  const blog = readPublic('blog/index.html')
  const subtitle = { textContent: '' }
  let typedCalls = 0
  const context = {
    document: { getElementById: () => subtitle },
    Typed: function () { typedCalls += 1 },
    btf: { addGlobalFn() {}, getScript() { throw new Error('blog must not request Typed.js') } }
  }
  context.window = context

  const subtitleScripts = [...blog.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map(match => match[1])
    .filter(script => script.includes('window.typedJSFn') || script.includes('function subtitleType'))
  assert.equal(subtitleScripts.length, 2, 'missing generated blog subtitle scripts')
  vm.runInNewContext(subtitleScripts.join('\n'), context)

  assert.equal(subtitle.textContent, '风物长宜放眼量')
  assert.equal(typedCalls, 0)
})

test('root landing hides the hero title while keeping its subtitle and navigation title', () => {
  const home = readPublic('index.html')
  assert.match(home, /<div class="[^\"]*type-landing[^\"]*" id="body-wrap">/)
  assert.match(home, /#body-wrap\.type-landing #site-title\s*\{[^}]*display:\s*none\s*!important/)
  assert.match(home, /<div id="site-subtitle"><span id="subtitle"><\/span><\/div>/)
  assert.match(home, /<span class="site-name">pst's Blog<\/span>/i)

  const blog = readPublic('blog/index.html')
  assert.doesNotMatch(blog, /<div class="page type-landing" id="body-wrap">/)
})

test('home and blog use one fixed home image without gradient page chrome', () => {
  for (const route of ['index.html', 'blog/index.html']) {
    const html = readPublic(route)
    assert.match(html, /<div class="[^\"]*type-home[^\"]*" id="body-wrap">/, route)
    assert.match(html, /\.type-home[^\{]*\{[^}]*url\(['"]?\/img\/home-img\.webp/, route)
    assert.match(html, /\.type-home[^\{]*\{[^}]*background-attachment:\s*fixed/, route)
    assert.match(html, /\.type-home[^\{]*\{[^}]*background-size:\s*cover/, route)
    assert.match(
      html,
      /\.type-home #page-header\.full_page[^\{]*\{[^}]*background:\s*transparent\s*!important/,
      route
    )
    assert.match(
      html,
      /\.type-home #page-header\.nav-fixed #nav[^\{]*\{[^}]*background:\s*transparent\s*!important/,
      route
    )
    assert.match(html, /\.type-home #footer[^\{]*\{[^}]*background:\s*transparent\s*!important/, route)
    assert.match(html, /\.type-home #footer::before[^\{]*\{[^}]*background:\s*transparent\s*!important/, route)
  }
})

test('root landing subtitle uses the pinned Zhuque Fangsong webfont', () => {
  const home = readPublic('index.html')
  assert.match(
    home,
    /https:\/\/cdn\.jsdelivr\.net\/npm\/@free-fonts\/zhuque-fangsong@1\.0\.0\/zhuque-fangsong\.css/
  )
  assert.match(
    home,
    /#body-wrap\.type-landing #site-subtitle\s*\{[^}]*font-family:\s*["']Zhuque Fangsong["'][^}]*font-size:\s*clamp\(1\.4rem,\s*4\.5vw,\s*4rem\)/
  )
})

test('every page renders the site navigation in black with the capitalized site name', () => {
  const routes = [
    'index.html',
    'blog/index.html',
    'archives/index.html',
    'categories/index.html',
    'tags/index.html',
    'link/index.html',
    'memos/index.html',
    firstGeneratedPostRoute()
  ]

  for (const route of routes) {
    const html = readPublic(route)
    assert.match(html, /<span class="site-name">Pst's Blog<\/span>/, route)
    assert.match(
      html,
      /#body-wrap #page-header #nav,\s*#body-wrap #page-header #nav \*\s*\{[^}]*color:\s*#000000\s*!important/,
      route
    )
  }
})

test('home-layout hero titles and subtitles render in black', () => {
  const home = readPublic('index.html')
  const blog = readPublic('blog/index.html')

  for (const html of [home, blog]) {
    assert.match(
      html,
      /#body-wrap\.type-home #page-header\.full_page #site-title,[^}]*#body-wrap\.type-home #page-header\.full_page #subtitle\s*\{[^}]*color:\s*#000000\s*!important/
    )
  }
  assert.match(blog, /<h1 id="site-title">Pst's Blog<\/h1>/)
})

test('section pages share the home banner', () => {
  const sectionRoutes = [
    'categories/index.html',
    'tags/index.html',
    'archives/index.html',
    'link/index.html',
    'memos/index.html',
    'about/index.html'
  ]
  for (const route of sectionRoutes) {
    const html = readPublic(route)
    assert.match(
      html,
      /<header class="not-home-page fixed" id="page-header" style="background-image: url\(\/img\/home-img\.webp\);">/,
      route
    )
  }

  const sectionPage = readPublic('categories/index.html')
  assert.match(sectionPage, /#page-header\.not-home-page\s*\{[^}]*url\('\/img\/home-img\.webp'\)[^}]*\}/)
  assert.match(sectionPage, /\[data-theme='dark'\] #page-header\.not-home-page\s*\{[^}]*url\('\/img\/home-img\.webp'\)[^}]*\}/)
})

test('post detail pages use one fixed home image without gradient page chrome', () => {
  const post = readPublic(firstGeneratedPostRoute())
  assert.match(post, /<div class="post" id="body-wrap">/)
  assert.match(post, /#body-wrap\.post[^\{]*\{[^}]*url\(['"]?\/img\/home-img\.webp/)
  assert.match(post, /#body-wrap\.post[^\{]*\{[^}]*background-attachment:\s*fixed/)
  assert.match(post, /#body-wrap\.post[^\{]*\{[^}]*background-size:\s*cover/)
  assert.match(post, /#body-wrap\.post #page-header\.post-bg[^\{]*\{[^}]*background:\s*transparent\s*!important/)
  assert.match(post, /#body-wrap\.post #page-header\.post-bg:before[^\{]*\{[^}]*background:\s*transparent\s*!important/)
  assert.match(post, /#body-wrap\.post #page-header\.nav-fixed #nav[^\{]*\{[^}]*background:\s*transparent\s*!important/)
  assert.match(post, /#body-wrap\.post #footer[^\{]*\{[^}]*background:\s*transparent\s*!important/)
  assert.match(post, /#body-wrap\.post #footer::before[^\{]*\{[^}]*background:\s*transparent\s*!important/)
})

test('post detail title and metadata render in black over the home image', () => {
  const post = readPublic(firstGeneratedPostRoute())
  assert.match(
    post,
    /#body-wrap\.post #page-header\.post-bg #post-info,\s*#body-wrap\.post #page-header\.post-bg #post-info \*\s*\{[^}]*color:\s*#000000\s*!important/
  )
})

test('only selected section pages use the fixed full-page home background', () => {
  const backgroundPages = new Map([
    ['archives/index.html', 'type-archive'],
    ['categories/index.html', 'type-categories'],
    ['tags/index.html', 'type-tags'],
    ['link/index.html', 'type-link'],
    ['memos/index.html', 'type-shuoshuo']
  ])

  for (const [route, pageClass] of backgroundPages) {
    const html = readPublic(route)
    assert.match(html, new RegExp(`<div class="[^"]*${pageClass}[^"]*" id="body-wrap">`), route)
    assert.match(html, new RegExp(`\\.${pageClass}[^{]*\\{[^}]*url\\(['"]?\\/img\\/home-img\\.webp`), route)
    assert.match(html, new RegExp(`\\.${pageClass}[^{]*\\{[^}]*background-attachment:\\s*fixed`), route)
    assert.match(html, new RegExp(`\\.${pageClass}[^{]*\\{[^}]*background-size:\\s*cover`), route)
    assert.match(
      html,
      new RegExp(`\\.${pageClass} #page-header\\.not-home-page[^{]*\\{[^}]*background:\\s*transparent\\s*!important`),
      route
    )
    assert.match(
      html,
      new RegExp(`\\.${pageClass} #page-header\\.nav-fixed #nav[^{]*\\{[^}]*background:\\s*transparent\\s*!important`),
      route
    )
    assert.match(
      html,
      new RegExp(`\\.${pageClass} #footer[^{]*\\{[^}]*background:\\s*transparent\\s*!important`),
      route
    )
    assert.match(
      html,
      new RegExp(`\\.${pageClass} #footer::before[^{]*\\{[^}]*background:\\s*transparent\\s*!important`),
      route
    )
    assert.match(
      html,
      new RegExp(`\\.${pageClass} #page-header\\.not-home-page #site-title[^{]*\\{[^}]*color:\\s*#000000\\s*!important`),
      route
    )
  }

  const unchangedPages = [
    'index.html',
    'blog/index.html',
    'about/index.html',
    firstGeneratedPostRoute()
  ]
  for (const route of unchangedPages) {
    assert.doesNotMatch(
      readPublic(route),
      /<div class="[^"]*type-(?:archive|categories|tags|link|shuoshuo)[^"]*" id="body-wrap">/,
      route
    )
  }
})

test('generated site does not contain the default Hexo example post', () => {
  const files = fs.readdirSync(publicDir, { recursive: true })
    .filter(file => file.endsWith('.html'))
  const html = files.map(file => readPublic(file)).join('\n')
  assert.doesNotMatch(html, /Welcome to Hexo|Quick Start/)
})
