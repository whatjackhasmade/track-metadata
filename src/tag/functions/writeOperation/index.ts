import chalk from "chalk";
import ora from "ora";
import type { TrackMeta } from "@/types";
import { writeMetadataToFile } from "@/utils";

/**
 * Writes metadata updates to a collection of audio tracks, reporting
 * per-file failures inline without aborting the remaining writes.
 *
 * @param tracks  - All track metadata objects to update, each carrying its own `filePath`.
 * @param updates - Partial metadata fields to overwrite; only provided keys are written.
 */
export async function applyTagWrites(
	tracks: TrackMeta[] | TrackMeta,
	updates: Partial<TrackMeta>,
) {
	const spinner = ora("Writing tags...").start();
	let success = 0;
	let failed = 0;

	if (!Array.isArray(tracks)) {
		tracks = [tracks];
	}

	for (const track of tracks) {
		try {
			await writeMetadataToFile(track, updates);
			success++;
		} catch (err) {
			// Pause the spinner so the warning prints on its own line,
			// then resume to keep the progress indicator alive.
			spinner.stop();
			console.warn(chalk.red(`✗ ${track.filePath}: ${(err as Error).message}`));
			spinner.start("Writing tags...");
			failed++;
		}
	}

	// Only show the failure count suffix when at least one write failed.
	spinner.succeed(
		`Done — ${chalk.green(`${success} updated`)}` +
			(failed > 0 ? chalk.red(`, ${failed} failed`) : ""),
	);
}
