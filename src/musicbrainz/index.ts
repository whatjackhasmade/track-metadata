import type { MusicBrainzRelease } from "../../types";

const BASE = "https://musicbrainz.org/ws/2";
const HEADERS = {
	"User-Agent":
		"music-meta-cli/1.0 (github.com/whatjackhasmade/music-meta-cli)",
	Accept: "application/json",
};

// MusicBrainz rate limit is 1 req/sec for unauthenticated
const rateLimit = (() => {
	let lastCall = 0;
	return () =>
		new Promise<void>((res) => {
			const wait = Math.max(0, 1100 - (Date.now() - lastCall));
			lastCall = Date.now() + wait;
			setTimeout(res, wait);
		});
})();

export async function searchReleaseYear(
	artist: string,
	album: string,
): Promise<MusicBrainzRelease[]> {
	await rateLimit();

	const query = encodeURIComponent(`release:"${album}" AND artist:"${artist}"`);
	const url = `${BASE}/release?query=${query}&limit=5&fmt=json`;

	const res = await fetch(url, { headers: HEADERS });
	if (!res.ok) throw new Error(`MusicBrainz error: ${res.status}`);

	const data = (await res.json()) as { releases: MusicBrainzRelease[] };
	return data.releases ?? [];
}

export function extractYear(release: MusicBrainzRelease): number | undefined {
	const dateStr = release.date;
	if (!dateStr) return undefined;
	const year = parseInt(dateStr.slice(0, 4), 10);
	return Number.isNaN(year) ? undefined : year;
}
