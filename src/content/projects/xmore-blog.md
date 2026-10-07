---
title: "Xmore's Blog（本站）"
published: 2026-10-07
description: "基于 Astro + Firefly 主题的个人博客，纯静态产物部署在 Cloudflare，评论走 Giscus、搜索走 Pagefind。"
tags: ["Astro", "Cloudflare", "博客"]
status: "published"
order: 100
link:
  - label: "源码"
    icon: "fa7-brands:github"
    value: "https://github.com/xmore2025/web-xmore2025-astrofirefly-1008"
---

这是本站的源码仓库，也是第一个"项目"条目：写下来，才算发生过。

## 技术选型

- **Astro**：默认零 JS，只有交互岛才加载脚本
- **Cloudflare Workers 静态资源**：构建一次，全球边缘命中
- **Giscus**：评论存在 GitHub Discussions，零后端
- **Pagefind**：构建期生成搜索索引，不依赖任何服务
