import { parseFile } from "music-metadata";
import type { FileType } from "@/enums";

/**
 * Reads and normalises metadata from an audio file.
 *
 * @param filePath - Absolute or relative path to the audio file.
 * @param fileType - The format enum value to attach to the returned metadata object.
 * @returns The parsed track metadata, or `null` if the file could not be read.
 *
 * @example
 * const meta = await readMetadataFromFile("/music/track.mp3", FileType.MP3);
 * if (meta) console.log(meta.title);
 */
export async function readMetadataFromFile(
	filePath: string,
	fileType: FileType,
) {
	try {
		const { common } = await parseFile(filePath, { skipCovers: true });

		return {
			filePath,
			format: fileType,
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
