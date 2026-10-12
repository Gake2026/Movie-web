import { useRef, type FC } from 'react';
import { Play, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaItem } from '../types';

interface MediaRowProps {
  title: string;
  items: MediaItem[];
  onSelectMedia: (media: MediaItem) => void;
  onInstantPlay: (media: MediaItem) => void;
}

const MediaRow: FC<MediaRowProps> = ({ title, items, onSelectMedia, onInstantPlay }) => {
  const scroller = useRef<HTMLDivElement>(null);

  if (items.length === 0) return null;

  const scrollBy = (dir: number) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <section className="mb-10" id={`row-${title.replace(/\s+/g, '-').toLowerCase()}`}>
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-base sm:text-lg font-bold font-display text-white tracking-tight">
          {title}
        </h2>
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => scrollBy(-1)}
            className="w-8 h-8 rounded-full glass border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            aria-label={`Scroll ${title} left`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scrollBy(1)}
            className="w-8 h-8 rounded-full glass border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            aria-label={`Scroll ${title} right`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scroller}
        className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {items.map((media) => (
          <div
            key={media.id}
            className="group relative shrink-0 w-[130px] sm:w-[150px] cursor-pointer"
            onClick={() => onSelectMedia(media)}
          >
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl glass border border-white/5 bg-slate-950">
              <img
                src={media.poster}
                alt={media.title}
                referrerPolicy="no-referrer"
                loading="lazy"
                className="w-full h-full object-cover transform group-hover:scale-105 duration-500 transition-all"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&q=80&w=600';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <button
                onClick={(e) => { e.stopPropagation(); onInstantPlay(media); }}
                className="absolute inset-0 m-auto w-11 h-11 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all shadow-xl cursor-pointer"
                aria-label={`Play ${media.title}`}
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </button>
              <span className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur text-[9px] font-bold text-amber-400">
                <Star className="w-2.5 h-2.5 fill-amber-400" />
                {media.rating}
              </span>
            </div>
            <div className="mt-2 px-0.5">
              <p className="text-[11px] sm:text-xs font-bold text-slate-200 truncate group-hover:text-white">
                {media.title}
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                {media.year} • {media.type}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MediaRow;
