import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Download, 
  Sparkles, 
  Tv, 
  Film, 
  Star, 
  TrendingUp, 
  AlertTriangle, 
  X, 
  WifiOff, 
  MonitorPlay,
  Heart,
  HardDriveDownload,
  Info
} from 'lucide-react';

// Types and static featured catalog
import { MediaItem, PlayerState, ServerOption, DownloadItem, MediaType } from './types';
import { FEATURED_MEDIA } from './data/featured';

// Modular Components
import Header from './components/Header';
import MediaGrid from './components/MediaGrid';
import MediaDetailsModal from './components/MediaDetailsModal';
import VideoPlayer from './components/VideoPlayer';
import DownloadManager from './components/DownloadManager';

// Free Stream embed server options
const STREAM_SERVERS: ServerOption[] = [
  {
    id: "vidsrc_xyz",
    name: "VidSrc.xyz (Recommended)",
    description: "Highly stable streaming endpoint. Excellent bandwidth and compatibility.",
    urlPattern: (imdbId, season, episode) => {
      if (season && episode) {
        return `https://vidsrc.xyz/embed/tv/${imdbId}/${season}/${episode}`;
      }
      return `https://vidsrc.xyz/embed/movie/${imdbId}`;
    }
  },
  {
    id: "vidsrc_to",
    name: "VidSrc TO Media",
    description: "Multi-bitrate automatic source. Built-in subtitle options.",
    urlPattern: (imdbId, season, episode) => {
      if (season && episode) {
        return `https://vidsrc.to/embed/tv/${imdbId}/${season}/${episode}`;
      }
      return `https://vidsrc.to/embed/movie/${imdbId}`;
    }
  },
  {
    id: "vidsrc_me",
    name: "StreamIMDb (VidSrc Me)",
    description: "Stable streaming gateway based on IMDB covers. Outstanding speeds.",
    urlPattern: (imdbId, season, episode) => {
      if (season && episode) {
        return `https://vidsrc.me/embed/tv?imdb=${imdbId}&season=${season}&episode=${episode}`;
      }
      return `https://vidsrc.me/embed/movie?imdb=${imdbId}`;
    }
  },
  {
    id: "vidlink_pro",
    name: "VidLink Pro (H.265)",
    description: "Excellent layout with custom styling wrappers. Lightweight buffer.",
    urlPattern: (imdbId, season, episode) => {
      if (season && episode) {
        return `https://vidlink.pro/tv/${imdbId}/${season}/${episode}`;
      }
      return `https://vidlink.pro/movie/${imdbId}`;
    }
  },
  {
    id: "embed_su",
    name: "Embed SU Engine",
    description: "Fast multi-lingual audio track streams. Solid HD backup.",
    urlPattern: (imdbId, season, episode) => {
      if (season && episode) {
        return `https://embed.su/embed/tv/${imdbId}/${season}/${episode}`;
      }
      return `https://embed.su/embed/movie/${imdbId}`;
    }
  }
];

