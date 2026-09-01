# pst's Blog

个人博客源码，记录科研、项目实践、论文阅读与技术学习。

- 站点：https://pppppst.github.io
- 源码：`pppppst/pst-blog`
- 发布：`pppppst/pppppst.github.io`

## 功能

- 首页个人介绍与独立 `/blog/` 文章流
- 分类、标签、归档、友链和碎碎念
- 本地搜索、Atom RSS、sitemap、robots.txt 和文章 OG 分享图
- Giscus 文章及碎碎念评论、评论邮件通知与评论触发重建
- 暗色/阅读模式、PJAX、图片懒加载、灯箱、字数统计和访问统计
- GitHub Actions 双仓自动部署、搜索引擎推送和 Pages 失败重试

## 本地开发

需要 Node.js 20 与 pnpm 10。

```bash
pnpm install
pnpm run server
pnpm run build
pnpm test
pnpm run verify
```

## GitHub 配置

源码仓 `pppppst/pst-blog` 需要：

- Secrets：`PAGES_DEPLOY_TOKEN`、`GH_DISCUSSION_TOKEN`

发布仓 `pppppst/pppppst.github.io` 需要：

- Secrets：`SOURCE_DEPLOY_PAT`、`SMTP_SERVER`、`SMTP_PORT`、`SMTP_USERNAME`、`SMTP_PASSWORD`、`MAIL_FROM`、`MAIL_TO`、`BAIDU_SITE`、`BAIDU_TOKEN`
- Variables：`ENABLE_COMMENT_EMAIL`、`ENABLE_COMMENT_REBUILD`、`ENABLE_SEARCH_PING`、`ENABLE_PAGES_RETRY`

先完成首次静态部署，再为发布仓启用 Discussions、安装 Giscus App、创建评论分类，并把 Giscus 生成的 `repo_id` 与 `category_id` 写入 `themes/butterfly/_config.yml`。配置对应 Secrets 后，将需要启用的 Variables 设为 `true`。

## 来源与许可

站点框架基于 [SpeechlessPanda/blog-s-code](https://github.com/SpeechlessPanda/blog-s-code) 定制；未复制其文章、碎碎念、友链或个人资料。Butterfly 主题遵循仓库内保留的 GPL-3.0 License。
