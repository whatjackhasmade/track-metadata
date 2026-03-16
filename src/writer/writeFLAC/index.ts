import { File } from "node-taglib-sharp";
import type { TrackMeta } from "../../../types";

export async function writeFLAC(
	filePath: string,
	updates: Partial<TrackMeta>,
): Promise<void> {
	const updatedFile = File.createFromPath(filePath);

	if (updates.album) updatedFile.tag.album = updates.album;
	if (updates.artist) updatedFile.tag.albumArtists = [updates.artist];
	if (updates.title) updatedFile.tag.title = updates.title;
	if (updates.year) updatedFile.tag.year = updates.year;
	if (updates.genre)
		updatedFile.tag.genres = updates.genre
			.split(",")
			.map((genre) => genre.trim());

	updatedFile.save();
}
