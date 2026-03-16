import type { TrackMeta } from "../../types";
import { FileType } from "../enums";
import { writeFLAC } from "./writeFLAC";
import { writeMP3 } from "./writeMP3";

/**
 * Writes metadata to an audio file, dispatching to the appropriate
 * format-specific writer based on the track's file type.
 *
 * @param track - The file path and format of the track to update.
 * @param updates - Partial metadata fields to write. Only provided fields are updated;
 *                  omitted fields leave existing tags unchanged.
 * @returns Resolves when the metadata has been successfully written to disk.
 * @throws {Error} If the track's format is not supported.
 *
 * @see {@link writeMP3} for MP3/ID3 tag writing.
 * @see {@link writeFLAC} for FLAC tag writing.
 *
 * @example
 * await writeMeta(track, { title: "Echoes", year: 1971 });
 */
export async function writeMeta(
	track: Pick<TrackMeta, "filePath" | "format">,
	updates: Partial<TrackMeta>,
) {
	switch (track.format) {
		case FileType.MP3:
			await writeMP3(track.filePath, updates);
			break;
		case FileType.FLAC:
			await writeFLAC(track.filePath, updates);
			break;
		default:
			throw new Error(`Unsupported format: ${track.format}`);
	}
}
