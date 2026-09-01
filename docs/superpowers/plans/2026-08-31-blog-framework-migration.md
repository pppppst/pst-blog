# Blog Framework Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the incomplete local Hexo skeleton with the approved full blog framework while preserving pst's identity and excluding all reference-authored content.

**Architecture:** Vendor the approved reference theme snapshot and build scripts, personalize configuration and routes, then deploy through separate source and publish repositories. Static contract tests verify routes and output; GitHub repository settings complete the external integrations.

**Tech Stack:** Node.js 20, pnpm 10, Hexo 8.1.1, Butterfly 5.5.4, Node test runner, GitHub Actions, Giscus

**Spec:** `docs/superpowers/specs/2026-08-31-blog-framework-migration-design.md`

## Global Constraints

- Do not copy reference-authored posts, memos, about text, friend links, avatars, QR codes, email addresses, repository IDs, or Giscus IDs.
- Preserve `pppppst`, `pst's Blog`, `https://pppppst.github.io`, existing about text, existing avatar assets, and categories.
- Use source repository `pppppst/pst-blog` and publish repository `pppppst/pppppst.github.io`.
- Keep the vendored Butterfly 5.5.4 snapshot's Apache-2.0 license and credit the framework source in README.

---

### Task 1: Establish executable site contracts

**Files:**
- Create: `test/site-contract.test.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: generated files in `public/`
- Produces: `pnpm test` and `pnpm run verify` commands

- [ ] Write tests for public routes, identity, search/RSS/SEO artifacts, and reference-content exclusion.
- [ ] Run `node --test test/site-contract.test.js` and confirm failure because `/blog/`, `/memos/`, and generated artifacts are absent.
- [ ] Add package scripts only after the migration makes the contracts satisfiable.

### Task 2: Migrate framework and personalize content

**Files:**
- Modify: `_config.yml`, `_config.butterfly.yml`, `package.json`, `themes/butterfly/**`
- Create: `scripts/**`, `tools/verify-feed.js`, `source/index.md`, `source/memos/index.md`, `source/link/index.md`, `source/_data/shuoshuo.yml`
- Preserve: `source/about/index.md`, `source/img/avatar1.png`, `source/img/avatar2.png`, `source/categories/index.md`

**Interfaces:**
- Consumes: Markdown posts and memo YAML
- Produces: `/`, `/blog/`, `/categories/`, `/tags/`, `/archives/`, `/memos/`, `/link/`

- [ ] Vendor the reference theme snapshot without its personal images or nested Git metadata.
- [ ] Copy build scripts and page shells while replacing all author-specific configuration.
- [ ] Restore categories in navigation, generators, and aside cards.
- [ ] Remove the local Hello World example and initialize memos as an empty YAML list.
- [ ] Configure `Asia/Shanghai`, local search, Atom, sitemaps, robots, OG images, and deployment target.

### Task 3: Add guarded GitHub automation

**Files:**
- Create: `.github/workflows/deploy-from-source.yml`, `.github/workflows/comment-email-notify.yml`, `.github/workflows/search-engine-ping.yml`, `.github/workflows/retry-pages-deploy.yml`
- Modify: `scripts/events/sync_comment_notify_workflow.js`, `README.md`

**Interfaces:**
- Consumes: documented GitHub Secrets and enable variables
- Produces: deploy, comment email, rebuild dispatch, search ping, and retry workflows

- [ ] Personalize both repository names and remove all reference credentials.
- [ ] Gate publish-side integrations with `ENABLE_COMMENT_REBUILD`, `ENABLE_COMMENT_EMAIL`, `ENABLE_SEARCH_PING`, and `ENABLE_PAGES_RETRY`.
- [ ] Document exact repository settings, secret scopes, Giscus setup, and staged enablement order.

### Task 4: Verify local behavior and artifacts

**Files:**
- Modify: `test/site-contract.test.js`, `package.json`

**Interfaces:**
- Consumes: complete generated site
- Produces: repeatable build and verification evidence

- [ ] Run `pnpm install --frozen-lockfile`.
- [ ] Run `pnpm run clean && pnpm run build`.
- [ ] Run `pnpm test` and `pnpm run verify`.
- [ ] Inspect representative desktop and mobile pages and verify the generated OG image dimensions.
- [ ] Scan tracked source and generated output for reference identity and report external GitHub setup that remains user-owned.
