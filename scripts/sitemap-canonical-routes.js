'use strict'

const { canonicalizeSitemap } = require('../lib/sitemap-routes')

hexo.extend.filter.register('after_generate', async function () {
  const stream = hexo.route.get('sitemap.xml')
  if (!stream) return

  let xml = ''
  for await (const chunk of stream) xml += chunk.toString()
  hexo.route.set('sitemap.xml', canonicalizeSitemap(xml, hexo.config.url, ['/blog/', '/archives/']))
}, 20)
