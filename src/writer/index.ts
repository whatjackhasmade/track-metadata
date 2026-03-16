import * as fs from "node:fs";
import * as fsPromises from "node:fs/promises";
import * as NodeID3 from "node-id3";
import { type MetaDataBlock, Processor } from "../flac-metadata";
import type { TrackMeta } from "../types";

export async function writeMeta(
	track: TrackMeta,
	updates: Partial<TrackMeta>,
): Promise<void> {
	if (track.format === "mp3") {
		await writeMP3(track.filePath, updates);
	} else {
		await writeFLAC(track.filePath, updates);
	}
}

async function writeMP3(
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

async function writeFLAC(
	filePath: string,
	updates: Partial<TrackMeta>,
): Promise<void> {
	const fieldMap: Record<string, string | undefined> = {
		TITLE: updates.title,
		ARTIST: updates.artist,
		ALBUM: updates.album,
		DATE: updates.year ? String(updates.year) : undefined,
		GENRE: updates.genre,
		TRACKNUMBER: updates.trackNumber ? String(updates.trackNumber) : undefined,
	};

	await new Promise<void>((resolve, reject) => {
		const proc = new Processor({ parseMetaDataBlocks: true });
		const tmpPath = `${filePath}.tmp`;

		proc.on("preprocess", (chunk: MetaDataBlock) => {
			if (chunk.type === Processor.MDB_TYPE_VORBIS_COMMENT) {
				const block = chunk;

				for (const [key, val] of Object.entries(fieldMap)) {
					if (val !== undefined) {
						const existing = block.comments.findIndex((comment) =>
							comment.startsWith(`${key}=`),
						);
						if (existing >= 0) {
							block.comments[existing] = `${key}=${val}`;
						} else {
							block.comments.push(`${key}=${val}`);
						}
					}
				}
			}
			proc.push(chunk);
		});

		const input = fs.createReadStream(filePath);
		const output = fs.createWriteStream(tmpPath);
		input.pipe(proc).pipe(output);
		output.on("finish", async () => {
			await fsPromises.rename(tmpPath, filePath);
			resolve();
		});
		proc.on("error", reject);
	});
}
