export interface ITunesTrack {
  trackId: number;
  artistName: string;
  trackName: string;
  previewUrl: string;
  artworkUrl100: string;
}

export async function searchTracks(query: string): Promise<ITunesTrack[]> {
  if (!query) return [];
  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=10`);
    const data = await res.json();
    return data.results.filter((track: any) => track.previewUrl).map((track: any) => ({
      trackId: track.trackId,
      artistName: track.artistName,
      trackName: track.trackName,
      previewUrl: track.previewUrl,
      artworkUrl100: track.artworkUrl100.replace('100x100bb', '600x600bb') // get higher res image
    }));
  } catch (error) {
    console.error("Failed to search tracks", error);
    return [];
  }
}
