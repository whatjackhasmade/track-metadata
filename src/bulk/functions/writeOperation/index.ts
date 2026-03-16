import chalk from "chalk";
import ora from "ora";
import type { TrackMeta } from "../../../../types";
import { writeMeta } from "../../../writer";

export async function applyTagWrites(
	tracks: TrackMeta[],
	updates: Partial<TrackMeta>,
) {
	const spinner = ora("Writing tags...").start();
	let success = 0;
	let failed = 0;

	for (const track of tracks) {
		try {
			await writeMeta(track, updates);
			success++;
		} catch (err) {
			spinner.stop();
			console.warn(chalk.red(`✗ ${track.filePath}: ${(err as Error).message}`));
			spinner.start("Writing tags...");
			failed++;
		}
	}

	spinner.succeed(
		`Done — ${chalk.green(`${success} updated`)}` +
			(failed > 0 ? chalk.red(`, ${failed} failed`) : ""),
	);
}