export default function App() {
  // Navigation & Tab states
  const [activeTab, setActiveTab] = useState<'browse' | 'downloads' | 'playing'>('browse');
  const [selectedType, setSelectedType] = useState<MediaType | 'all'>('all');
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);

  // Search catalogs
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchWarning, setSearchWarning] = useState<string | undefined>(undefined);

  // Focus Modal and Player details
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [selectedServerId, setSelectedServerId] = useState<string>('vidsrc_xyz');

  // Downloads tracking (Persists in localStorage)
  const [downloads, setDownloads] = useState<DownloadItem[]>(() => {
    const cached = localStorage.getItem('imdbcover_downloads');
    return cached ? JSON.parse(cached) : [];
  });

  // Save downloads to storage
  useEffect(() => {
    localStorage.setItem('imdbcover_downloads', JSON.stringify(downloads));
  }, [downloads]);

  // Handle simulated downloads progression ticks
  useEffect(() => {
    const downloadingItems = downloads.filter(d => d.status === 'downloading');
    if (downloadingItems.length === 0) return;

    const interval = setInterval(() => {
      setDownloads((prevDownloads) => {
        return prevDownloads.map((dl) => {
          if (dl.status === 'downloading') {
            const nextProgress = dl.progress + (Math.random() * 4 + 2); // 2-6% progress per tick
            
            if (nextProgress >= 100) {
              return {
                ...dl,
                progress: 100,
                status: 'completed',
                downloadSpeed: '0 MB/s',
                downloadedSize: dl.totalSize
              };
            }

            // Simulate oscillating speed
            const rawSpeed = (Math.random() * 6 + 10).toFixed(1); // 10-16 MB/s
            const currentSizeMB = Math.floor((nextProgress / 100) * parseFloat(dl.totalSize) * 1024);
            const downloadedStr = currentSizeMB >= 1024 
              ? `${(currentSizeMB / 1024).toFixed(2)} GB` 
              : `${currentSizeMB} MB`;

            return {
              ...dl,
              progress: nextProgress,
              downloadSpeed: `${rawSpeed} MB/s`,
              downloadedSize: downloadedStr
            };
          }
          return dl;
        });
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [downloads]);

  // Initiate custom search from full-stack Gemini API / fallback fuzzy search
  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchWarning(undefined);
      return;
    }

    setSearchLoading(true);
    setSearchWarning("Connecting to secure AI search nodes to locate movie IMDb references...");

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data.results) {
        setSearchResults(data.results);
      } else {
        setSearchResults([]);
      }

      if (data.warning) {
        // Warning flag indicating local backup mode (lack of API values)
        setSearchWarning(data.warning);
      } else {
        setSearchWarning(undefined);
      }
    } catch (err) {
      console.error("Failed to query stream details:", err);
      // Fallback: search featured media
      const localMatches = FEATURED_MEDIA.filter(m => 
        m.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(localMatches);
      setSearchWarning("Local Offline Index Lookup: Configure your GEMINI_API_KEY inside secrets to find any movie from global servers.");
    } finally {
      setSearchLoading(false);
    }
  };

  // Trigger search on typing clear empty state
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      setSearchWarning(undefined);
    }
  }, [searchQuery]);

  // Catalog filtered items (Filters between search results or featured baseline)
  const currentCatalog = searchQuery ? searchResults : FEATURED_MEDIA;
  const filteredMedia = currentCatalog.filter((item) => {
    // If we are in offline mode, only show downloaded items!
    if (isOfflineMode) {
      const isDownloaded = downloads.some(d => d.mediaId === item.id && d.status === 'completed');
      if (!isDownloaded) return false;
    }

    if (selectedType === 'all') return true;
    return item.type === selectedType;
  });

  // Extract a Hero Spotlight cover (Features Interstellar as index)
  const spotlightMedia = FEATURED_MEDIA[0];

  // List of IDs for badge indicators
  const completedDownloadKeys = downloads
    .filter(d => d.status === 'completed')
    .map(d => d.season ? `${dlKey(d.mediaId, d.season, d.episode)}` : d.mediaId);

  const activeDownloadKeys = downloads
    .filter(d => d.status === 'downloading' || d.status === 'queued')
    .map(d => d.season ? `${dlKey(d.mediaId, d.season, d.episode)}` : d.mediaId);

  // Helper code to map keys
  function dlKey(id: string, s?: number, e?: number) {
    return s && e ? `${id}-s${s}-e${e}` : id;
  }

  // Trigger simulated cache downloading
  const handleTriggerDownload = (media: MediaItem, season?: number, episode?: number) => {
    const key = dlKey(media.id, season, episode);

    // Escape duplicate entry
    if (downloads.some(d => dlKey(d.mediaId, d.season, d.episode) === key)) return;

    const size = media.type === 'movie' 
      ? '1.45 GB' 
      : `${(Math.random() * 150 + 250).toFixed(0)} MB`;

    const newDownload: DownloadItem = {
      mediaId: media.id,
      media,
      progress: 0,
      status: 'downloading',
      downloadSpeed: '7.8 MB/s',
      downloadedSize: '0 MB',
      totalSize: size,
      season,
      episode,
      addedAt: new Date().toLocaleTimeString()
    };

    setDownloads((prev) => [newDownload, ...prev]);
  };

  // Remove download item
  const handleDeleteDownload = (mediaId: string, season?: number, episode?: number) => {
    const key = dlKey(mediaId, season, episode);
    setDownloads((prev) => prev.filter(d => dlKey(d.mediaId, d.season, d.episode) !== key));
  };

  // Play direct stream triggers
  const handlePlayMedia = (media: MediaItem, season: number, episode: number, serverId: string) => {
    setPlayerState({
      activeMedia: media,
      season,
      episode,
      serverId
    });
    setSelectedMedia(null);
    setActiveTab('playing');
  };

  // Instant Play Action helper
  const handleInstantPlay = (media: MediaItem) => {
    const isShow = media.type === 'series' || media.type === 'anime';
    handlePlayMedia(media, isShow ? 1 : 0, isShow ? 1 : 0, selectedServerId);
  };

  // Direct visual play item from downloads tab
  const handlePlayOffline = (item: DownloadItem) => {
    setIsOfflineMode(true);
    setPlayerState({
      activeMedia: item.media,
      season: item.season || 0,
      episode: item.episode || 0,
      serverId: 'Offline_Simulator'
    });
    setActiveTab('playing');
  };

  // Get current Iframe streaming URL matching servers setup
  const getStreamUrl = () => {
    if (!playerState) return '';
    const activeServer = STREAM_SERVERS.find(s => s.id === playerState.serverId) || STREAM_SERVERS[0];
    return activeServer.urlPattern(
      playerState.activeMedia!.imdbId,
      playerState.season || undefined,
      playerState.episode || undefined
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 font-sans selection:bg-brand-500/20 selection:text-brand-300 relative overflow-x-hidden">
      
      {/* Decorative backdrop cinematic lights glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-600/10 rounded-full blur-[150px] -z-10 pointer-events-none" />
      <div className="absolute top-[40vh] right-[10vw] w-[350px] h-[350px] bg-cyan-600/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

      {/* Global simulated Offline header bar alert */}
      {isOfflineMode && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-600 z-[60] shadow-md animate-pulse" />
      )}

      {/* Top Header Navigation */}
      {activeTab !== 'playing' && (
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          isOfflineMode={isOfflineMode}
          setIsOfflineMode={setIsOfflineMode}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          downloadCount={downloads.filter(d => d.status === 'downloading').length}
          onSearchSubmit={handleSearchSubmit}
          searchWarning={searchWarning}
        />
      )}

      {/* Primary tab views container */}
      <main className={`${activeTab !== 'playing' ? 'pt-32 sm:pt-40 pb-20' : ''}`}>
        
        {activeTab === 'browse' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* HERO SPOTLIGHT HEADER (Only visible if not searching) */}
            {!searchQuery && !isOfflineMode && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="relative rounded-3xl overflow-hidden glass border border-white/5 mb-12 shadow-2xl relative aspect-[1.8/1] sm:aspect-[2.3/1] glow-animation"
                id="hero-banner"
              >
                {/* Backdrop Hero Media */}
                <div className="absolute inset-0 z-0">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/45 to-transparent z-10" />
                  <div className="absolute inset-y-0 left-0 w-full sm:w-[65%] bg-gradient-to-r from-[#050505]/95 via-[#050505]/70 to-transparent z-10" />
                  <img
                    src={spotlightMedia.banner}
                    alt={spotlightMedia.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover opacity-35 scale-102 filter brightness-[0.8]"
                  />
                </div>

                {/* Content Overlay */}
                <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 sm:p-12 max-w-2xl text-left">
                  <div className="flex items-center gap-2 mb-3.5">
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      IMDb {spotlightMedia.rating}
                    </span>
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-brand-500 text-white">
                      Featured Pick
                    </span>
                  </div>

                  <span className="text-brand-500 font-extrabold uppercase tracking-[0.25em] text-[10px] sm:text-xs mb-3 block">
                    Streaming via Global Protocol
                  </span>

                  <h1 className="text-3xl sm:text-5xl md:text-6xl font-black mb-4 leading-none italic uppercase tracking-tighter text-glow text-white line-clamp-1">
                    {spotlightMedia.title}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-lg leading-relaxed line-clamp-2 sm:line-clamp-3 font-medium">
                    {spotlightMedia.overview}
                  </p>

                  <div className="flex items-center gap-4 mt-6">
                    <button
                      onClick={() => handleInstantPlay(spotlightMedia)}
                      className="py-3 px-7 rounded-full bg-white hover:bg-brand-500 hover:text-white text-black text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-xl flex items-center gap-2 cursor-pointer"
                      id="hero-watch-now"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Watch Now
                    </button>
                    <button
                      onClick={() => setSelectedMedia(spotlightMedia)}
                      className="py-3 px-6 rounded-full glass text-slate-200 hover:text-white hover:bg-white/10 text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-1.5 cursor-pointer"
                      id="hero-view-details"
                    >
                      <Info className="w-3.5 h-3.5 text-brand-400" />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Offline notification banner if active */}
            {isOfflineMode && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl p-5 mb-8 flex items-start gap-3.5">
                <WifiOff className="w-6 h-6 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <h3 className="font-bold text-white font-display text-sm tracking-wide">Offline Simulation Enabled</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Browser connection has been simulated as disconnected. You are exploring titles saved inside your local Offline Storage Vault. Live worldwide searching is suspended until Online mode is toggled.
                  </p>
                </div>
              </div>
            )}

            {/* Main Title of the current collection */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-xl font-bold font-display text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-400" />
                <span>
                  {searchQuery 
                    ? `Results for "${searchQuery}"` 
                    : isOfflineMode 
                    ? 'Your Saved Downloads' 
                    : 'Trending Releases'}
                </span>
                {searchLoading && (
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-ping ml-2" />
                )}
              </h2>

              <span className="text-xs text-slate-500 font-mono">
                {filteredMedia.length} titles found
              </span>
            </div>

            {/* Media Grid Display viewport */}
            <MediaGrid
              mediaItems={filteredMedia}
              onSelectMedia={setSelectedMedia}
              onInstantPlay={handleInstantPlay}
              isOfflineMode={isOfflineMode}
              downloadedIds={completedDownloadKeys}
            />

          </div>
        )}

        {/* Downloads Tab View */}
        {activeTab === 'downloads' && (
          <DownloadManager
            downloads={downloads}
            onDeleteDownload={handleDeleteDownload}
            onPlayOffline={handlePlayOffline}
          />
        )}

        {/* Active Cinema Theater Viewport */}
        {activeTab === 'playing' && playerState && (
          <VideoPlayer
            playerState={playerState}
            onClose={() => {
              setPlayerState(null);
              // Return back to appropriate mode tab
              setActiveTab(isOfflineMode ? 'downloads' : 'browse');
            }}
            isOfflineMode={isOfflineMode}
            iframePatternUrl={getStreamUrl()}
            servers={STREAM_SERVERS}
            onServerChange={(newServerId) => {
              setSelectedServerId(newServerId);
              setPlayerState(prev => prev ? { ...prev, serverId: newServerId } : null);
            }}
          />
        )}

      </main>

      {/* Details Dialog Modals Backdrop */}
      {selectedMedia && (
        <MediaDetailsModal
          media={selectedMedia}
          onClose={() => setSelectedMedia(null)}
          onPlay={handlePlayMedia}
          servers={STREAM_SERVERS}
          selectedServerId={selectedServerId}
          setSelectedServerId={setSelectedServerId}
          onTriggerDownload={handleTriggerDownload}
          downloadedIds={completedDownloadKeys}
          activeDownloads={activeDownloadKeys}
        />
      )}

      {/* Footer information bar */}
      {activeTab !== 'playing' && (
        <footer className="border-t border-slate-900 bg-[#020512] py-8 text-center text-xs mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-slate-500 font-mono">
            <span>© 2026 IMDbCover Stream Portal. Free & Safe Sandbox Shield.</span>
            <div className="flex items-center gap-4 justify-center">
              <span className="text-brand-500 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 fill-current text-brand-400" />
                No Cookies, No Tracking
              </span>
            </div>
          </div>
        </footer>
      )}

    </div>
  );
}
