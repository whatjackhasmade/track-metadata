import { existsSync, mkdirSync, rmSync } from "node:fs";
import * as esbuild from "esbuild";

// 1. Clean the dist directory
const distPath = "./dist";

if (existsSync(distPath)) {
	rmSync(distPath, { recursive: true, force: true });
}

mkdirSync(distPath);

// 2. Run the build
(async () => {
	await esbuild.build({
		entryPoints: ["src/index.ts"],
		bundle: true,
		platform: "node",
		format: "cjs",
		outfile: "dist/index.cjs", // Your desired CJS output
		minifySyntax: true,
		minifyWhitespace: true,
		minifyIdentifiers: true,
		sourcemap: true,
		alias: { "@": "./src" },
		banner: {
			js: "#!/usr/bin/env node",
		},
	});
})()
	.then(() => {
		console.log("Build complete: dist/index.cjs");
	})
	.catch((err) => {
		console.error("Build failed:", err);
		process.exit(1);
	});
