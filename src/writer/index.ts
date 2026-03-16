import type { TrackMeta } from "../../types";
import { writeFLAC } from "./writeFLAC";
import { writeMP3 } from "./writeMP3";

export async function writeMeta(
	track: TrackMeta,
	updates: Partial<TrackMeta>,
): Promise<void> {
	switch (track.format) {
		case "mp3":
			await writeMP3(track.filePath, updates);
			break;
		case "flac":
			await writeFLAC(track.filePath, updates);
			break;
		default:
			throw new Error(`Unsupported format: ${track.format}`);
	}
}
