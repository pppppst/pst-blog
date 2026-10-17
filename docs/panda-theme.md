# Panda 主题维护

当前主题为 Panda 1.1.6，上游提交为
`208dbaf83751f6760adc6afd5c588060c616f637`。
采用 `themes/panda/` 内置源码，不使用 npm 主题包；构建时的 vendored 提示符合预期。
上游 LICENSE、NOTICE 保持原样。旧 `themes/butterfly/` 和 `_config.butterfly.yml` 保留为未启用的旧版快照。

## 配置与内容

- `_config.yml` 选择 `theme: panda`，站点地址、文章链接及部署配置保持原样。
- `_config.panda.yml` 合并旧主题配置与站点覆盖，包括原文字、菜单、头像、背景、颜色、注入样式及 Giscus 设置。
- 文章正文、碎碎念、个人介绍与图片保持原样。《生命在于运动，受伤在于运动》原 `date: 2026-09-20 201:30:00` 非法，会使干净构建产生不同日期和网址；现写为站点本地时间 `2026-09-28 17:08:07.495`（对应线上原有精确发布时间 `2026-09-28T09:08:07.495Z`），保留线上 9 月 28 日的日期和文章链接。
- 关闭 Panda 默认渐变，沿用原明暗背景及固定背景显示方式。
- 关闭自动系列聚合，保持现有文章列表与链接。
- RSS 和碎碎念独立页使用 Panda 内置生成器；旧 `scripts/atom-feed.js` 在 Panda 下不注册，避免重复生成。碎碎念搜索注入及评论计数继续由站点脚本负责。
- OG 图片继续使用站点现有字体下载和校验逻辑，生成器与 helper 改为 `site-og-image`、`site_og_image_url`，避免与 Panda 注册名称冲突。
- 最新碎碎念卡片使用 Panda 自带 helper；新标签打开链接继续使用站点原脚本。

## 与上游源码的定制差异

以下文件为保留原显示及站点功能而修改，更新主题时需保留：

1. `scripts/common/pageType.js`：博客列表保留 home 类型及全屏背景。
2. `layout/includes/layout.pug`：保留背景 CSS 所依赖的 `type-home`、`type-archive` 类名。
3. `layout/includes/third-party/subtitle.pug`：首页副标题仅播放一次；博客列表静态显示；避免重复追加副标题；安全销毁 Typed 实例。
4. `layout/includes/head/Open_Graph.pug`：使用站点 OG helper。
5. `languages/zh-CN.yml`：保留原评论帮助提示文字。
6. `layout/includes/page/shuoshuo.pug`：辅助 CDN 脚本加载失败时保留已渲染的碎碎念，避免新主题错误处理将正文清空。
7. `scripts/panda/lib/memo-utils.js`：兼容 Hexo 从 YAML 读出的 Date 对象及缓存恢复的 ISO 字符串，按站点时区还原原始时分；严格校验日期，避免干净构建与缓存重建时遗漏碎碎念。
8. `scripts/panda/feed.js`：没有显式 `updated:` 时，RSS 更新时间使用发布日期，避免文件时间造成假更新；提供 `xml:base`；保留已发布的时间戳更新链接作为跳转页。
9. `source/js/busuanzi.js`、`layout/includes/additional-js.pug`：本地管理原 Busuanzi JSONP 请求，每次完整加载或 PJAX 完成请求一次。切页时取消旧请求，拒绝迟到响应覆盖新页面；失败显示 `—`，不捏造计数。服务仍为 `busuanzi.ibruce.info`，历史数据归属不变，请求保留完整页面 Referer。

页脚主题署名随框架更新为 Panda，其余站点内容不替换。

## RSS 修订规则

订阅地址仍是 `https://pppppst.github.io/atom.xml`，包含文章和全部碎碎念。新建文章会由主题补入 `updated: false` 与 `sticky: false`。

只有显式填写真实的 `updated:` 日期，且比发布日期晚超过 24 小时，才使用内容哈希生成更新通知地址。文件 mtime 不影响订阅身份和 RSS 更新时间；无改动重建不会再次推送。带有显式修订日期的文章再次修改时，内容哈希会生成一次新通知。旧时间戳更新地址由 `feed.legacy_update_paths` 保留跳转，不进入订阅条目。

`pnpm run verify` 会校验条目身份唯一、订阅链接有实际页面，并比对构建数据，防止出现“RSS XML 正常但所有碎碎念都被遗漏”的情况。

## 浏览统计

页面统计数来自原 Busuanzi 服务的实时响应。单篇阅读量显示于文章标题下，站点 PV/UV 显示于原有站点信息卡片。设置不显示侧栏的页面继续保留原布局。

本地测试地址、浏览器拦截和第三方服务故障都可能影响实时计数，失败时使用 `—` 与提示文字表示暂不可用。自动测试覆盖正常响应、PJAX 刷新、迟到响应、超时与非法数值；浏览器测试通过受控响应验证切页，并单独请求真实服务确认接口能返回计数。

## 更新与验证

从上游指定版本更新内置源码，保留上述定制；不要直接覆盖站点配置和 `source/`。
由于主题由站点加载，运行时依赖需在根 `package.json` 声明（包括 `hexo-util`）。

```sh
pnpm install --frozen-lockfile
pnpm run clean
pnpm run build
pnpm test
pnpm run verify
```

检查首页、博客列表、文章、归档、分类、标签、友链及碎碎念；分别验证明暗模式和手机显示。
构建时无 `GH_DISCUSSION_TOKEN` 会沿用原逻辑将评论计数设为 0；实时评论仍由 Giscus 加载。
