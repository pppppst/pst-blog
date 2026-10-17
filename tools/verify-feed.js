// 构建后运行 `node tools/verify-feed.js`。
// 断言 atom.xml 满足 RSS 阅读器可识别的身份标识要求：
//   1. 每个条目的 <link> 必须唯一（link-keyed 阅读器用它识别条目）
//   2. 每个条目的 <id> 必须唯一
//   3. 碎碎念条目 link 必须指向实际生成的独立页，且不能遗漏数据里的碎碎念
// 失败时以非零码退出并列出重复项。
'use strict'

const fs = require('fs')
const path = require('path')

const feedPath = path.join(__dirname, '..', 'public', 'atom.xml')
if (!fs.existsSync(feedPath)) {
  console.error('[verify-feed] 未找到 public/atom.xml，请先运行 hexo generate')
  process.exit(1)
}

const xml = fs.readFileSync(feedPath, 'utf8')
const entries = xml.split('<entry>').slice(1)
let failed = false

function extractAll (re) {
  return entries.map(e => { const m = re.exec(e); return m && m[1] }).filter(Boolean)
}

function assertUnique (label, values) {
  const seen = new Map()
  for (const v of values) seen.set(v, (seen.get(v) || 0) + 1)
  const dups = [...seen.entries()].filter(([, c]) => c > 1)
  if (dups.length) {
    failed = true
    console.error(`[verify-feed] ✗ ${label} 不唯一，重复 ${dups.length} 项:`)
    dups.forEach(([v, c]) => console.error(`    x${c}  ${decodeURIComponent(v)}`))
  } else {
    console.log(`[verify-feed] ✓ ${label} 唯一（${values.length} 个条目）`)
  }
}

const links = extractAll(/<link href="([^"]*)"/)
const ids = extractAll(/<id>([^<]*)<\/id>/)

assertUnique('条目 <link>', links)
assertUnique('条目 <id>', ids)

if (!entries.length || links.length !== entries.length || ids.length !== entries.length) {
  failed = true
  console.error('[verify-feed] ✗ 订阅源为空，或有条目缺少 id/link')
}

// Require real local pages for every reader-visible URL, not just unique strings.
const publicDir = path.resolve(__dirname, '..', 'public')
for (const link of links) {
  try {
    const url = new URL(link.replaceAll('&amp;', '&'))
    if (!/^https?:$/.test(url.protocol) || url.search || url.hash) throw new Error('非路径式 HTTP 地址')
    const relativePath = decodeURIComponent(url.pathname).replace(/^\/+/, '')
    const target = path.resolve(publicDir, relativePath, relativePath.endsWith('/') ? 'index.html' : '')
    if (!target.startsWith(publicDir + path.sep) || !fs.existsSync(target)) throw new Error('没有对应的生成页面')
  } catch (error) {
    failed = true
    console.error(`[verify-feed] ✗ 条目链接不可用：${link}（${error.message}）`)
  }
}

// 碎碎念条目必须使用路径式唯一地址 /memos/<时间戳>/（不能共用 /memos/，也不能用
// #fragment 或 ?query——RSSFlow 丢 fragment，部分阅读器丢 query，路径是唯一普适成分）
const memoLinks = links.filter(l => l.includes('/memos'))
const badMemoLinks = memoLinks.filter(l => !/\/memos\/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}[^/]*\/$/.test(l))
if (badMemoLinks.length) {
  failed = true
  console.error(`[verify-feed] ✗ ${badMemoLinks.length} 个碎碎念条目缺少路径式时间戳地址`)
} else if (memoLinks.length) {
  console.log(`[verify-feed] ✓ ${memoLinks.length} 个碎碎念条目均为路径式唯一地址`)
}

// The old generator silently skipped Date objects; uniqueness alone accepted
// an apparently valid feed with every memo missing. Compare with the build data.
const dbPath = path.join(__dirname, '..', 'db.json')
if (fs.existsSync(dbPath)) {
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'))
  const memos = db.models?.Data?.find(item => item._id === 'shuoshuo')?.data || []
  if (memoLinks.length !== memos.length) {
    failed = true
    console.error(`[verify-feed] ✗ 数据有 ${memos.length} 条碎碎念，订阅源只有 ${memoLinks.length} 条`)
  } else {
    console.log(`[verify-feed] ✓ 碎碎念完整：${memos.length} 条，所有订阅链接均有生成页面`)
  }
}

process.exit(failed ? 1 : 0)
