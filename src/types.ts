export type MediaType = 'movie' | 'series' | 'anime';

export interface MediaItem {
  id: string; // IMDb ID or stable identifier
  title: string;
  type: MediaType;
  year: string;
  rating: string;
  genres: string[];
  overview: string;
  imdbId: string;
  poster: string;
  banner: string;
  seasonsCount?: number;
  episodesCount?: number;
  episodesPerSeason?: number[]; // count of episodes for each season
}

export interface PlayerState {
  activeMedia: MediaItem | null;
  season: number;
  episode: number;
  serverId: string;
}

export interface ServerOption {
  id: string;
  name: string;
  urlPattern: (imdbId: string, season?: number, episode?: number) => string;
  description: string;
}

export interface DownloadItem {
  mediaId: string;
  media: MediaItem;
  progress: number;
  status: 'downloading' | 'paused' | 'completed' | 'queued';
  downloadSpeed: string; // e.g., '12.4 MB/s'
  downloadedSize: string; // e.g., '350 MB'
  totalSize: string; // e.g., '1.2 GB'
  season?: number; // for tracking specific episodes
  episode?: number;
  addedAt: string;
}
