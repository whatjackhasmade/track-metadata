import * as path from "node:path";
import { checkbox, confirm, input } from "@inquirer/prompts";
import chalk from "chalk";
import ora from "ora";
import type { TrackMeta } from "../../types";
import { Genre } from "../enums/genres";
import { scanDirectory } from "../scanner";
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
			console.warn(
				chalk.red(`  ✗ ${track.filePath}: ${(err as Error).message}`),
			);
			writeSpinner.start("Writing tags...");
			failed++;
		}
	}

	writeSpinner.succeed(
		`Done — ${chalk.green(`${success} updated`)}` +
			(failed > 0 ? chalk.red(`, ${failed} failed`) : ""),
	);
}

export async function bulkTag(dir: string): Promise<void> {
	// 1. Scan
	const spinner = ora(`Scanning ${dir}...`).start();
	const tracks = await scanDirectory(dir);
	spinner.succeed(`Found ${chalk.bold(String(tracks.length))} MP3/FLAC files`);

	if (tracks.length === 0) {
		console.log(chalk.yellow("No supported files found."));
		return;
	}

	// 1.2 Quick preview of the files and what metadata currently exists
	console.log(`\n${chalk.bold("Preview:")}`);
	tracks
		.sort((a, b) => a.filePath.localeCompare(b.filePath))
		.slice(0, 3)
		.forEach((track) => {
			console.log(
				`${chalk.dim(track.filePath)}\n  ${chalk.cyan("Artist:")} ${track.artist ?? chalk.dim("N/A")}\n  ${chalk.cyan("Album:")} ${track.album ?? chalk.dim("N/A")}\n  ${chalk.cyan("Year:")} ${track.year ?? chalk.dim("N/A")}\n  ${chalk.cyan("Genre:")} ${track.genre ?? chalk.dim("N/A")}`,
			);
		});

	// 2. Pick which fields to set
	const selectedFields = await checkbox({
		message: "Which fields do you want to set?",
		choices: editableFields,
		validate: (value) => value.length > 0 || "Select at least one field",
	});

	// 3. Collect values for the selected fields (same value applied to all files)
	const updates: Partial<TrackMeta> = {};

	for (const field of selectedFields as EditableField[]) {
		const value = await promptFieldValue(field);
		if (value !== undefined) (updates as any)[field] = value;
	}

	// 4. Summary + confirm
	console.log(`\n${chalk.bold("Changes to apply:")}`);
	for (const [key, val] of Object.entries(updates)) {
		console.log(`  ${chalk.cyan(key)}: ${chalk.yellow(String(val))}`);
	}
	console.log(
		`\n${chalk.bold("To all")} ${chalk.cyan(String(tracks.length))} files in:`,
	);
	console.log(`  ${chalk.dim(path.resolve(dir))}\n`);

	const confirmed = await confirm({ message: "Apply?", default: false });
	if (!confirmed) {
		console.log(chalk.dim("Aborted."));
		return;
	}

	// 5. Write
	await write(tracks, updates);
}

async function promptFieldValue(
	field: EditableField,
): Promise<string | number | undefined> {
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
