# Panda 主题维护

当前主题为 Panda 1.1.4，上游提交为
`a0a417139b44d4da4b90a3a54e465229618ae92f`。
采用 `themes/panda/` 内置源码，不使用 npm 主题包；构建时的 vendored 提示符合预期。
上游 LICENSE、NOTICE 保持原样。旧 `themes/butterfly/` 和 `_config.butterfly.yml` 保留为未启用的旧版快照。

## 配置与内容

- `_config.yml` 选择 `theme: panda`，站点地址、文章链接及部署配置保持原样。
- `_config.panda.yml` 合并旧主题配置与站点覆盖，包括原文字、菜单、头像、背景、颜色、注入样式及 Giscus 设置。
- `source/` 全部内容和图片保持原样。
- 关闭 Panda 默认渐变，沿用原明暗背景及固定背景显示方式。
- 关闭自动系列聚合，保持现有文章列表与链接。
- RSS、碎碎念独立页、搜索注入及评论计数继续由站点脚本负责，主题内对应开关关闭。
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

页脚主题署名随框架更新为 Panda，其余站点内容不替换。

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
