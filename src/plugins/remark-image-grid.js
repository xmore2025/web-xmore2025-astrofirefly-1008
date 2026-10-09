import { visit } from "unist-util-visit";

/**
 * Custom Remark plugin for creating responsive image grids.
 *
 * It parses markdown blocks surrounded by `[grid]` and `[/grid]` tags and wraps
 * the contained images in a styled `div` container with a grid layout.
 * The column count is evaluated automatically based on the number of inserted images
 * inside the grid tags (up to 4 columns), and can be overridden explicitly with
 * `[grid cols=3]`.
 *
 * Grids are processed not only at the document root but also inside nested block
 * containers (admonitions, blockquotes, lists, directives), so `[grid]` / `[/grid]`
 * blocks keep working when placed inside such containers.
 *
 * Example:
 * [grid]
 * ![image1](/url1)
 * ![image2](/url2)
 * [/grid]
 *
 * Explicit column count (automatic detection would pick 3 here):
 * [grid cols=2]
 * ![image1](/url1)
 * ![image2](/url2)
 * [/grid]
 *
 * @returns {import('unified').Plugin}
 */

// Block containers that may hold block-level content such as a `[grid]` block.
// Admonitions appear as `containerDirective` (`:::note`) or `blockquote`
// (Python-style `!!!note`) nodes at this stage of the pipeline.
const BLOCK_CONTAINER_TYPES = new Set([
	"root",
	"blockquote",
	"containerDirective",
	"list",
	"listItem",
]);

// `[grid]` / `[grid cols=N]` — leading whitespace is allowed so the tag can be
// written indented (e.g. inside a list item) without breaking detection.
const GRID_START_RE = /^\s*\[grid(?:\s+cols=(\d+))?\]\s*/;
const GRID_END_RE = /\s*\[\/grid\]\s*$/;

/**
 * Resolve the responsive column classes for a grid with the given image count.
 *
 * 断点策略：窄屏保持单列（三、四图竖排太占屏），
 * ≥640px 起对 3 列以上的网格先铺两列，≥768px 再铺满目标列数。
 */
function getGridColumnClasses(imgCount) {
	const cols = Math.min(Math.max(imgCount || 2, 1), 4);
	const classes = ["grid-cols-1"];
	if (cols >= 3) classes.push("sm:grid-cols-2");
	if (cols === 1) return classes;
	return [...classes, `md:grid-cols-${cols}`];
}

/** Read an explicit `cols=N` override from a `[grid ...]` tag, if present. */
function readExplicitCols(value) {
	const match = value.match(GRID_START_RE);
	if (!match || match[1] === undefined) return null;
	const parsed = Number.parseInt(match[1], 10);
	return Number.isNaN(parsed) ? null : parsed;
}

/** Count all images found inside the given nodes, recursively. */
function countImages(nodes) {
	let imgCount = 0;
	nodes.forEach((node) => {
		visit(node, "image", () => {
			imgCount++;
		});
	});
	return imgCount;
}

/** Drop text nodes that became empty after stripping the grid tags. */
function dropEmptyTextNodes(children) {
	return children.filter((n) => n.type !== "text" || n.value.trim() !== "");
}

/** Wrap the given nodes into a grid `div` paragraph node. */
function buildGridNode(nodes, explicitCols = null) {
	const cols = explicitCols ?? countImages(nodes);
	return {
		type: "paragraph",
		data: {
			hName: "div",
			hProperties: {
				className: ["image-grid", "grid", "gap-4", "my-4", ...getGridColumnClasses(cols)],
				dataImageGrid: "",
				dataCols: String(Math.min(Math.max(cols || 2, 1), 4)),
			},
		},
		children: nodes,
	};
}

/**
 * Process `[grid]` / `[/grid]` blocks within a flat list of block children.
 * Returns a new children array with grids replaced by grid `div` nodes.
 */
function processGridBlocks(children) {
	const newChildren = [];
	let inGrid = false;
	let gridChildren = [];
	let explicitCols = null;

	for (let i = 0; i < children.length; i++) {
		const node = children[i];

		// Check if paragraph contains [grid] or [/grid]
		if (node.type === "paragraph" && node.children.length > 0) {
			const first = node.children[0];
			const last = node.children[node.children.length - 1];

			const containsGridStart =
				first.type === "text" && GRID_START_RE.test(first.value);
			const containsGridEnd = last.type === "text" && GRID_END_RE.test(last.value);

			// Case 1: [grid] and [/grid] in the SAME paragraph
			if (containsGridStart && containsGridEnd && !inGrid) {
				const cols = readExplicitCols(first.value);
				first.value = first.value.replace(GRID_START_RE, "");
				last.value = last.value.replace(GRID_END_RE, "");

				newChildren.push(
					buildGridNode(dropEmptyTextNodes(node.children), cols),
				);
				continue;
			}

			// Case 2: Multi-paragraph — opening tag
			if (!inGrid && containsGridStart) {
				inGrid = true;
				explicitCols = readExplicitCols(first.value);
				first.value = first.value.replace(GRID_START_RE, "");
				const rest = dropEmptyTextNodes(node.children);
				// [grid] stood alone on its own line: nothing else to keep
				if (rest.length > 0) gridChildren.push({ ...node, children: rest });
				continue;
			}

			// Case 2: Multi-paragraph — closing tag
			if (inGrid && containsGridEnd) {
				inGrid = false;
				last.value = last.value.replace(GRID_END_RE, "");
				const rest = dropEmptyTextNodes(node.children);
				if (rest.length > 0) gridChildren.push({ ...node, children: rest });

				newChildren.push(buildGridNode(gridChildren, explicitCols));
				gridChildren = [];
				explicitCols = null;
				continue;
			}
		}

		if (inGrid) {
			gridChildren.push(node);
		} else {
			newChildren.push(node);
		}
	}

	// If unclosed, just append them
	if (inGrid) {
		newChildren.push(...gridChildren);
	}

	return newChildren;
}

export function remarkImageGrid() {
	return (tree) => {
		// Process grids inside nested block containers (admonitions, blockquotes,
		// lists, ...) as well as at the document root. Children are processed first
		// (depth-first) so inner grids are already wrapped when an outer container
		// scans its own children.
		const processContainer = (node) => {
			if (Array.isArray(node.children)) {
				for (const child of node.children) {
					processContainer(child);
				}
			}
			if (BLOCK_CONTAINER_TYPES.has(node.type)) {
				node.children = processGridBlocks(node.children);
			}
		};

		processContainer(tree);
	};
}
