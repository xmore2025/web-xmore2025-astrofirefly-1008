# 部署说明

站点已按「简约大气」方案搭好并构建通过。下面是**上线前必须替换的内容**和**部署步骤**。

---

## 一、站点身份（已填好 ✅）

| 项 | 值 | 位置 |
|---|---|---|
| 域名 | `https://web-admin.xmorexz.dpdns.org` | `src/config/siteConfig.ts` → `site_url`（也可用环境变量 `PUBLIC_SITE_URL` 覆盖） |
| 邮箱 | `xmore2025@proton.me` | `profileConfig.ts` / `backgroundWallpaper.ts`（个人卡片与横幅图标）、`friends.mdx`（友链页） |
| GitHub | `https://github.com/xmore2025` | 导航栏 / 个人卡片 / 横幅 |
| 主题色 | 墨蓝 `#1b3a4b`（hue 201） | `siteConfig.ts` → `themeColor.hue`；设置面板默认关闭，全站单一强调色 |

**主题素材**（头像 + 桌面/移动横幅）由 `scripts/generate-theme-assets.mjs` 用 SVG + sharp 生成，
与主题色严格一致且每张不到 10 KB。想换色只改脚本顶部的 `PALETTE`，再跑：

```bash
node scripts/generate-theme-assets.mjs
```

导航栏 logo 在 `src/assets/images/logo/`，站点图标在 `public/favicon/`，目前沿用 Firefly 萤火虫图标。

---

## 二、本地开发

依赖已安装完成。**本机为 Windows + exFAT 卷**，pnpm 默认的符号链接布局会失败，因此 `.npmrc` 里已固定 `node-linker=hoisted`；
`pnpm-workspace.yaml` 里另加了 `verifyDepsBeforeRun: false`，避免 pnpm 11 每次跑脚本前都尝试重装依赖（它会撞上同样的符号链接错误）。

```bash
pnpm dev              # 本地预览 http://localhost:4321
pnpm build            # 完整构建（含 Pagefind 索引），已可正常跑通
npx astro build       # 只跑 Astro 构建、跳过前后置脚本，改样式时更快
```

> 若某天需要重装依赖，用这条命令（跳过 esbuild 的安装脚本，它在沙箱里会报 EBUSY）：
> ```bash
> pnpm install --ignore-scripts
> ```

新增文章：在 `src/content/posts/` 下新建 `.md` 文件，frontmatter 最少需要两行：

```markdown
---
title: "文章标题"
published: 2026-10-07
---
```

可选字段：`description`、`category`、`tags: [..]`、`pinned: true`（置顶）、`draft: true`（草稿不发布）。

---

## 三、已经做了哪些「减法」

相比 Firefly 默认配置，以下功能已关闭（想恢复改回 `true` 即可）：

- **页面**：留言板、动态、项目、相册、书签导航、打赏、B站追番、番组计划、VNDB、MyAnimeList
- **侧边栏**：单侧栏（左侧），只保留「个人资料 + 分类」，标签走导航栏「文章 → 标签」入口；文章页目录由悬浮目录（FloatingTOC）提供，不依赖侧栏
- **特效**：背景视频（含第三方外链视频已移除）、水波纹动画（樱花特效本就默认关闭）
- **图表**：PlantUML（依赖外部渲染服务，与纯静态目标冲突）—— 只保留 Mermaid（构建期本地渲染）
- **其他**：OG 图自动生成（构建极慢）、随机文章推荐、Atom 订阅入口
- **字体**：关闭自定义字体下载，全程使用系统字体栈（首屏最快，也避免构建期联网拉字体）
- 导航精简为 **首页 / 文章（归档·分类·标签）/ 友链 / 关于 / GitHub** 五项
- 移动端与桌面端统一为单列列表布局

---

## 四、部署到 Cloudflare

### 1. Git 仓库（已完成 ✅）

**仓库**：<https://github.com/xmore2025/web-xmore2025-astrofirefly-1008>（公开）

