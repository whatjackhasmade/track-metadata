import { parseFile } from "music-metadata";
import type { TrackMeta } from "../../../types";

export async function readMetadata(
	filePath: string,
	ext: ".mp3" | ".flac",
): Promise<TrackMeta | null> {
	try {
		const { common } = await parseFile(filePath, { skipCovers: true });
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
