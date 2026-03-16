import NodeID3 from "node-id3";
import type { TrackMeta } from "../../../types";

export async function writeMP3(
	filePath: string,
	updates: Partial<TrackMeta>,
): Promise<void> {
	const tags: NodeID3.Tags = {};
	if (updates.year) tags.year = String(updates.year);
	if (updates.title) tags.title = updates.title;
	if (updates.artist) tags.artist = updates.artist;
	if (updates.album) tags.album = updates.album;
	if (updates.genre) tags.genre = updates.genre;
	if (updates.trackNumber) tags.trackNumber = String(updates.trackNumber);

	const success = NodeID3.update(tags, filePath);
	if (!success) throw new Error(`Failed to write ID3 tags to ${filePath}`);
}
