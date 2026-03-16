import NodeID3 from "node-id3";
import type { TrackMeta } from "../../../types";

/**
 * Writes ID3 tags to an MP3 audio file.
 *
 * @param filePath - Absolute or relative path to the target MP3 file.
 * @param updates - Partial track metadata to apply. Only provided fields are written;
 *                  omitted fields leave existing tags unchanged.
 * @returns Resolves when the ID3 tags have been successfully written to disk.
 * @throws {Error} If `NodeID3.update` fails to write tags to the file.
 *
 * @example
 * await writeMP3("/music/track.mp3", {
 *   title: "Echoes",
 *   artist: "Pink Floyd",
 *   album: "Meddle",
 *   year: 1971,
 *   genre: "Progressive Rock",
 *   trackNumber: 1,
 * });
 */
export async function writeMP3(filePath: string, updates: Partial<TrackMeta>) {
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
