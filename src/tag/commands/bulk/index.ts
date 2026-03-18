import * as path from "node:path";
import { checkbox, confirm } from "@inquirer/prompts";
import chalk from "chalk";
import ora from "ora";
import type { TrackMeta } from "@/types";
import { collectAudioMetadataFromDirectory } from "@/utils";
import {
	applyTagWrites,
	editableFields,
	promptFieldValue,
} from "../../functions";

type EditableField = keyof Omit<TrackMeta, "filePath" | "format">;

export async function bulkTag(directory: string) {
	console.clear();
	console.log(chalk.bold.cyan("Bulk Tag Editor\n"));

	const spinner = ora(`Scanning ${directory}...`).start();
	const tracks = await collectAudioMetadataFromDirectory(directory);
	spinner.succeed(`Found ${chalk.bold(`${tracks.length}`)} MP3/FLAC files`);

	if (!tracks.length) {
		console.log(chalk.yellow("No supported files found."));
		return;
	}

	printSummary(tracks);

	const selectedFields = await checkbox({
		message: "Which fields do you want to set?",
		choices: editableFields,
		validate: (value) => !!value.length || "Select at least one field",
	});

	const updates: Partial<TrackMeta> = {};
	for (const field of selectedFields as EditableField[]) {
		(updates as Record<string, string | number>)[field] =
			await promptFieldValue(field);
	}

	printConfirmation(updates, tracks.length, directory);

	const confirmed = await confirm({ message: "Apply?", default: false });
	if (!confirmed) {
		console.log(chalk.dim("Cancelling bulk tag operation."));
		return;
	}

	await applyTagWrites(tracks, updates);
}

function uniqueValues<T extends TrackMeta>(tracks: T[], key: keyof T) {
	const uniqueSet = new Set(tracks.map((track) => track[key]).filter(Boolean));
	return uniqueSet.size ? Array.from(uniqueSet).join("; ") : chalk.dim("N/A");
}

function printSummary(tracks: TrackMeta[]): void {
	console.log(chalk.dim(`Unique values across all ${tracks.length} files:`));
	console.log(`${chalk.cyan("Artists:")} ${uniqueValues(tracks, "artist")}`);
	console.log(`${chalk.cyan("Albums:")}  ${uniqueValues(tracks, "album")}`);
	console.log(`${chalk.cyan("Years:")}   ${uniqueValues(tracks, "year")}`);
	console.log(`${chalk.cyan("Genres:")}  ${uniqueValues(tracks, "genre")}`);
	console.log("\n------------------------------------\n");
}

function printConfirmation(
	updates: Partial<TrackMeta>,
	count: number,
	directory: string,
): void {
	console.log(`\n${chalk.bold("Changes to apply:")}`);
	for (const [key, val] of Object.entries(updates)) {
		console.log(`  ${chalk.cyan(key)}: ${chalk.yellow(String(val))}`);
	}
	console.log(
		`\n${chalk.bold("To all")} ${chalk.cyan(String(count))} files in:`,
	);
	console.log(`${chalk.dim(path.resolve(directory))}\n`);
}
