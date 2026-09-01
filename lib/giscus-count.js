'use strict'

function discussionCommentCount(discussion) {
  const replies = Number(discussion && discussion.comments && discussion.comments.totalCount) || 0
  return 1 + Math.max(0, replies)
}

module.exports = { discussionCommentCount }
