# Blog Framework Migration Design

## Goal

Adopt the complete framework from `SpeechlessPanda/blog-s-code` without copying its authored content or identity. Preserve pst's existing about text, avatars, categories, and GitHub Pages identity.

## Architecture

The site uses Node.js 20, pnpm 10, Hexo 8.1.1, and the reference repository's vendored Butterfly 5.5.4 snapshot. The root page renders the existing about content, the post index moves to `/blog/`, and categories remain enabled alongside tags, archives, memos, and links.

Build-time Hexo scripts generate Atom RSS, Open Graph images, memo search entries, stable memo pages, and comment counts. A source repository (`pppppst/pst-blog`) builds and deploys static output to `pppppst/pppppst.github.io`; publish-side workflows handle comment mail, comment-triggered rebuilds, search-engine pings, and Pages retry.

## Content Boundary

Only framework code, theme code, configuration structure, and workflow structure are reused. Reference posts, memos, about text, friend links, contact details, avatars, QR codes, repository IDs, Giscus IDs, and other personal identifiers are excluded. The local default Hello World post is removed.

## External Configuration

The source repository uses `PAGES_DEPLOY_TOKEN` and `GH_DISCUSSION_TOKEN`. The publish repository uses `SOURCE_DEPLOY_PAT`, SMTP secrets, `BAIDU_SITE`, and `BAIDU_TOKEN`. Publish-side automations are gated by repository variables until their secrets are configured.

## Verification

Acceptance requires a clean pnpm install, successful Hexo build, passing site-contract and feed tests, correct routes and generated SEO artifacts, 1200x630 OG images for posts, no reference identity in source or output, and manual validation of Giscus and GitHub Actions after repository settings are configured.

