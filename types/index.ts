export interface TrackMeta {
	filePath: string;
	title?: string;
	artist?: string;
	album?: string;
	year?: number;
	genre?: string;
	trackNumber?: number;
	format: "mp3" | "flac";
}

export interface MissingField {
	track: TrackMeta;
	missingFields: (keyof Omit<TrackMeta, "filePath" | "format">)[];
}

export interface MusicBrainzRelease {
	id: string;
	title: string;
	date?: string; // "YYYY", "YYYY-MM", or "YYYY-MM-DD"
	"artist-credit"?: { name: string }[];
}
