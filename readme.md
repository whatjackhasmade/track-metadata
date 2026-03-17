# music-meta

A CLI tool for reading and writing metadata tags on MP3 and FLAC files.

## Installation

### Global Install (Recommended)
To use the tool from anywhere on your system, install it directly from npm:

```bash
npm install -g @wjhm/music-meta
```

## Usage

```bash
music-meta <command> [options]
```

## Commands

### `bulk <directory>`

Interactively apply a set of tags to all MP3/FLAC files in a directory.

```bash
music-meta bulk "Music/Laid Out - EP"
```

You will be prompted to enter the tag values you want to apply across all files in the directory.

## Development

```bash
# Run a command directly with tsx (no build step)
npm run dev -- bulk "Music/Laid Out - EP"

# Or use the named scripts
npm run bulk "Music/Laid Out - EP"

# Build for production
npm run build
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run the CLI via `tsx` (no build needed) |
| `npm run bulk` | Shorthand for `tsx src/index.ts bulk` |
| `npm run scan` | Shorthand for `tsx src/index.ts scan` |
| `npm run build` | Bundle and minify to `dist/index.cjs` via esbuild |
| `npm run typecheck` | Type-check with `tsc` (no emit) |

## Tech Stack

- [Commander](https://github.com/tj/commander.js) — CLI argument parsing
- [Inquirer](https://github.com/SBoudrias/Inquirer.js) — interactive prompts
- [music-metadata](https://github.com/borewit/music-metadata) — reading audio metadata
- [node-id3](https://github.com/Zazama/node-id3) — writing ID3 tags (MP3)
- [node-taglib-sharp](https://github.com/benrr101/node-taglib-sharp) — tag read/write (FLAC and more)
- [chalk](https://github.com/chalk/chalk) — terminal colours
- [ora](https://github.com/sindresorhus/ora) — terminal spinners
- [esbuild](https://esbuild.github.io/) — bundler
- [tsx](https://github.com/privatenumber/tsx) — TypeScript execution for development