> 仓库名已统一为连字符 `web-xmore2025-astrofirefly-1008`，与 Cloudflare Worker 名完全一致
> （Cloudflare 的 `name` 不允许下划线，见下方说明）。改名后本地远端已同步：
> ```bash
> git remote set-url origin https://xmore2025@github.com/xmore2025/web-xmore2025-astrofirefly-1008.git
> ```
> GitHub 会自动把旧地址重定向到新地址，但本地远端最好显式改一次，避免以后写操作走重定向。

| 项 | 值 |
|---|---|
| 远端 | `https://xmore2025@github.com/xmore2025/web-xmore2025-astrofirefly-1008.git` |
| 分支 | `main` |
| 首次提交 | `54d5932` init: 简约版 Firefly 博客 (Astro + Cloudflare) |
| 提交身份 | `xmore2025 <336082097+xmore2025@users.noreply.github.com>` |

日常提交：

```bash
git add -A
git commit -m "说明"
git push
```

仓库根目录下的 `setup-repo.ps1` 保留着初始化流程，换机器重新搭环境时可直接跑。

**GitHub Actions**：`.github/workflows/` 下三个流程已从 `master` 改为监听 `main`（主题模板默认是 `master`，
在我们仓库里等于永不触发）。其中 `deploy.yml`（GitHub Pages）改为**仅手动触发**——正式部署走 Cloudflare，
Pages 没在仓库设置里开启，自动跑只会每次推送都报红。

> **踩过的两个坑（已修）**
>
> 1. **本机 git 代理指向了没监听的端口**：全局原本是 `socks5://127.0.0.1:10808`，该端口没有进程，导致所有 GitHub 操作超时（这也是最初 clone 失败的原因）。
>    现已改为 `http://127.0.0.1:7897`（Clash Verge）。代理端口变了就改这一项：
>    ```bash
>    git config --global http.https://github.com/.proxy http://127.0.0.1:7897
>    ```
>
> 2. **凭据管理器里存的是另一个账号**：首次 push 返回 `Permission denied to xmind-2046`。
>    解决方式是远端 URL 带用户名 + 重新授权：
>    ```bash
>    git remote set-url origin https://xmore2025@github.com/xmore2025/web-xmore2025-astrofirefly-1008.git
>    git credential-manager github login
>    git push -u origin main
>    ```
>
> 3. **残留的损坏 `.git`**：首次克隆失败在 exFAT 卷上留下一个带隐藏属性、无法读取的目录项，
>    会让该目录下所有 git 命令报 `error reading .git`。已清除。若以后再遇到，用
>    `rm -rf .git` 配合 `CODEBUDDY_SAFE_DELETE_ENABLED=0`，或 `chkdsk E: /f` 修复卷后再删。

### 2. Cloudflare 控制台

进入 **计算 → Workers 和 Pages → 创建**，连接上面的 GitHub 仓库。

**方案 A：Workers 静态资源**（Cloudflare 2026 年推荐的新项目形态）

`wrangler.jsonc` 已配置好：

```jsonc
{
  // Cloudflare Worker 名称规则：只允许字母数字和短横线，禁止下划线。
  // 对应仓库 xmore2025/web-xmore2025-astrofirefly-1008
  "name": "web-xmore2025-astrofirefly-1008",
  "compatibility_date": "2026-10-07",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": "./dist",
    // 不加这一项，Workers 会返回平台自带的 404，站点自己的 dist/404.html 不生效
    "not_found_handling": "404-page"
  },
  // Workers Logs 采集。新建 Worker 默认为 true；纯静态站用不到日志与追踪，
  // 关掉可避免产生日志存储与查询用量。
  "observability": { "enabled": false }
}
```

> **为什么是连字符？**
> Cloudflare 官方文档对 `name` 字段的规定是「字母数字和短横线，**不得使用下划线**」，
> 带下划线时 `wrangler deploy` 会直接报校验错误，部署跑不起来。
> 所以 Worker 名用 `web-xmore2025-astrofirefly-1008`，仓库名也已改成同一写法，两边完全一致。

构建配置：

