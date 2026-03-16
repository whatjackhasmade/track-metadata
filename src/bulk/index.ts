import * as path from "node:path";
import { checkbox, confirm, input } from "@inquirer/prompts";
import chalk from "chalk";
import ora from "ora";
import type { TrackMeta } from "../../types";
import { Genre } from "../enums/genres";
import { collectAudioMetadataFromDirectory } from "../functions";
import { writeMeta } from "../writer";

type EditableField = keyof Omit<TrackMeta, "filePath" | "format">;

const editableFields: { value: EditableField; name: string }[] = [
	{ value: "album", name: "Album" },
	{ value: "artist", name: "Artist" },
	{ value: "year", name: "Year" },
	{ value: "genre", name: "Genre" },
];

async function write(
	tracks: TrackMeta[],
	updates: Partial<TrackMeta>,
): Promise<void> {
	const writeSpinner = ora("Writing tags...").start();
	let success = 0;
	let failed = 0;

	for (const track of tracks) {
		try {
			await writeMeta(track, updates);
			success++;
		} catch (err) {
			writeSpinner.stop();
			console.warn(chalk.red(`✗ ${track.filePath}: ${(err as Error).message}`));
			writeSpinner.start("Writing tags...");
			failed++;
		}
	}

	writeSpinner.succeed(
		`Done — ${chalk.green(`${success} updated`)}` +
			(failed > 0 ? chalk.red(`, ${failed} failed`) : ""),
	);
}

export async function bulkTag(directory: string): Promise<void> {
	console.clear();
	console.log(chalk.bold.cyan("Bulk Tag Editor\n"));

	const spinner = ora(`Scanning ${directory}...`).start();
	const tracks = await collectAudioMetadataFromDirectory(directory);
	spinner.succeed(`Found ${chalk.bold(`${tracks.length}`)} MP3/FLAC files`);

	if (!tracks.length) {
		console.log(chalk.yellow("No supported files found."));
		return;
	}

	const artists = new Set(tracks.map((track) => track.artist).filter(Boolean));
	const albums = new Set(tracks.map((track) => track.album).filter(Boolean));
	const years = new Set(tracks.map((track) => track.year).filter(Boolean));
	const genres = new Set(tracks.map((track) => track.genre).filter(Boolean));

	console.log(chalk.dim(`Unique values across all ${tracks.length} files:`));
	console.log(
		`${chalk.cyan("Artists:")} ${[...artists].join("; ") || chalk.dim("N/A")}`,
	);
	console.log(
		`${chalk.cyan("Albums:")} ${[...albums].join("; ") || chalk.dim("N/A")}`,
	);
	console.log(
		`${chalk.cyan("Years:")} ${[...years].join("; ") || chalk.dim("N/A")}`,
	);
	console.log(
		`${chalk.cyan("Genres:")} ${[...genres].join("; ") || chalk.dim("N/A")}`,
	);

	console.log("\n------------------------------------\n");

	const selectedFields = await checkbox({
		message: "Which fields do you want to set?",
		choices: editableFields,
		validate: (value) => value.length > 0 || "Select at least one field",
	});

	const updates: Partial<TrackMeta> = {};

	for (const field of selectedFields as EditableField[]) {
		const value = await promptFieldValue(field);
		// Ensure value is string or number, and cast to the correct type
		(updates as Record<string, string | number>)[field] = value;
	}

	// 4. Summary + confirm
	console.log(`\n${chalk.bold("Changes to apply:")}`);

	for (const [key, val] of Object.entries(updates)) {
		console.log(`${chalk.cyan(key)}: ${chalk.yellow(String(val))}`);
	}

	console.log(
		`\n${chalk.bold("To all")} ${chalk.cyan(String(tracks.length))} files in:`,
	);

	console.log(`${chalk.dim(path.resolve(directory))}\n`);

	const confirmed = await confirm({ message: "Apply?", default: false });

	if (!confirmed) {
		console.log(chalk.dim("Cancelling bulk tag operation."));
		return;
	}

	// 5. Write
	await write(tracks, updates);
}

async function promptFieldValue(
	field: EditableField,
): Promise<string | number> {
	switch (field) {
		case "genre": {
			const genres = Object.values(Genre).map((genre) => ({
				name: genre,
				value: genre,
			}));

			const selectedGenres = await checkbox({
				message: "What genres do you want to apply?",
				choices: genres,
				validate: (value) => value.length > 0 || "Select at least one genre",
			});

			return selectedGenres.sort().join(", ");
		}
		case "trackNumber": {
			const raw = await input({
				message: "Track number:",
				validate: (value) => /^\d+$/.test(value) || "Enter a valid number",
			});
			return parseInt(raw, 10);
		}
		case "year": {
			const raw = await input({
				message: "Year:",
				validate: (value) =>
					/^\d{4}$/.test(value) || "Enter a valid 4-digit year",
			});
			return parseInt(raw, 10);
		}
		default: {
			return await input({
				message: `${field.charAt(0).toUpperCase() + field.slice(1)}:`,
				validate: (value) => value.trim().length > 0 || "Cannot be empty",
			});
		}
	}
}
