import { MetaDataBlock } from "./MetaDataBlock";

export class MetaDataBlockVorbisComment extends MetaDataBlock {
	public vendor: string = "";
	public comments: string[] = [];

	constructor(isLast: boolean) {
		// 4 is the block type for 'Vorbis Comment'
		super(isLast, 4);
	}

	public static create(
		isLast: boolean,
		vendor: string,
		comments: string[],
	): MetaDataBlockVorbisComment {
		const mdb = new MetaDataBlockVorbisComment(isLast);
		mdb.vendor = vendor;
		mdb.comments = comments;
		mdb.hasData = true;
		return mdb;
	}

	public parse(buffer: Buffer): void {
		try {
			let pos = 0;

			// Vendor string length and data (Little Endian)
			const vendorLen = buffer.readUInt32LE(pos);
			this.vendor = buffer.toString("utf8", pos + 4, pos + 4 + vendorLen);
			pos += 4 + vendorLen;

			// Number of comments (Little Endian)
			let commentCount = buffer.readUInt32LE(pos);
			pos += 4;

			this.comments = [];
			while (commentCount > 0) {
				const commentLen = buffer.readUInt32LE(pos);
				const comment = buffer.toString("utf8", pos + 4, pos + 4 + commentLen);
				this.comments.push(comment);
				pos += 4 + commentLen;
				commentCount--;
			}

			this.hasData = true;
		} catch (e) {
			this.error = e instanceof Error ? e : new Error(String(e));
			this.hasData = false;
		}
	}

	public publish(): Buffer {
		const size = this.getSize();
		const buffer = Buffer.alloc(4 + size);
		let pos = 0;

		// FLAC Block Header (Big Endian)
		let header = size;
		header |= Number(this.type) << 24;
		header |= this.isLast ? 0x80000000 : 0;
		buffer.writeUInt32BE(header >>> 0, pos);
		pos += 4;

		// Vendor (Little Endian per Vorbis spec)
		const vendorLen = Buffer.byteLength(this.vendor);
		buffer.writeUInt32LE(vendorLen, pos);
		buffer.write(this.vendor, pos + 4);
		pos += 4 + vendorLen;

		// Comment List
		buffer.writeUInt32LE(this.comments.length, pos);
		pos += 4;

		for (const comment of this.comments) {
			const commentLen = Buffer.byteLength(comment);
			buffer.writeUInt32LE(commentLen, pos);
			buffer.write(comment, pos + 4);
			pos += 4 + commentLen;
		}

		return buffer;
	}

	public getSize(): number {
		// 4 (vendor len) + vendor string + 4 (comment count)
		let size = 8 + Buffer.byteLength(this.vendor);
		for (const comment of this.comments) {
			size += 4 + Buffer.byteLength(comment);
		}
		return size;
	}

	public override toString(): string {
		let str = `[MetaDataBlockVorbisComment] type: ${this.type}, isLast: ${this.isLast}`;

		if (this.error) str += `\n  ERROR: ${this.error.message}`;

		if (this.hasData) {
			str += `\n  vendor: ${this.vendor}`;
			if (this.comments.length > 0) {
				str += "\n  comments:";
				this.comments.forEach((c) => {
					// Replaces the first '=' with ': ' for a cleaner look
					str += `\n    ${c.replace("=", ": ")}`;
				});
			} else {
				str += "\n  comments: none";
			}
		}
		return str;
	}
}
