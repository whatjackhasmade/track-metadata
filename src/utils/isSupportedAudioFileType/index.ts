import { FileType } from "@/enums";

const supportedAudioFiles = [FileType.MP3, FileType.FLAC] as const;

export function isSupportedAudioFileType(
	fileType: string,
): fileType is (typeof supportedAudioFiles)[number] {
	return (supportedAudioFiles as readonly string[]).includes(fileType);
}
