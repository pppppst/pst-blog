'use strict'

const fs = require('node:fs')

function isCompleteSfnt(filePath) {
  try {
    const font = fs.readFileSync(filePath)
    if (font.length < 12) return false

    const signature = font.readUInt32BE(0)
    const isTrueType = signature === 0x00010000
    const isOpenType = signature === 0x4f54544f
    if (!isTrueType && !isOpenType) return false

    const tableCount = font.readUInt16BE(4)
    const directoryEnd = 12 + tableCount * 16
    if (tableCount === 0 || directoryEnd > font.length) return false

    for (let offset = 12; offset < directoryEnd; offset += 16) {
      const tableOffset = font.readUInt32BE(offset + 8)
      const tableLength = font.readUInt32BE(offset + 12)
      if (tableOffset + tableLength > font.length) return false
    }
    return true
  } catch {
    return false
  }
}

async function retry(operation, attempts, delayMs = 0, onRetry = () => {}) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (attempt === attempts) break
      onRetry(error, attempt)
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }
  }
  throw lastError
}

module.exports = { isCompleteSfnt, retry }
