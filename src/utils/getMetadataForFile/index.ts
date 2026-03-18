import path from "node:path";
import { ResultAsync } from "neverthrow";
import { isSupportedAudioFileType, readMetadataFromFile } from "@/utils";

export function getMetadataForFile(filePath: string) {
	const extension = path.extname(filePath).toLowerCase();
	const splitExt = extension.split(".");
	const fileType = splitExt.length ? splitExt[splitExt.length - 1] : "";

	if (!isSupportedAudioFileType(fileType)) {
		return ResultAsync.fromSafePromise(
			Promise.reject(new Error(`Unsupported file type: ${fileType}`)),
		);
	}

	return ResultAsync.fromPromise(
		readMetadataFromFile(filePath, fileType).then((data) => {
			if (!data) throw new Error("No metadata could be read");
			return data;
		}),
		(error) => error as Error,
	);
}
