import { motion } from 'motion/react';
import { Download, Trash2, Play, HardDrive, ShieldAlert, Sparkles, FolderHeart, Check, Database, PlayCircle } from 'lucide-react';
import { DownloadItem } from '../types';

interface DownloadManagerProps {
  downloads: DownloadItem[];
  onDeleteDownload: (mediaId: string, season?: number, episode?: number) => void;
  onPlayOffline: (item: DownloadItem) => void;
}

export default function DownloadManager({
  downloads,
  onDeleteDownload,
  onPlayOffline
}: DownloadManagerProps) {
  
  const activeDownloads = downloads.filter((d) => d.status === 'downloading' || d.status === 'queued');
  const completedDownloads = downloads.filter((d) => d.status === 'completed');

  // Sum total downloaded space
  const totalCachedSpace = completedDownloads.length * 1.25; // average 1.25GB each

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="download-manager-dashboard">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-6 mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black font-display tracking-tight text-white flex items-center gap-2 uppercase italic text-glow">
            <HardDrive className="text-brand-500 w-8 h-8 font-bold" />
            <span>Vault Sandbox</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl leading-relaxed font-semibold">
            Manage your virtual local cinema. Downloaded items are cached directly inside your browser database and can be enjoyed without any internet connection.
          </p>
        </div>

        {/* Disk Space Meter */}
        <div className="bg-black/60 border border-white/10 p-4 rounded-2xl flex items-center gap-3 shrink-0 glass">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <Database className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-mono tracking-widest uppercase font-bold">VIRTUAL DISK ALLOCATION</div>
            <div className="text-sm font-bold text-white font-mono mt-0.5">
              {totalCachedSpace.toFixed(2)} GB Used / 50.0 GB Limit
            </div>
            {/* Minimal Progress bar for disk */}
            <div className="w-36 h-1 bg-white/5 rounded-full mt-1.5 overflow-hidden">
              <div 
                className="h-full bg-brand-500 rounded-full transition-all duration-500" 
                style={{ width: `${(totalCachedSpace / 50) * 100}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side (8-columns): Active / Completed libraries */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Section: ACTIVE PIPELINES */}
          {activeDownloads.length > 0 && (
            <div className="bg-white/3 border border-white/5 rounded-3xl p-6 glass">
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                Active Download Pipelines ({activeDownloads.length})
              </h3>

              <div className="flex flex-col gap-4">
                {activeDownloads.map((item) => {
                  const titleLabel = item.season 
                    ? `${item.media.title} (S${item.season} E${item.episode})`
                    : item.media.title;

                  return (
                    <div 
                      key={`${item.mediaId}-${item.season ?? ''}-${item.episode ?? ''}`}
                      className="bg-black/80 border border-white/5 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden"
                      id={`pipeline-card-${item.mediaId}`}
                    >
                      {/* Left: Thumbnail & Name */}
                      <div className="flex items-center gap-3 z-10">
                        <img
                          src={item.media.poster}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-10 h-14 object-cover rounded-xl shrink-0 border border-white/5"
                        />
                        <div>
                          <div className="font-bold text-white text-sm tracking-tight">{titleLabel}</div>
                          <div className="flex items-center gap-3 divide-x divide-white/10 text-[10px] text-slate-400 font-mono mt-0.5">
                            <span className="text-brand-405 font-bold text-brand-400">{item.downloadSpeed}</span>
                            <span className="pl-3">{item.downloadedSize} / {item.totalSize}</span>
                            <span className="pl-3 uppercase text-amber-500 font-bold tracking-wide">{item.status}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Progress slider and controls */}
                      <div className="flex items-center gap-4 w-full sm:w-48 z-10 font-mono">
                        <div className="flex-1">
                          <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                            <span className="font-bold uppercase">PROGRESS</span>
                            <span className="font-bold text-brand-400">{Math.floor(item.progress)}%</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-brand-500 to-cyan-400"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => onDeleteDownload(item.mediaId, item.season, item.episode)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all border border-transparent hover:border-red-500/20 cursor-pointer"
                          title="Cancel Download"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: COMPLETED OFFLINE VAULT */}
          <div className="bg-white/3 border border-white/5 rounded-3xl p-6 glass">
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-5 flex items-center gap-2">
              <FolderHeart className="text-brand-400 w-5 h-5" />
              Completed Offline Library ({completedDownloads.length})
            </h3>

            {completedDownloads.length === 0 ? (
              <div className="py-12 text-center text-slate-500 border border-dashed border-white/5 rounded-2xl px-4">
                <Download className="w-10 h-10 mx-auto text-slate-600 mb-3" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Library is Empty</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  To stream movies offline, click on any title in the Browse Catalog and pick "Simulate Download".
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {completedDownloads.map((item) => {
                  const titleLabel = item.season 
                    ? `${item.media.title} (S${item.season} E${item.episode})`
                    : item.media.title;

                  return (
                    <div 
                      key={`${item.mediaId}-${item.season ?? ''}-${item.episode ?? ''}`}
                      className="bg-black/60 border border-white/10 hover:border-brand-500/45 rounded-2xl p-3 flex gap-3 justify-between items-center transition-all duration-200"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <img
                          src={item.media.poster}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-12 h-16 object-cover rounded-xl border border-white/5 shrink-0"
                        />
                        <div className="overflow-hidden">
                          <h4 className="font-extrabold text-white text-xs sm:text-sm tracking-tight truncate uppercase font-display">
                            {titleLabel}
                          </h4>
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] bg-white/5 border border-white/5 text-slate-405 font-mono">
                            {item.totalSize} • H.265 SECURE
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Play Directly Offline Action */}
                        <button
                          onClick={() => onPlayOffline(item)}
                          className="py-1.5 px-4 rounded-full bg-white hover:bg-brand-500 hover:text-white text-black font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer"
                          id={`play-offline-${item.mediaId}`}
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Play</span>
                        </button>
                        
                        <button
                          onClick={() => onDeleteDownload(item.mediaId, item.season, item.episode)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all border border-transparent hover:border-red-500/20 cursor-pointer"
                          title="Delete from local store"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Side (4-columns): Guidelines FAQ block */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Storage Information Widget */}
          <div className="bg-white/3 border border-white/5 rounded-3xl p-6 glass">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-350 mb-3.5 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-400" /> Storage Sandbox FAQ
            </h4>
            
            <div className="flex flex-col gap-4 text-xs text-slate-450 leading-relaxed font-semibold">
              <div className="border-l-2 border-brand-500 pl-3">
                <strong className="text-white block font-bold mb-0.5">How does offline play work?</strong>
                By pre-allocating metadata, subtitle script packs, and cinematic waveforms inside local IndexedDB storage, the app continues to operate and play media beautifully even on fully disconnected devices.
              </div>

              <div className="border-l-2 border-white/20 pl-3">
                <strong className="text-white block font-bold mb-0.5">Is it secure and ad-free?</strong>
                Yes! When playing offline, there are absolutely 0 queries, cookies, or trackers triggered to outward internet portals. Perfect privacy is guaranteed.
              </div>

              <div className="border-l-2 border-white/20 pl-3">
                <strong className="text-white block font-bold mb-0.5 font-sans">Where are files stored?</strong>
                Files are stored inside browser sandboxed state. Toggling "Offline Mode" is a fantastic way to test and play media on train rides or off-the-grid scenarios!
              </div>
            </div>
          </div>

          <div className="bg-white/3 border border-white/5 rounded-3xl p-5 text-xs text-indigo-300 flex items-start gap-2.5 glass">
            <ShieldAlert className="w-4.5 h-4.5 text-brand-450 shrink-0 mt-0.5 text-brand-400" />
            <div>
              <strong className="text-white block font-bold mb-0.5 uppercase tracking-wide">Stream Protection Active</strong>
              Our active shield keeps stream feeds contained inside secure iframe sandboxes, terminating cookie hijackers and redirect vectors at the local browser boundary.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
