export class MetaDataBlock {
	public error: Error | null = null;
	public hasData: boolean = false;
	public removed: boolean = false;

	constructor(
		public isLast: boolean,
		public type: string | number,
	) {}

	public remove(): void {
		this.removed = true;
	}

	public toString(): string {
		return `[MetaDataBlock] type: ${this.type}, isLast: ${this.isLast}`;
	}
}
