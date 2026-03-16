import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { TrackMeta } from "../../../types";
import { readMetadata } from "..";

/** Audio file extensions supported for metadata extraction. */
const SUPPORTED_AUDIO_EXTENSIONS = new Set([".mp3", ".flac"]);

/**
 * Recursively scans a directory and all subdirectories for supported audio
 * files (.mp3, .flac), reads their metadata, and returns the collected results.
 *
 * @param rootDir - Absolute or relative path to the directory to scan.
 * @returns A promise that resolves to an array of {@link TrackMeta} objects,
 *   one per successfully parsed audio file.
 */
export async function collectAudioMetadataFromDirectory(
	rootDir: string,
): Promise<TrackMeta[]> {
	const results: TrackMeta[] = [];
	await recursivelyWalkDirectoryForAudioFiles(rootDir, results);
	return results;
}

/**
 * Internal recursive helper that walks a directory tree depth-first, reading
 * metadata from every supported audio file found and appending it to `acc`.
 *
 * Subdirectories and files within a single directory are processed
 * concurrently via `Promise.all`; recursion into subdirectories is awaited
 * before the parent call resolves.
 *
 * @param dir - The directory to read during this invocation.
 * @param acc - Mutable accumulator array; matching {@link TrackMeta} entries
 *   are pushed into it as they are resolved.
 */
async function recursivelyWalkDirectoryForAudioFiles(
	dir: string,
	acc: TrackMeta[],
): Promise<void> {
	const entries = await fs.readdir(dir, { withFileTypes: true });

	await Promise.all(
		entries.map(async (entry) => {
			const fullPath = path.join(dir, entry.name);

			if (entry.isDirectory()) {
				await recursivelyWalkDirectoryForAudioFiles(fullPath, acc);
			} else if (entry.isFile()) {
				const ext = path.extname(entry.name).toLowerCase();

				if (SUPPORTED_AUDIO_EXTENSIONS.has(ext)) {
					const meta = await readMetadata(fullPath, ext as ".mp3" | ".flac");
					if (meta) acc.push(meta);
				}
			}
		}),
	);
}
