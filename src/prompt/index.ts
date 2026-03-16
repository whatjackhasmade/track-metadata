import { input, select } from "@inquirer/prompts";
import chalk from "chalk";
import type { MissingField, TrackMeta } from "../../types";
import { extractYear, searchReleaseYear } from "../musicbrainz";
import { writeMeta } from "../writer";

type EditableField = keyof Omit<TrackMeta, "filePath" | "format">;

export async function handleMissingFields(item: MissingField): Promise<void> {
	const { track } = item;
	const label = `${track.artist ?? "Unknown Artist"} — ${track.album ?? "Unknown Album"}`;

	console.log(`\n${chalk.bold.cyan(label)}`);
	console.log(chalk.dim(track.filePath));
	console.log(`  missing: ${chalk.red(item.missingFields.join(", "))}`);

	const updates: Partial<TrackMeta> = {};

	for (const field of item.missingFields) {
		if (field === "year") {
			const year = await promptYear(track);
			if (year) updates.year = year;
		} else {
			const value = await promptGenericField(field, track);
			if (value) (updates as any)[field] = value;
		}
	}

	if (Object.keys(updates).length > 0) {
		await writeMeta(track, updates);
		console.log(
			`  ${chalk.green("✓")} Saved: ${Object.entries(updates)
				.map(([k, v]) => `${k}=${chalk.yellow(String(v))}`)
				.join(", ")}`,
		);
	}
}

async function promptYear(track: TrackMeta): Promise<number | undefined> {
	let suggestedYear: number | undefined;

	if (track.artist && track.album) {
		try {
			process.stdout.write(chalk.dim("  Searching MusicBrainz..."));
			const releases = await searchReleaseYear(track.artist, track.album);
			process.stdout.write("\r\x1b[K");

			if (releases.length > 0) {
				suggestedYear = extractYear(releases[0]);
				if (suggestedYear) {
					console.log(
						`  ${chalk.green("✓")} MusicBrainz suggests: ${chalk.yellow(String(suggestedYear))}`,
					);
				}
			} else {
				console.log(`  ${chalk.dim("No MusicBrainz results found.")}`);
			}
		} catch {
			console.log(`  ${chalk.dim("MusicBrainz lookup failed.")}`);
		}
	}

	const action = await select({
		message: "Year:",
		choices: [
			...(suggestedYear
				? [{ name: `Use ${suggestedYear}`, value: "accept" }]
				: []),
			{ name: "Enter manually", value: "manual" },
			{ name: "Skip", value: "skip" },
		],
	});

	if (action === "skip") return undefined;
	if (action === "accept") return suggestedYear;

	const raw = await input({
		message: "Enter year:",
		validate: (v) => /^\d{4}$/.test(v) || "Enter a valid 4-digit year",
	});
	return parseInt(raw, 10);
}

async function promptGenericField(
	field: EditableField,
	_track: TrackMeta,
): Promise<string | number | undefined> {
	const action = await select({
		message: `${field}:`,
		choices: [
			{ name: "Enter manually", value: "manual" },
			{ name: "Skip", value: "skip" },
		],
	});

	if (action === "skip") return undefined;

	const raw = await input({
		message: `Enter ${field}:`,
		validate: (v) => v.trim().length > 0 || "Cannot be empty",
	});

	return field === "trackNumber" ? parseInt(raw, 10) : raw.trim();
}
