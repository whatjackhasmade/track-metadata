import { MetaDataBlock } from "./MetaDataBlock";

export class MetaDataBlockPicture extends MetaDataBlock {
	public pictureType: number = 0;
	public mimeType: string = "";
	public description: string = "";
	public width: number = 0;
	public height: number = 0;
	public bitsPerPixel: number = 0;
	public colors: number = 0;
	public pictureData: Buffer | null = null;

	constructor(isLast: boolean) {
		// 6 is the specific block type for 'Picture' in metadata specs
		super(isLast, 6);
	}

	/**
	 * Static factory method to create an instance with data already populated
	 */
	public static create(
		isLast: boolean,
		pictureType: number,
		mimeType: string,
		description: string,
		width: number,
		height: number,
		bitsPerPixel: number,
		colors: number,
		pictureData: Buffer,
	): MetaDataBlockPicture {
		const mdb = new MetaDataBlockPicture(isLast);
		Object.assign(mdb, {
			pictureType,
			mimeType,
			description,
			width,
			height,
			bitsPerPixel,
			colors,
			pictureData,
			hasData: true,
		});
		return mdb;
	}

	public parse(buffer: Buffer): void {
		try {
			let pos = 0;

			this.pictureType = buffer.readUInt32BE(pos);
			pos += 4;

			const mimeTypeLength = buffer.readUInt32BE(pos);
			this.mimeType = buffer.toString(
				"utf8",
				pos + 4,
				pos + 4 + mimeTypeLength,
			);
			pos += 4 + mimeTypeLength;

			const descriptionLength = buffer.readUInt32BE(pos);
			this.description = buffer.toString(
				"utf8",
				pos + 4,
				pos + 4 + descriptionLength,
			);
			pos += 4 + descriptionLength;

			this.width = buffer.readUInt32BE(pos);
			this.height = buffer.readUInt32BE(pos + 4);
			this.bitsPerPixel = buffer.readUInt32BE(pos + 8);
			this.colors = buffer.readUInt32BE(pos + 12);
			pos += 16;

			const pictureDataLength = buffer.readUInt32BE(pos);
			// Use Buffer.alloc for safety
			this.pictureData = Buffer.alloc(pictureDataLength);
			buffer.copy(this.pictureData, 0, pos + 4, pos + 4 + pictureDataLength);

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

		// Write Header
		let header = size;
		header |= Number(this.type) << 24;
		header |= this.isLast ? 0x80000000 : 0;
		buffer.writeUInt32BE(header >>> 0, pos);
		pos += 4;

		// Write Picture Meta
		buffer.writeUInt32BE(this.pictureType, pos);
		pos += 4;

		const mimeTypeLen = Buffer.byteLength(this.mimeType);
		buffer.writeUInt32BE(mimeTypeLen, pos);
		buffer.write(this.mimeType, pos + 4);
		pos += 4 + mimeTypeLen;

		const descLen = Buffer.byteLength(this.description);
		buffer.writeUInt32BE(descLen, pos);
		buffer.write(this.description, pos + 4);
		pos += 4 + descLen;

		buffer.writeUInt32BE(this.width, pos);
		buffer.writeUInt32BE(this.height, pos + 4);
		buffer.writeUInt32BE(this.bitsPerPixel, pos + 8);
		buffer.writeUInt32BE(this.colors, pos + 12);
		pos += 16;

		if (this.pictureData) {
			buffer.writeUInt32BE(this.pictureData.length, pos);
			this.pictureData.copy(buffer, pos + 4);
		}

		return buffer;
	}

	public getSize(): number {
		const picDataLen = this.pictureData ? this.pictureData.length : 0;
		return (
			4 +
			(4 + Buffer.byteLength(this.mimeType)) +
			(4 + Buffer.byteLength(this.description)) +
			16 +
			(4 + picDataLen)
		);
	}

	public override toString(): string {
		let str = `[MetaDataBlockPicture] type: ${this.type}, isLast: ${this.isLast}`;

		if (this.error) str += `\n  ERROR: ${this.error.message}`;

		if (this.hasData) {
			str += `\n  pictureType: ${this.pictureType}
  mimeType: ${this.mimeType}
  description: ${this.description}
  dimensions: ${this.width}x${this.height}
  depth: ${this.bitsPerPixel} bits, ${this.colors} colors
  pictureData: ${this.pictureData ? `${this.pictureData.length} bytes` : "<null>"}`;
		}
		return str;
	}
}
