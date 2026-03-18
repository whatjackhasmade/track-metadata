import * as fs from "node:fs/promises";
import * as path from "node:path";
import { ErrorMessage } from "@/enums";
import type { TrackMeta } from "@/types";
import { getMetadataForDirectoryEntry } from "../getMetadataForDirectoryEntry";

/**
 * Recursively scans a directory and all subdirectories for supported audio
 * files (.mp3, .flac), reads their metadata, and returns the collected results.
 *
 * @param rootDirectory - Absolute or relative path to the directory to scan.
 * @returns A promise that resolves to an array of {@link TrackMeta} objects,
 *   one per successfully parsed audio file.
 */
export async function collectAudioMetadataFromDirectory(rootDirectory: string) {
	const results: TrackMeta[] = [];
	await recursivelyWalkDirectoryForAudioFiles(rootDirectory, results);
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
 * @param directory - The directory to read during this invocation.
 * @param accumulator - Mutable accumulator array; matching {@link TrackMeta} entries
 *   are pushed into it as they are resolved.
 */
async function recursivelyWalkDirectoryForAudioFiles(
	directory: string,
	accumulator: TrackMeta[],
) {
	const entries = await fs.readdir(directory, { withFileTypes: true });

	await Promise.all(
		entries.map(async (directoryEntry) => {
			const fullPath = path.join(directory, directoryEntry.name);

			if (directoryEntry.isDirectory()) {
				await recursivelyWalkDirectoryForAudioFiles(fullPath, accumulator);
			} else if (directoryEntry.isFile()) {
				try {
					const metadata = await getMetadataForDirectoryEntry(
						directoryEntry,
					).match(
						(data) => data,
						(error) => {
							// We don't want to spam the console with unsupported file type warnings, but we do want to log other errors
							if (!error.message.startsWith(ErrorMessage.UnsupportedFileType))
								console.warn(
									`Skipping ${fullPath}: ${(error as Error).message}`,
								);
						},
					);

					if (metadata) accumulator.push(metadata);
				} catch (error) {
					// Log and skip unsupported file types or read errors
					console.warn(`Skipping ${fullPath}: ${(error as Error).message}`);
				}
			}
		}),
	);
}
