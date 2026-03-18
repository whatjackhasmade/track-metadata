import * as path from "node:path";
import { checkbox, confirm } from "@inquirer/prompts";
import chalk from "chalk";
import ora from "ora";
import type { TrackMeta } from "@/types";
import { getMetadataForFile } from "@/utils";
import {
	applyTagWrites,
	editableFields,
	promptFieldValue,
} from "../../functions";

type EditableField = keyof Omit<TrackMeta, "filePath" | "format">;

export async function singleTag(filePath: string) {
	console.clear();
	console.log(chalk.bold.cyan("Single Tag Editor\n"));

	const spinner = ora(`Looking for ${filePath}...`).start();

	const metadata = await getMetadataForFile(filePath);

	if (metadata.isErr()) {
		spinner.fail(`${chalk.red("Failed:")} ${metadata.error.message}`);
		return;
	}

	spinner.succeed(`Found ${chalk.bold(filePath)} MP3/FLAC files`);

	printSummary(metadata.value);

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

	printConfirmation(updates, filePath);

	const confirmed = await confirm({ message: "Apply?", default: false });
	if (!confirmed) {
		console.log(chalk.dim("Cancelling Single tag operation."));
		return;
	}

	await applyTagWrites(metadata.value, updates);
}

function printSummary(track: TrackMeta) {
	console.log(chalk.dim(`Unique values across all files:`));
	console.log(`${chalk.cyan("Artists:")} ${track.artist || chalk.dim("N/A")}`);
	console.log(`${chalk.cyan("Albums:")}  ${track.album || chalk.dim("N/A")}`);
	console.log(`${chalk.cyan("Years:")}   ${track.year || chalk.dim("N/A")}`);
	console.log(`${chalk.cyan("Genres:")}  ${track.genre || chalk.dim("N/A")}`);
	console.log("\n------------------------------------\n");
}

function printConfirmation(updates: Partial<TrackMeta>, filePath: string) {
	console.log(`\n${chalk.bold("Changes to apply:")}`);

	for (const [key, val] of Object.entries(updates)) {
		console.log(`  ${chalk.cyan(key)}: ${chalk.yellow(String(val))}`);
	}

	console.log(`${chalk.dim(path.resolve(filePath))}\n`);
}
