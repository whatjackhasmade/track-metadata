import path from "node:path";
import { ResultAsync } from "neverthrow";
import { ErrorMessage } from "@/enums";
import { isSupportedAudioFileType, readMetadataFromFile } from "@/utils";

export function getMetadataForFile(filePath: string) {
	const extension = path.extname(filePath).toLowerCase();
	const splitExt = extension.split(".");
	const fileType = splitExt.length ? splitExt[splitExt.length - 1] : "";

	if (!isSupportedAudioFileType(fileType)) {
		return ResultAsync.fromPromise(
			Promise.reject(
				new Error(`${ErrorMessage.UnsupportedFileType}: ${fileType}`),
			),
			(error) => error as Error,
		);
	}

	return ResultAsync.fromPromise(
		readMetadataFromFile(filePath, fileType).then((data) => {
			if (!data) throw new Error(ErrorMessage.NoMetadataRead);
			return data;
		}),
		(error) => error as Error,
	);
}
