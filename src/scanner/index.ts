import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as mm from "music-metadata";
import type { TrackMeta } from "../../types";

const SUPPORTED_EXTS = new Set([".mp3", ".flac"]);

export async function scanDirectory(dir: string): Promise<TrackMeta[]> {
	const results: TrackMeta[] = [];
	await walk(dir, results);
	return results;
}

async function walk(dir: string, acc: TrackMeta[]): Promise<void> {
	const entries = await fs.readdir(dir, { withFileTypes: true });

	await Promise.all(
		entries.map(async (entry) => {
			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				await walk(fullPath, acc);
			} else if (entry.isFile()) {
				const ext = path.extname(entry.name).toLowerCase();
				if (SUPPORTED_EXTS.has(ext)) {
					const meta = await readMeta(fullPath, ext as ".mp3" | ".flac");
					if (meta) acc.push(meta);
				}
			}
		}),
	);
}

async function readMeta(
	filePath: string,
	ext: ".mp3" | ".flac",
): Promise<TrackMeta | null> {
	try {
		const { common } = await mm.parseFile(filePath, { skipCovers: true });
		return {
			filePath,
			format: ext === ".mp3" ? "mp3" : "flac",
			title: common.title,
			artist: common.artist ?? common.albumartist,
			album: common.album,
			year: common.year,
			genre: common.genre?.[0],
			trackNumber: common.track?.no ?? undefined,
		};
	} catch {
		console.warn(`⚠ Could not read: ${filePath}`);
		return null;
	}
}
