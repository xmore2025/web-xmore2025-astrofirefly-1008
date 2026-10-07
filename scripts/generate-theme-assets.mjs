// 生成站点主题素材：头像 + 桌面/移动横幅壁纸。
//
// 全部用 SVG 矢量绘制再交给 sharp 编码成 AVIF，好处有三个：
// 1. 颜色直接复刻主题色（墨蓝 #1b3a4b → 低饱和青绿 #0b6e64），不会像随手找的图那样偏色；
// 2. 体积可控（单张壁纸 < 100 KB），不需要引入外部图床或随机图 API；
// 3. 想换色只改下面 PALETTE 一处，重跑 `node scripts/generate-theme-assets.mjs` 即可。
//
// 用法：node scripts/generate-theme-assets.mjs

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();

// 与 siteConfig.themeColor.hue = 201（墨蓝）配套的配色
const PALETTE = {
	deep: "#12202a", // 最深处，用于横幅顶部，保证标题文字对比度
	ink: "#1b3a4b", // 主色：墨蓝
	teal: "#0b6e64", // 辅色：低饱和青绿
	glow: "#d7f5ee", // 萤火虫光点
};

// 头像：渐变底 + 细线 X + 一枚发光光点
function avatarSvg(size = 512) {
	const c = size / 2;
	const arm = size * 0.17; // X 的半臂长
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
	<defs>
		<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0" stop-color="${PALETTE.ink}"/>
			<stop offset="1" stop-color="${PALETTE.teal}"/>
		</linearGradient>
		<radialGradient id="halo">
			<stop offset="0" stop-color="${PALETTE.glow}" stop-opacity="0.55"/>
			<stop offset="1" stop-color="${PALETTE.glow}" stop-opacity="0"/>
		</radialGradient>
	</defs>
	<rect width="${size}" height="${size}" fill="url(#bg)"/>
	<circle cx="${size * 0.72}" cy="${size * 0.28}" r="${size * 0.16}" fill="url(#halo)"/>
	<g stroke="#ffffff" stroke-width="${size * 0.026}" stroke-linecap="round" opacity="0.92">
		<line x1="${c - arm}" y1="${c - arm}" x2="${c + arm}" y2="${c + arm}"/>
		<line x1="${c + arm}" y1="${c - arm}" x2="${c - arm}" y2="${c + arm}"/>
	</g>
	<circle cx="${size * 0.72}" cy="${size * 0.28}" r="${size * 0.022}" fill="${PALETTE.glow}"/>
</svg>`;
}

// 横幅壁纸：极淡渐变 + 层叠雾中山影 + 柔和光晕。
// 刻意压低对比度：横幅要承载标题文字，山影只做层次，不抢视线。
function wallpaperSvg(w, h) {
	const horizon = h * (w < h ? 0.62 : 0.68); // 竖版时地平线更高，主体更居中
	const ridge = (baseY, amp, seed) => {
		let d = `M0 ${baseY}`;
		const steps = 6;
		for (let i = 1; i <= steps; i++) {
			const x = (w / steps) * i;
			const y = baseY + Math.sin(seed + i * 1.35) * amp;
			d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
		}
		return `${d} L${w} ${h} L0 ${h} Z`;
	};
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
	<defs>
		<linearGradient id="sky" x1="0" y1="0" x2="0.35" y2="1">
			<stop offset="0" stop-color="${PALETTE.deep}"/>
			<stop offset="0.55" stop-color="${PALETTE.ink}"/>
			<stop offset="1" stop-color="${PALETTE.teal}"/>
		</linearGradient>
		<radialGradient id="glow" cx="0.78" cy="0.18" r="0.55">
			<stop offset="0" stop-color="${PALETTE.glow}" stop-opacity="0.22"/>
			<stop offset="1" stop-color="${PALETTE.glow}" stop-opacity="0"/>
		</radialGradient>
		<linearGradient id="mist" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="${PALETTE.glow}" stop-opacity="0.14"/>
			<stop offset="1" stop-color="${PALETTE.glow}" stop-opacity="0"/>
		</linearGradient>
	</defs>
	<rect width="${w}" height="${h}" fill="url(#sky)"/>
	<rect width="${w}" height="${h}" fill="url(#glow)"/>
	<path d="${ridge(horizon, h * 0.05, 0.4)}" fill="${PALETTE.glow}" opacity="0.10"/>
	<path d="${ridge(horizon + h * 0.06, h * 0.035, 2.1)}" fill="${PALETTE.deep}" opacity="0.28"/>
	<path d="${ridge(horizon + h * 0.13, h * 0.025, 4.3)}" fill="${PALETTE.deep}" opacity="0.45"/>
	<rect y="${horizon - h * 0.12}" width="${w}" height="${h * 0.12}" fill="url(#mist)"/>
</svg>`;
}

async function writeAvif(svg, target, width) {
	await fs.mkdir(path.dirname(target), { recursive: true });
	const buffer = await sharp(Buffer.from(svg))
		.resize({ width, withoutEnlargement: true })
		.avif({ quality: 62, effort: 4 })
		.toBuffer();
	await fs.writeFile(target, buffer);
	const kb = (buffer.length / 1024).toFixed(1);
	console.log(`[THEME-ASSETS] ${path.relative(ROOT, target)} (${kb} KB)`);
}

async function main() {
	await writeAvif(
		avatarSvg(512),
		path.join(ROOT, "src/assets/images/avatar.avif"),
		512,
	);
	await writeAvif(
		wallpaperSvg(1920, 1080),
		path.join(ROOT, "src/assets/images/DesktopWallpaper/ink-blue.avif"),
		1920,
	);
	await writeAvif(
		wallpaperSvg(1080, 1920),
		path.join(ROOT, "src/assets/images/MobileWallpaper/ink-blue.avif"),
		1080,
	);
	console.log("[THEME-ASSETS] 完成。配色改动请编辑脚本顶部的 PALETTE。");
}

main();
