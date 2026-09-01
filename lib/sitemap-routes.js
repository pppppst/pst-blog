'use strict'

function canonicalizeSitemap(xml, siteUrl, requiredRoutes = []) {
  const base = siteUrl.replace(/\/$/, '')
  const normalized = xml.replace(/<loc>([^<]+)\/index\.html<\/loc>/g, '<loc>$1/</loc>')
  const blocks = normalized.match(/\s*<url>[\s\S]*?<\/url>/g) || []
  const seen = new Set()
  const unique = []

  for (const block of blocks) {
    const location = block.match(/<loc>([^<]+)<\/loc>/)?.[1]
    if (!location || seen.has(location)) continue
    seen.add(location)
    unique.push(block.trim())
  }

  for (const route of requiredRoutes) {
    const location = `${base}${route}`
    if (seen.has(location)) continue
    seen.add(location)
    unique.push(`<url>\n    <loc>${location}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.5</priority>\n  </url>`)
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  ${unique.join('\n\n  ')}\n</urlset>\n`
}

module.exports = { canonicalizeSitemap }
