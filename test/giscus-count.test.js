const test = require('node:test')
const assert = require('node:assert/strict')

const { discussionCommentCount } = require('../lib/giscus-count')

test('a Giscus discussion with no replies still counts its initial comment', () => {
  assert.equal(discussionCommentCount({ comments: { totalCount: 0 } }), 1)
})

test('Giscus count includes the discussion body and all replies', () => {
  assert.equal(discussionCommentCount({ comments: { totalCount: 3 } }), 4)
})
