import { MetaDataBlock } from "./MetaDataBlock";

export class MetaDataBlockStreamInfo extends MetaDataBlock {
	public minBlockSize: number = 0;
	public maxBlockSize: number = 0;
	public minFrameSize: number = 0;
	public maxFrameSize: number = 0;
	public sampleRate: number = 0;
	public channels: number = 0;
	public bitsPerSample: number = 0;
	public samples: number = 0;
	public checksum: Buffer | null = null;
	public duration: number = 0;
	public durationStr: string = "0:00.000";

	constructor(isLast: boolean) {
		// 0 is the block type for 'StreamInfo'
		super(isLast, 0);
	}

	/**
	 * Overriding remove because StreamInfo is mandatory in FLAC
	 */
	public override remove(): void {
		console.error("WARNING: Can't remove StreamInfo block!");
	}

	public parse(buffer: Buffer): void {
		try {
			const pos = 0;

			// Basic sizes
			this.minBlockSize = buffer.readUInt16BE(pos);
			this.maxBlockSize = buffer.readUInt16BE(pos + 2);

			// 24-bit integers (3 bytes)
			this.minFrameSize =
				(buffer.readUInt8(pos + 4) << 16) | buffer.readUInt16BE(pos + 5);
			this.maxFrameSize =
				(buffer.readUInt8(pos + 7) << 16) | buffer.readUInt16BE(pos + 8);

			// Bit-packed data: Sample Rate (20 bits), Channels (3 bits), Bits per Sample (5 bits)
			const tmp = buffer.readUInt32BE(pos + 10);
			this.sampleRate = tmp >>> 12;
			this.channels = (tmp >>> 9) & 0x07;
			this.bitsPerSample = (tmp >>> 4) & 0x1f;

			// Total samples (36 bits total: 4 bits from 'tmp' + 32 bits from next field)
			this.samples = (tmp & 0x0f) * 0x100000000 + buffer.readUInt32BE(pos + 14);

			// MD5 Checksum (16 bytes)
			this.checksum = Buffer.alloc(16);
			buffer.copy(this.checksum, 0, 18, 34);

			// Calculate duration and format string
			if (this.sampleRate > 0) {
				this.duration = this.samples / this.sampleRate;
				this.durationStr = this.formatDuration(this.duration);
			}

			this.hasData = true;
		} catch (e) {
			this.error = e instanceof Error ? e : new Error(String(e));
			this.hasData = false;
		}
	}

	private formatDuration(secondsTotal: number): string {
		const minutes = Math.floor(secondsTotal / 60);
		const seconds = Math.floor(secondsTotal % 60);
		const milliseconds = Math.round((secondsTotal % 1) * 1000);

		const s = seconds.toString().padStart(2, "0");
		const ms = milliseconds.toString().padStart(3, "0");

		return `${minutes}:${s}.${ms}`;
	}

	public override toString(): string {
		let str = `[MetaDataBlockStreamInfo] type: ${this.type}, isLast: ${this.isLast}`;

		if (this.error) str += `\n  ERROR: ${this.error.message}`;

		if (this.hasData) {
			str += `
  minBlockSize: ${this.minBlockSize}
  maxBlockSize: ${this.maxBlockSize}
  minFrameSize: ${this.minFrameSize}
  maxFrameSize: ${this.maxFrameSize}
  samples: ${this.samples}
  sampleRate: ${this.sampleRate}Hz
  channels: ${this.channels + 1}
  bitsPerSample: ${this.bitsPerSample + 1}
  duration: ${this.durationStr}
  checksum: ${this.checksum?.toString("hex") ?? "<null>"}`;
		}
		return str;
	}
}
