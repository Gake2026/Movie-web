import { motion } from 'motion/react';
import { Play, Download, Sparkles, Film, Tv, Star, MonitorPlay } from 'lucide-react';
import { MediaItem } from '../types';

interface MediaGridProps {
  mediaItems: MediaItem[];
  onSelectMedia: (media: MediaItem) => void;
  onInstantPlay: (media: MediaItem) => void;
  isOfflineMode: boolean;
  downloadedIds: string[];
}

export default function MediaGrid({
  mediaItems,
  onSelectMedia,
  onInstantPlay,
  isOfflineMode,
  downloadedIds
}: MediaGridProps) {
  if (mediaItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-4">
          <MonitorPlay className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold font-display text-white mb-2">No Content Found</h3>
        <p className="text-slate-400 max-w-sm text-sm">
          {isOfflineMode 
            ? "You don't have any downloads for this category yet. Toggle Online Sync mode in the top-right to browse and download from our streaming index."
            : "No match in our offline index. Try searching for a specific title in the search bar above!"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {mediaItems.map((media, index) => {
        const isDownloaded = downloadedIds.includes(media.id);

        return (
          <motion.div
            key={media.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.4) }}
            className="group relative cursor-pointer flex flex-col h-full rounded-2xl glass border border-white/5 overflow-hidden movie-card-transform"
            onClick={() => onSelectMedia(media)}
            id={`media-card-${media.id}`}
          >
            {/* Visual Header / Poster */}
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
              <img
                src={media.poster}
                alt={media.title}
                referrerPolicy="no-referrer"
                loading="lazy"
                className="w-full h-full object-cover transform group-hover:scale-105 duration-500 transition-all"
                onError={(e) => {
                  // Fallback beautiful poster graphic if image fails to load
                  e.currentTarget.src = `https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&q=80&w=600`;
                }}
              />
              
              {/* Overlays / Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                {/* Rating Badge */}
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-slate-950/85 backdrop-blur-md text-amber-400 border border-amber-400/30 flex items-center gap-1 shadow-md">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {media.rating}
                </span>

                {/* Media Type Badge */}
                <span className="px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold tracking-widest uppercase bg-brand-600/90 text-white shadow-md">
                  {media.type === 'series' ? 'Series' : media.type}
                </span>
              </div>

              {/* Downloaded Badge indicator */}
              {isDownloaded && (
                <div className="absolute top-3 right-3 z-10 bg-emerald-500/90 text-white p-1.5 rounded-full shadow-lg border border-emerald-400/20">
                  <Download className="w-3 h-3" />
                </div>
              )}

              {/* Hover Dark Overlay Play Panel */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onInstantPlay(media);
                    }}
                    className="flex-1 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1 shadow-md"
                    title="Instant Stream"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Stream
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectMedia(media);
                    }}
                    className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white transition-all border border-slate-700/50"
                    title="View Details"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-brand-300" />
                  </button>
                </div>
              </div>
            </div>

            {/* Information Card Body */}
            <div className="p-3.5 flex flex-col justify-between flex-grow">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 font-mono">
                  {media.year}
                </span>
                <h4 className="text-sm font-bold text-white tracking-tight group-hover:text-brand-300 transition-colors mt-0.5 line-clamp-1 font-display">
                  {media.title}
                </h4>
              </div>

              {/* Genre pill lists */}
              <div className="flex items-center gap-1.5 mt-2 overflow-hidden flex-wrap max-h-5">
                {media.genres.slice(0, 2).map((genre) => (
                  <span
                    key={genre}
                    className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800/40 text-slate-400 border border-slate-800 font-sans"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>

          </motion.div>
        );
      })}
    </div>
  );
}
