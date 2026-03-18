import { program } from "commander";
import { bulkTag, singleTag } from "./tag";

program
	.name("music-meta")
	.command("update <directory>")
	.description("Apply a set of tags to a single MP3/FLAC file")
	.action(singleTag);

program
	.command("bulk <directory>")
	.description("Apply a set of tags to all MP3/FLAC files in a directory")
	.action(bulkTag);

program.parse();
