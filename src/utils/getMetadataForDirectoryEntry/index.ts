import type { Dirent } from "node:fs";
import path from "node:path";
import { getMetadataForFile } from "@/utils";

export function getMetadataForDirectoryEntry(entry: Dirent<string>) {
	const fullPath = path.join(entry.parentPath, entry.name);
	return getMetadataForFile(fullPath);
}
