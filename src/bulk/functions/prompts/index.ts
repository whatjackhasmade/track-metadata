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
				choices: Object.values(Genre).map((genre) => ({
					name: genre,
					value: genre,
				})),
				validate: (value) => value.length > 0 || "Select at least one genre",
			});
			return selected.sort().join(", ");
		}
		case "trackNumber": {
			const inputValue = await input({
				message: "Track number:",
				validate: (value) => /^\d+$/.test(value) || "Enter a valid number",
			});
			return parseInt(inputValue, 10);
		}
		case "year": {
			const inputValue = await input({
				message: "Year:",
				validate: (value) =>
					/^\d{4}$/.test(value) || "Enter a valid 4-digit year",
			});
			return parseInt(inputValue, 10);
		}
		default: {
			return input({
				message: `${field.charAt(0).toUpperCase() + field.slice(1)}:`,
				validate: (value) => value.trim().length > 0 || "Cannot be empty",
			});
		}
	}
}
