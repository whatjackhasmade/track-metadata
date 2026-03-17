import * as fs from "node:fs/promises";
import * as path from "node:path";
import { FileType } from "@/enums";
import type { TrackMeta } from "@/types";
import { readMetadataFromFile } from "..";

const supportedAudioFiles = [FileType.MP3, FileType.FLAC] as const;

function isSupportedAudioFileType(
	fileType: string,
): fileType is (typeof supportedAudioFiles)[number] {
	return (supportedAudioFiles as readonly string[]).includes(fileType);
}

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
		entries.map(async (entry) => {
			const fullPath = path.join(directory, entry.name);

			if (entry.isDirectory()) {
				await recursivelyWalkDirectoryForAudioFiles(fullPath, accumulator);
			} else if (entry.isFile()) {
				const extension = path.extname(entry.name).toLowerCase();
				const splitExt = extension.split(".");
				const fileType = splitExt.length ? splitExt[splitExt.length - 1] : "";

				if (isSupportedAudioFileType(fileType)) {
					const meta = await readMetadataFromFile(fullPath, fileType);
					if (meta) accumulator.push(meta);
				}
			}
		}),
	);
}
