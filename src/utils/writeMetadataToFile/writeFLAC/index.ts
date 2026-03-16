import { File } from "node-taglib-sharp";
import type { TrackMeta } from "@/types";

/**
 * Writes metadata tags to a FLAC audio file.
 *
 * @param filePath - Absolute or relative path to the target FLAC file.
 * @param updates - Partial track metadata to apply. Only provided fields are written;
 *                  omitted fields leave existing tags unchanged.
 * @returns Resolves when the tags have been saved to disk.
 *
 * @example
 * await writeFLAC("/music/track.flac", {
 *   title: "Echoes",
 *   artist: "Pink Floyd",
 *   album: "Meddle",
 *   year: 1971,
 *   genre: "Progressive Rock",
 *   trackNumber: 1,
 * });
 */
export async function writeFLAC(filePath: string, updates: Partial<TrackMeta>) {
	const updatedFile = File.createFromPath(filePath);

	if (updates.album) updatedFile.tag.album = updates.album;
	if (updates.artist) updatedFile.tag.albumArtists = [updates.artist];
	if (updates.title) updatedFile.tag.title = updates.title;
	if (updates.year) updatedFile.tag.year = updates.year;
	if (updates.genre) updatedFile.tag.genres = [updates.genre];
	if (updates.trackNumber) updatedFile.tag.track = updates.trackNumber;

	updatedFile.save();
}
