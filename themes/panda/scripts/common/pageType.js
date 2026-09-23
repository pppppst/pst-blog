'use strict'

function isRelocatedIndex (indexGeneratorPath) {
  if (indexGeneratorPath == null) return false
  const n = String(indexGeneratorPath).replace(/\\/g, '/').replace(/^\/+|\/+$/g, '')
  return n.length > 0
}

function getPageType (page, isHome, indexGeneratorPath) {
  const { layout, tag, category, type, archive } = page || {}
  if (layout) return layout
  if (tag) return 'tag'
  if (category) return 'category'
  if (archive) return 'archive'
  if (type) {
    if (type === 'blog_series') return 'series'
    if (type === 'tags' || type === 'categories' || type === '404') return type
    return 'page'
  }
  // Site: retain the existing full-screen hero on /blog/.
  if (isHome) return 'home'
  return 'post'
}

module.exports = { getPageType, isRelocatedIndex }
