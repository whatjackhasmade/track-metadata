import chalk from "chalk";
import ora from "ora";
import type { MissingField, TrackMeta } from "../../types";
import { handleMissingFields } from "../prompt";
import { scanDirectory } from "../scanner";

const CHECKABLE_FIELDS: (keyof Omit<TrackMeta, "filePath" | "format">)[] = [
	"year",
	"artist",
	"album",
	"title",
	"genre",
	"trackNumber",
] as const;

function isCheckableFilter(
	field: string,
): field is (typeof CHECKABLE_FIELDS)[number] {
	return (CHECKABLE_FIELDS as readonly string[]).includes(field);
}

export async function scan(
	dir: string,
	opts: { fields: string; dryRun: boolean },
) {
	const fields = opts.fields
		.split(",")
		.map((field) => field.trim())
		.filter(isCheckableFilter);

	if (fields.length === 0) {
		console.error(
			chalk.red(`Invalid fields. Choose from: ${CHECKABLE_FIELDS.join(", ")}`),
		);
		process.exit(1);
	}

	const spinner = ora(`Scanning ${dir}...`).start();
	const tracks = await scanDirectory(dir);
	spinner.succeed(`Scanned ${chalk.bold(String(tracks.length))} files`);

	const missing: MissingField[] = tracks
		.map((track) => ({
			track,
			missingFields: fields.filter((f) => track[f] == null),
		}))
		.filter((x) => x.missingFields.length > 0);

	if (missing.length === 0) {
		console.log(chalk.green(`\n✓ All files have: ${fields.join(", ")}`));
		process.exit(0);
	}

	console.log(
		`\n${chalk.yellow(`⚠ ${missing.length} files missing: ${fields.join(", ")}`)}\n`,
	);

	if (opts.dryRun) {
		for (const { track, missingFields } of missing) {
			console.log(
				`${chalk.dim(track.filePath)}\n  missing: ${chalk.red(missingFields.join(", "))}`,
			);
		}
		process.exit(0);
	}

	// Only year gets the MusicBrainz flow for now — others just prompt for manual input
	for (const item of missing) {
		if (item.missingFields.length) {
			await handleMissingFields(item);
		}
	}

	console.log(chalk.green("\n✓ Done"));
}
