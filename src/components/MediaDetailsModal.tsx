import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Download, Check, Star, Layers, Tv, HardDriveDownload, ShieldCheck, HelpCircle, Minus, Plus } from 'lucide-react';
import { MediaItem, ServerOption } from '../types';

interface MediaDetailsModalProps {
  media: MediaItem | null;
  onClose: () => void;
  onPlay: (media: MediaItem, season: number, episode: number, serverId: string) => void;
  servers: ServerOption[];
  selectedServerId: string;
  setSelectedServerId: (id: string) => void;
  onTriggerDownload: (media: MediaItem, season?: number, episode?: number) => void;
  downloadedIds: string[]; // IDs of already completed downloads
  activeDownloads: string[]; // IDs of currently downloading items
}

export default function MediaDetailsModal({
  media,
  onClose,
  onPlay,
  servers,
  selectedServerId,
  setSelectedServerId,
  onTriggerDownload,
  downloadedIds,
  activeDownloads
}: MediaDetailsModalProps) {
  if (!media) return null;

  // TV / Anime Season State
  const isShow = media.type === 'series' || media.type === 'anime';
  const seasonsCount = media.seasonsCount || (isShow ? 1 : 0);
  const episodesPerSeason = media.episodesPerSeason || (isShow ? Array(seasonsCount).fill(12) : []);
  
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [isManualOverride, setIsManualOverride] = useState(false);

  const episodesInActiveSeason = episodesPerSeason[selectedSeason - 1] || 12;

  // Check download status for current selection
  const currentKey = isShow 
    ? `${media.id}-s${selectedSeason}-e${selectedEpisode}` 
    : media.id;

  const isDownloaded = downloadedIds.includes(currentKey);
  const isDownloading = activeDownloads.includes(currentKey);

  const handlePlayClick = () => {
    onPlay(
      media, 
      isShow ? selectedSeason : 0, 
      isShow ? selectedEpisode : 0, 
      selectedServerId
    );
  };

  const handleDownloadClick = () => {
    if (isDownloaded || isDownloading) return;
    onTriggerDownload(
      media,
      isShow ? selectedSeason : undefined,
      isShow ? selectedEpisode : undefined
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto" id="media-details-modal">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/92 backdrop-blur-xl"
          onClick={onClose}
        />

        {/* Modal Outer Container */}
        <div className="min-h-screen px-4 text-center flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="inline-block w-full max-w-4xl max-h-[90vh] overflow-y-auto text-left align-middle transition-all transform bg-[#050505] border border-white/10 rounded-3xl shadow-2xl glass relative z-10"
          >
            {/* Wide Banner Image Background */}
            <div className="relative h-48 sm:h-64 overflow-hidden">
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050505] to-transparent z-10" />
              <img
                src={media.banner}
                alt={media.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-25"
                onError={(e) => {
                  e.currentTarget.src = `https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&q=80&w=1200`;
                }}
              />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-black/80 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-white rounded-full transition-all z-20"
                id="close-modal-button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Contents */}
            <div className="px-4 sm:px-8 pb-8 -mt-20 relative z-20">
              <div className="flex flex-col md:flex-row gap-6">
                
                {/* Left Side: Poster Art (Floating style) */}
                <div className="w-40 sm:w-48 mx-auto md:mx-0 shrink-0 select-none shadow-2xl rounded-2xl overflow-hidden border border-white/10 bg-black self-start">
                  <div className="aspect-[2/3] w-full">
                    <img
                      src={media.poster}
                      alt={media.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = `https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&q=80&w=600`;
                      }}
                    />
                  </div>
                </div>

                {/* Right Side: Core Metadata & Title */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                    <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-brand-600/10 text-brand-400 border border-brand-500/20">
                      {media.type}
                    </span>
                    <span className="text-slate-400 text-xs font-bold font-mono">{media.year}</span>
                    <span className="text-slate-400 text-sm">•</span>
                    <span className="px-2.5 py-0.5 rounded-lg text-xs bg-white/5 border border-white/5 flex items-center gap-1 font-mono text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
                      {media.rating} / 10
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-display tracking-tight uppercase italic text-glow">
                    {media.title}
                  </h2>

                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {media.genres.map((genre) => (
                      <span
                        key={genre}
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-slate-300 border border-white/5"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>

                  <p className="text-sm text-slate-400 mt-4 leading-relaxed font-medium">
                    {media.overview}
                  </p>

                  {/* Safety Notice block */}
                  <div className="mt-4 bg-white/5 border border-white/5 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-slate-400">
                    <ShieldCheck className="w-4.5 h-4.5 text-brand-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Ad-Free Filter Active:</strong> IMDbCover blocks popups and overlay redirects injected by raw index servers. Stream completely clean & isolated!
                    </span>
                  </div>
                </div>
              </div>

              {/* Episode & Downloader Selectors */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-12 gap-8 border-t border-white/5 pt-6">
                
                {/* Left/Middle 8-columns: Episode/Stream Play setup */}
                <div className="md:col-span-8 flex flex-col gap-6">
                                   {isShow && (
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 md:p-5 flex flex-col gap-5">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="font-display font-bold uppercase tracking-wider text-xs text-white flex items-center gap-1.5 font-sans">
                          <Layers className="w-4 h-4 text-brand-400" /> Watch Episode Setup
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsManualOverride(prev => !prev)}
                          className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                            isManualOverride 
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse' 
                              : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-100 hover:bg-white/10'
                          }`}
                          id="details-manual-override-toggle"
                        >
                          {isManualOverride ? "🔓 Custom Entries Unlocked" : "🔒 Change Limit Locked"}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* SEASON CONTROLLER */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest font-mono">Season</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {isManualOverride ? `Season ${selectedSeason} (Custom/Unlimited)` : `${selectedSeason} of ${seasonsCount}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Minus Button */}
                            <button
                              type="button"
                              onClick={() => {
                                const nextVal = Math.max(1, selectedSeason - 1);
                                setSelectedSeason(nextVal);
                                setSelectedEpisode(1);
                              }}
                              disabled={selectedSeason <= 1}
                              className="w-10 h-10 flex items-center justify-center bg-black hover:bg-white/5 border border-white/10 text-slate-300 disabled:opacity-20 disabled:hover:bg-black rounded-xl transition-all cursor-pointer"
                              id="season-minus-btn"
                            >
                              <Minus className="w-4 h-4" />
                            </button>

                            {/* Central Input / Dropdown selector */}
                            <div className="relative flex-1">
                              {isManualOverride ? (
                                <input
                                  type="number"
                                  min={1}
                                  max={100}
                                  value={selectedSeason}
                                  onChange={(e) => {
                                    const val = Math.max(1, parseInt(e.target.value) || 1);
                                    setSelectedSeason(val);
                                    setSelectedEpisode(1);
                                  }}
                                  className="w-full h-10 bg-black/85 text-center text-xs font-black font-mono text-white border border-white/10 rounded-xl focus:outline-none focus:border-brand-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  id="season-custom-input"
                                />
                              ) : (
                                <select
                                  value={selectedSeason}
                                  onChange={(e) => {
                                    const val = Math.min(seasonsCount, Math.max(1, parseInt(e.target.value) || 1));
                                    setSelectedSeason(val);
                                    setSelectedEpisode(1);
                                  }}
                                  className="w-full h-10 bg-black/85 hover:bg-black border border-white/10 rounded-xl px-3.5 py-1.5 text-center text-xs font-black font-mono text-white focus:outline-none focus:border-brand-500 cursor-pointer text-glow block"
                                  id="season-presets-dropdown"
                                >
                                  {Array.from({ length: seasonsCount }).map((_, i) => (
                                    <option key={i + 1} value={i + 1} className="bg-[#0a0a0a] text-slate-200 font-sans">
                                      Season {i + 1}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>

                            {/* Plus Button */}
                            <button
                              type="button"
                              onClick={() => {
                                const nextVal = isManualOverride 
                                  ? selectedSeason + 1 
                                  : Math.min(seasonsCount, selectedSeason + 1);
                                setSelectedSeason(nextVal);
                                setSelectedEpisode(1);
                              }}
                              disabled={!isManualOverride && selectedSeason >= seasonsCount}
                              className="w-10 h-10 flex items-center justify-center bg-black hover:bg-white/5 border border-white/10 text-slate-300 disabled:opacity-20 disabled:hover:bg-black rounded-xl transition-all cursor-pointer"
                              id="season-plus-btn"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* EPISODE CONTROLLER */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest font-mono">Episode</span>
                            <span className="text-[10px] text-slate-550 font-mono">
                              {isManualOverride ? `Episode ${selectedEpisode} (Custom/Unlimited)` : `${selectedEpisode} of ${episodesInActiveSeason}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Minus Button */}
                            <button
                              type="button"
                              onClick={() => setSelectedEpisode(Math.max(1, selectedEpisode - 1))}
                              disabled={selectedEpisode <= 1}
                              className="w-10 h-10 flex items-center justify-center bg-black hover:bg-white/5 border border-white/10 text-slate-300 disabled:opacity-20 disabled:hover:bg-black rounded-xl transition-all cursor-pointer"
                              id="episode-minus-btn"
                            >
                              <Minus className="w-4 h-4" />
                            </button>

                            {/* Central Input / Dropdown selector */}
                            <div className="relative flex-1">
                              {isManualOverride ? (
                                <input
                                  type="number"
                                  min={1}
                                  max={2000}
                                  value={selectedEpisode}
                                  onChange={(e) => {
                                    const val = Math.max(1, parseInt(e.target.value) || 1);
                                    setSelectedEpisode(val);
                                  }}
                                  className="w-full h-10 bg-black/85 text-center text-xs font-black font-mono text-white border border-white/10 rounded-xl focus:outline-none focus:border-brand-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  id="episode-custom-input"
                                />
                              ) : (
                                <select
                                  value={selectedEpisode}
                                  onChange={(e) => {
                                    const val = Math.min(episodesInActiveSeason, Math.max(1, parseInt(e.target.value) || 1));
                                    setSelectedEpisode(val);
                                  }}
                                  className="w-full h-10 bg-black/85 hover:bg-black border border-white/10 rounded-xl px-3.5 py-1.5 text-center text-xs font-black font-mono text-white focus:outline-none focus:border-brand-500 cursor-pointer text-glow block"
                                  id="episode-presets-dropdown"
                                >
                                  {Array.from({ length: episodesInActiveSeason }).map((_, i) => (
                                    <option key={i + 1} value={i + 1} className="bg-[#0a0a0a] text-slate-200 font-sans">
                                      Episode {i + 1}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>

                            {/* Plus Button */}
                            <button
                              type="button"
                              onClick={() => {
                                const nextVal = isManualOverride 
                                  ? selectedEpisode + 1 
                                  : Math.min(episodesInActiveSeason, selectedEpisode + 1);
                                setSelectedEpisode(nextVal);
                              }}
                              disabled={!isManualOverride && selectedEpisode >= episodesInActiveSeason}
                              className="w-10 h-10 flex items-center justify-center bg-black hover:bg-white/5 border border-white/10 text-slate-300 disabled:opacity-20 disabled:hover:bg-black rounded-xl transition-all cursor-pointer"
                              id="episode-plus-btn"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Server choosing option */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-450 mb-3">
                      Select Free Streaming Server
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {servers.map((serv) => (
                        <button
                          key={serv.id}
                          onClick={() => setSelectedServerId(serv.id)}
                          className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                            selectedServerId === serv.id
                              ? 'bg-brand-500/10 border-brand-500/40 text-brand-300'
                              : 'bg-black/40 border-white/5 hover:bg-white/5 text-slate-300'
                          }`}
                          id={`server-btn-${serv.id}`}
                        >
                          <div className="font-bold text-sm text-white flex items-center justify-between">
                            <span>{serv.name}</span>
                            {selectedServerId === serv.id && <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />}
                          </div>
                          <p className="text-[10.5px] text-slate-400 mt-0.5 line-clamp-1">{serv.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Right 4-columns: Main Calls-To-Action (Play Stream, Download) */}
                <div className="md:col-span-4 flex flex-col justify-start gap-4 bg-black/40 border border-white/5 rounded-2xl p-4 h-fit">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white border-b border-white/5 pb-2">
                    Media Actions
                  </h3>

                  {/* Big Play Button */}
                  <button
                    onClick={handlePlayClick}
                    className="w-full py-3.5 px-4 rounded-full bg-white hover:bg-brand-500 hover:text-white text-black font-black uppercase text-xs tracking-widest transition-all duration-300 shadow-xl flex items-center justify-center gap-2 group cursor-pointer"
                    id="play-stream-button"
                  >
                    <Play className="w-4 h-4 fill-current text-black group-hover:text-white transform group-hover:scale-110 transition-transform" />
                    <span>Watch Stream</span>
                  </button>

                  <div className="text-center text-[10px] text-slate-550 uppercase tracking-wider font-extrabold flex items-center justify-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>AD-SHIELD ACTIVE</span>
                  </div>

                  <div className="border-t border-white/5 my-1" />

                  {/* Downloading Panel block */}
                  <div className="text-left">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                      <HardDriveDownload className="w-4 h-4 text-brand-400" /> Offline Download
                    </span>
                    <p className="text-[11px] text-slate-400 mb-3.5 leading-relaxed font-medium">
                      Download {media.type === 'movie' ? 'the movie' : 'this episode'} directly to the virtual disk cache for off-grid playback.
                    </p>

                    <button
                      onClick={handleDownloadClick}
                      disabled={isDownloaded || isDownloading}
                      className={`w-full py-3 px-3 rounded-full text-[10.5px] font-bold uppercase tracking-wider border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isDownloaded
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : isDownloading
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 font-black'
                          : 'bg-white/5 text-slate-300 border-transparent hover:bg-white/10 hover:text-white'
                      }`}
                      id="trigger-download-button"
                    >
                      {isDownloaded ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Downloaded Offline</span>
                        </>
                      ) : isDownloading ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping mr-1" />
                          <span>Downloading Progress...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Simulate Download</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
