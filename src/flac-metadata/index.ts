import {
	Transform,
	type TransformCallback,
	type TransformOptions,
} from "node:stream";
import { MetaDataBlock } from "./data/MetaDataBlock";
import { MetaDataBlockPicture } from "./data/MetaDataBlockPicture";
import { MetaDataBlockStreamInfo } from "./data/MetaDataBlockStreamInfo";
import { MetaDataBlockVorbisComment } from "./data/MetaDataBlockVorbisComment";

enum State {
	IDLE,
	MARKER,
	MDB_HEADER,
	MDB,
	PASS_THROUGH,
}

export interface ProcessorOptions extends TransformOptions {
	parseMetaDataBlocks?: boolean;
}

export class Processor extends Transform {
	// MDB Types
	public static readonly MDB_TYPE_STREAMINFO = 0;
	public static readonly MDB_TYPE_PADDING = 1;
	public static readonly MDB_TYPE_APPLICATION = 2;
	public static readonly MDB_TYPE_SEEKTABLE = 3;
	public static readonly MDB_TYPE_VORBIS_COMMENT = 4;
	public static readonly MDB_TYPE_CUESHEET = 5;
	public static readonly MDB_TYPE_PICTURE = 6;
	public static readonly MDB_TYPE_INVALID = 127;

	private state: State = State.IDLE;
	private isFlac: boolean = false;
	private buf: Buffer | null = null;
	private bufPos: number = 0;

	private mdb: MetaDataBlock | null = null;
	private mdbLen: number = 0;
	private mdbLast: boolean = false;
	private mdbPush: boolean = false;
	private mdbLastWritten: boolean = false;

	private parseMetaDataBlocks: boolean;

	constructor(options?: ProcessorOptions) {
		super(options);
		this.parseMetaDataBlocks = !!options?.parseMetaDataBlocks;
	}

	/**
	 * Safe helper to handle chunk slicing and backup buffering
	 */
	private safePush(
		chunk: Buffer,
		chunkPos: number,
		minCapacity: number,
		persist: boolean,
		validate?: (slice: Buffer, isDone: boolean) => boolean,
	): { isDone: boolean; consumed: number } {
		const chunkAvailable = chunk.length - chunkPos;
		const isDone = chunkAvailable + this.bufPos >= minCapacity;
		const validator = validate ?? (() => true);

		if (isDone) {
			let slice: Buffer;
			const neededFromChunk = minCapacity - this.bufPos;

			if (persist) {
				if (this.bufPos > 0 && this.buf) {
					chunk.copy(
						this.buf,
						this.bufPos,
						chunkPos,
						chunkPos + neededFromChunk,
					);
					slice = this.buf.subarray(0, minCapacity);
				} else {
					slice = chunk.subarray(chunkPos, chunkPos + minCapacity);
				}
			} else {
				slice = chunk.subarray(chunkPos, chunkPos + neededFromChunk);
			}

			if (validator(slice, isDone)) {
				this.push(slice);
			}

			const consumed = neededFromChunk;
			this.bufPos = 0;
			this.buf = null;
			return { isDone: true, consumed };
		} else {
			const remainingInChunk = chunk.length - chunkPos;
			if (persist) {
				this.buf = this.buf || Buffer.alloc(minCapacity);
				chunk.copy(this.buf, this.bufPos, chunkPos, chunk.length);
			} else {
				const slice = chunk.subarray(chunkPos, chunk.length);
				if (validator(slice, isDone)) {
					this.push(slice);
				}
			}
			this.bufPos += remainingInChunk;
			return { isDone: false, consumed: remainingInChunk };
		}
	}

	_transform(
		chunk: Buffer,
		_enc: BufferEncoding,
		done: TransformCallback,
	): void {
		let chunkPos = 0;
		let isChunkProcessed = false;

		while (!isChunkProcessed) {
			switch (this.state) {
				case State.IDLE:
					this.state = State.MARKER;
					break;

				case State.MARKER: {
					const { isDone, consumed } = this.safePush(
						chunk,
						chunkPos,
						4,
						true,
						this._validateMarker.bind(this),
					);
					chunkPos += consumed;
					if (isDone) {
						this.state = this.isFlac ? State.MDB_HEADER : State.PASS_THROUGH;
					} else {
						isChunkProcessed = true;
					}
					break;
				}

				case State.MDB_HEADER: {
					const { isDone, consumed } = this.safePush(
						chunk,
						chunkPos,
						4,
						true,
						this._validateMDBHeader.bind(this),
					);
					chunkPos += consumed;
					if (isDone) {
						this.state = State.MDB;
					} else {
						isChunkProcessed = true;
					}
					break;
				}

				case State.MDB: {
					const { isDone, consumed } = this.safePush(
						chunk,
						chunkPos,
						this.mdbLen,
						this.parseMetaDataBlocks,
						this._validateMDB.bind(this),
					);
					chunkPos += consumed;
					if (isDone) {
						if (this.mdb?.isLast) this.mdbLastWritten = true;
						this.emit("postprocess", this.mdb);
						this.state = this.mdbLast ? State.PASS_THROUGH : State.MDB_HEADER;
					} else {
						isChunkProcessed = true;
					}
					break;
				}

				case State.PASS_THROUGH: {
					const remaining = chunk.length - chunkPos;
					this.safePush(chunk, chunkPos, remaining, false);
					isChunkProcessed = true;
					break;
				}
			}
		}
		done();
	}

	private _validateMarker(slice: Buffer): boolean {
		this.isFlac = slice.toString("utf8", 0, 4) === "fLaC";
		return true;
	}

	private _validateMDBHeader(slice: Buffer): boolean {
		let header = slice.readUInt32BE(0);
		const type = (header >>> 24) & 0x7f;
		this.mdbLast = ((header >>> 24) & 0x80) !== 0;
		this.mdbLen = header & 0xffffff;

		switch (type) {
			case Processor.MDB_TYPE_STREAMINFO:
				this.mdb = new MetaDataBlockStreamInfo(this.mdbLast);
				break;
			case Processor.MDB_TYPE_VORBIS_COMMENT:
				this.mdb = new MetaDataBlockVorbisComment(this.mdbLast);
				break;
			case Processor.MDB_TYPE_PICTURE:
				this.mdb = new MetaDataBlockPicture(this.mdbLast);
				break;
			default:
				this.mdb = new MetaDataBlock(this.mdbLast, type);
		}

		this.emit("preprocess", this.mdb);

		if (this.mdbLastWritten) {
			this.mdb.remove();
		} else if (this.mdbLast !== this.mdb.isLast) {
			// If user changed mdb.isLast in preprocess, update the header buffer
			header = this.mdb.isLast ? header | 0x80000000 : header & 0x7fffffff;
			slice.writeUInt32BE(header >>> 0, 0);
		}

		this.mdbPush = !this.mdb.removed;
		return this.mdbPush;
	}

	private _validateMDB(slice: Buffer, isDone: boolean): boolean {
		if (this.parseMetaDataBlocks && isDone && this.mdb) {
			// this.mdb.parse(slice);
			console.log(
				`Parsing MDB of type ${this.mdb.type} with length ${slice.length} bytes`,
			);
		}
		return this.mdbPush;
	}

	_flush(done: TransformCallback): void {
		this.state = State.IDLE;
		this.mdbLastWritten = false;
		this.isFlac = false;
		this.bufPos = 0;
		this.buf = null;
		this.mdb = null;
		done();
	}
}

export {
	MetaDataBlock,
	MetaDataBlockPicture,
	MetaDataBlockStreamInfo,
	MetaDataBlockVorbisComment,
};
