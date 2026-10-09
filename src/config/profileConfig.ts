import type { ProfileConfig } from "../types/profileConfig";

export const profileConfig: ProfileConfig = {
	// 头像
	// 图片路径支持三种格式：
	// 1. public 目录（以 "/" 开头，不优化）："/assets/images/avatar.webp"
	// 2. src 目录（不以 "/" 开头，自动优化但会增加构建时间，推荐）："assets/images/avatar.webp"
	// 3. 远程 URL："https://example.com/avatar.jpg"
	// 左栏资料卡头像（小熊猫花花，源文件为 E:\Desk-wall-bztp\SVG-ICON\熊猫-花花\*.svg，
	// 用 sharp 渲染成 512px webp，生成脚本见仓库历史 commit b58318f 之后的提交）
	avatar: "assets/images/avatar-red-panda.webp",

	// 名字（页脚、资料卡、RSS 作者名统一取这里，与页脚 © 文案保持一致）
	name: "xmore",

	// 个人签名
	bio: "记录技术、阅读与生活。",

	// 链接配置
	// 已经预装的图标集：fa7-brands，fa7-regular，fa7-solid，material-symbols，simple-icons
	// 访问https://icones.js.org/ 获取图标代码，
	// 如果想使用尚未包含相应的图标集，则需要安装它
	// `pnpm add @iconify-json/<icon-set-name>`
	// showName: true 时显示图标和名称，false 时只显示图标
	links: [
		{
			name: "GitHub",
			icon: "fa7-brands:github",
			url: "https://github.com/xmore2025",
			showName: false,
		},
		{
			name: "Email",
			icon: "fa7-solid:envelope",
			url: "mailto:xmore2025@proton.me",
			showName: false,
		},
		{
			name: "RSS",
			icon: "fa7-solid:rss",
			url: "/rss/",
			showName: false,
		},
	],
};