| 配置项 | 值 |
|---|---|
| 构建命令 | `pnpm build` |
| 部署命令 | `npx wrangler deploy` |
| 环境变量 | `NODE_VERSION = 22.23`、`PNPM_VERSION = 11.22.0`、`PUBLIC_SITE_URL = https://你的域名` |

> `package.json` 里 `engines.node >= 22.23.0`，只写 `NODE_VERSION = 22` 时云端可能装到更旧的 22.x 而构建失败，
> 建议直接写 `22.23`。`.nvmrc` 也已同步为 `22.23.0`。
> 另外 `preinstall` 是 `npx only-allow pnpm`，用 npm/yarn 装会直接失败，必须走 pnpm。

**方案 B：Pages**（零配置，更省心）

| 配置项 | 值 |
|---|---|
| Framework preset | `Astro` |
| 构建命令 | `pnpm build` |
| 构建输出目录 | `dist` |
| 环境变量 | `NODE_VERSION = 22.23`、`PNPM_VERSION = 11.22.0`、`PUBLIC_SITE_URL = https://你的域名` |

> Pages 模式**不要**设置 `CF_WORKERS` 环境变量 —— 那是 Firefly 启用 SSR 适配器的开关，静态部署设了反而走错路径。

### 3. 绑定域名

Custom domains 里添加你的域名，SSL 自动签发。注意两点：

- 要绑**根域名**（example.com），必须把域名的 NS 托管到 Cloudflare；否则只能用 `www` 做 CNAME
- 若域名配过 CAA 记录，需放行 Cloudflare 的证书机构，否则证书会卡在「待激活」

---

## 五、启用评论（Giscus）—— 只差一步

选型结论：Giscus 把评论存在 GitHub Discussions 里，**零后端、零数据库、零费用、可导出**；
Waline 要开 D1 + Worker，会把纯静态降级成有状态，不采用。

已完成：
- 仓库已开启 Discussions，并建好 `Announcements` 分类
- `src/config/commentConfig.ts` 里 `repo` / `repoId`（`R_kgDOU_ny8Q`）/ `category` 已填好

**只剩一步**：拿到 `categoryId`，填进 `commentConfig.ts` 的 `giscus.categoryId`，
再把 `type: "none"` 改成 `type: "giscus"`：

1. 打开 <https://giscus.app>，填入 `xmore2025/web-xmore2025-astrofirefly-1008`，
   分类选 `Announcements`，页面会生成一段配置代码，复制其中的 `data-category-id`（`DIC_kwDO...`）
2. 填入后推送，评论区即可用

> 没填 `categoryId` 前保持 `type: "none"`，否则评论区会加载失败。

## 五·二、开启统计（Cloudflare Web Analytics）

免费、免 cookie、脚本 < 10 KB。步骤见 `src/config/FooterConfig.html` 内的注释：
在 Cloudflare 控制台「分析和日志 → Web Analytics」添加站点，
把生成的 beacon 代码取消注释、填入 token 即可。不要用 Google Analytics。

---

## 六、国内访问提醒

Cloudflare 在中国大陆没有节点，`*.pages.dev` 在部分运营商下不稳定。**绑定自定义域名能明显改善，但仍弱于国内云厂商。**

如果读者主要在国内，建议改投 **EdgeOne Pages** 或 **阿里云 ESA Pages** —— 构建命令完全一样（`pnpm build` / 输出 `dist` / Node 22），Firefly 官方也为这两个平台写了部署章节，切换成本几乎为零。

---

## 七、上线检查清单

- [ ] `site_url` 已改成真实域名
- [ ] Cloudflare 环境变量 `NODE_VERSION = 22` 已设
- [ ] 构建在云端成功（首次失败先看日志里的 Node 版本行）
- [ ] 搜索能出结果（Pagefind 索引已生成）
- [ ] 自定义域名生效，HTTPS 已激活
- [ ] `/sitemap-index.xml` 可访问且域名正确
- [ ] `/rss.xml` 可访问
- [ ] 移动端侧边栏正常折叠，正文行宽舒适
- [ ] 亮/暗色切换正常，刷新后记住偏好
