#!/usr/bin/env node
import { program } from "commander";
import { bulkTag } from "./bulk";

// program
// 	.name("music-meta")
// 	.command("scan <directory>")
// 	.description("Scan for files missing metadata fields")
// 	.option(
// 		"-f, --fields <fields>",
// 		"Comma-separated fields to check for",
// 		"year",
// 	)
// 	.option("--dry-run", "List missing files without prompting")
// 	.action(scan);

program
	.command("bulk <directory>")
	.description("Apply a set of tags to all MP3/FLAC files in a directory")
	.action(bulkTag);

program.parse();
