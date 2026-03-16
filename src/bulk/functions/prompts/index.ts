import { checkbox, input } from "@inquirer/prompts";
import type { TrackMeta } from "../../../../types";
import { Genre } from "../../../enums/genres";

type EditableField = keyof Omit<TrackMeta, "filePath" | "format">;

export const editableFields: { value: EditableField; name: string }[] = [
	{ value: "album", name: "Album" },
	{ value: "artist", name: "Artist" },
	{ value: "year", name: "Year" },
	{ value: "genre", name: "Genre" },
];

export async function promptFieldValue(field: EditableField) {
	switch (field) {
		case "genre": {
			const selected = await checkbox({
				message: "What genres do you want to apply?",
				choices: Object.values(Genre).map((g) => ({ name: g, value: g })),
				validate: (v) => v.length > 0 || "Select at least one genre",
			});
			return selected.sort().join(", ");
		}
		case "trackNumber": {
			const raw = await input({
				message: "Track number:",
				validate: (v) => /^\d+$/.test(v) || "Enter a valid number",
			});
			return parseInt(raw, 10);
		}
		case "year": {
			const raw = await input({
				message: "Year:",
				validate: (v) => /^\d{4}$/.test(v) || "Enter a valid 4-digit year",
			});
			return parseInt(raw, 10);
		}
		default: {
			return input({
				message: `${field.charAt(0).toUpperCase() + field.slice(1)}:`,
				validate: (v) => v.trim().length > 0 || "Cannot be empty",
			});
		}
	}
}
