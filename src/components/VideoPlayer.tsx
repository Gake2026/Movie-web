import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, ArrowLeft, Maximize2, ShieldAlert, Subtitles, HelpCircle, Laptop, WifiOff, Sparkles, Check, X, ExternalLink } from 'lucide-react';
import { MediaItem, PlayerState, ServerOption } from '../types';

interface VideoPlayerProps {
  playerState: PlayerState;
  onClose: () => void;
  isOfflineMode: boolean;
  iframePatternUrl: string;
  servers?: ServerOption[];
  onServerChange?: (serverId: string) => void;
}

export default function VideoPlayer({
  playerState,
  onClose,
  isOfflineMode,
  iframePatternUrl,
  servers,
  onServerChange
}: VideoPlayerProps) {
  const { activeMedia, season, episode, serverId } = playerState;
  
  if (!activeMedia) return null;

  const isShow = activeMedia.type === 'series' || activeMedia.type === 'anime';

  // State for offline mockup video controls
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(15); // Mock start offset
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedSubtitle, setSelectedSubtitle] = useState('English');
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [mockTime, setMockTime] = useState({ current: '00:14:48', duration: '02:24:10' });
  const [fullscreenToast, setFullscreenToast] = useState(false);
  const [showSandboxAlert, setShowSandboxAlert] = useState(true);

  // User can choose sandbox style:
  // - 'unrestricted': Bypasses local mobile blocks completely (No Sandbox). Default for 100% mobile launch success.
  // - 'compat': Loose sandbox that blocks aggressive ads but allows plugins/redirects.
  // - 'safe': Strict safety sandbox.
  const [sandboxMode, setSandboxMode] = useState<'unrestricted' | 'compat' | 'safe'>('unrestricted');

  // Web Audio visualization ref for offline playing
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Generate offline mock subtitles corresponding to the selected movie/series elapsed time
  const [subText, setSubText] = useState("Previously on this program...");

  useEffect(() => {
    if (!isOfflineMode) return;

    // Subtitle track mock script generator based on progress percentage
    const mockDialogues = [
      "We found a newly discovered wormhole near Saturn...",
      "Do you think humanity was meant to leave Earth?",
      "Our planet is telling us to leave. It's time to build a future.",
      "The equation can only be solved if we obtain gravitational singularity...",
      "There is no time to waste, every second spent on Miller's planet is 7 years on Earth!",
      "I will find a way back... I promise you.",
      "This is not about saving my life, it's about saving our species.",
      "Synchronizing offline cached stream buffers..."
    ];

    const interval = setInterval(() => {
      if (isPlaying) {
        setProgress((prev) => {
          const next = prev >= 100 ? 0 : prev + 0.15;
          
          // Pick a dialogue
          const index = Math.floor((next / 100) * mockDialogues.length);
          setSubText(mockDialogues[index % mockDialogues.length]);
          
          // Translate progress to hours, mins, secs
          const totalSecs = 144 * 60; // 144 mins overall
          const currentSecs = Math.floor((next / 100) * totalSecs);
          const formatTime = (s: number) => {
            const h = Math.floor(s / 3600);
            const m = Math.floor((s % 3600) / 60);
            const sec = s % 60;
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
          };
          setMockTime({
            current: formatTime(currentSecs),
            duration: formatTime(totalSecs)
          });

          return next;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, isOfflineMode]);

  // Canvas visualizer for offline playing state to simulate raw local sound frequency
  useEffect(() => {
    if (!isOfflineMode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const draw = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // Draw beautiful dynamic audio waves
      ctx.beginPath();
      ctx.strokeStyle = isPlaying ? 'rgba(6, 182, 212, 0.4)' : 'rgba(6, 182, 212, 0.1)';
      ctx.lineWidth = 3;

      for (let x = 0; x < width; x += 5) {
        const amplitude = isPlaying ? (Math.sin(x * 0.015 + phase) * 25 + Math.cos(x * 0.005 + phase * 1.5) * 10) : 2;
        const y = centerY + amplitude;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Mirror wave
      ctx.beginPath();
      ctx.strokeStyle = isPlaying ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.05)';
      ctx.lineWidth = 1.5;
      for (let x = 0; x < width; x += 5) {
        const amplitude = isPlaying ? (Math.cos(x * 0.02 + phase * 0.8) * 15 + Math.sin(x * 0.01 + phase) * 8) : 1;
        const y = centerY - amplitude;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      phase += 0.04;
      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOfflineMode, isPlaying]);

  const handleFullscreenTrigger = () => {
    setFullscreenToast(true);
    setTimeout(() => {
      setFullscreenToast(false);
    }, 2800);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col relative" id="global-video-player font-sans pb-12">
      
      {/* Top Header Controls bar */}
      <div className="bg-black/95 border-b border-white/5 p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 z-10 shrink-0">
        
        {/* Left Row / Top Row on Mobile: Exit Theatre & Mobile Direct Link Actions */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-all font-display text-[10px] sm:text-xs font-bold uppercase tracking-widest cursor-pointer shrink-0"
            id="player-back-to-browse"
          >
            <ArrowLeft className="w-4.5 h-4.5 text-brand-400" />
            <span>Exit Theatre</span>
          </button>

          {/* Direct Link prominent shortcut on mobile */}
          <div className="flex md:hidden items-center gap-2">
            {!isOfflineMode && (
              <a
                href={iframePatternUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-400 text-white rounded-full text-[9px] font-black tracking-widest uppercase transition-all shadow-md shrink-0 cursor-pointer text-glow"
                id="external-stream-launcher-mobile"
                title="Bypass nested iframe blocks by opening the gateway directly in a new window"
              >
                <ExternalLink className="w-3 h-3 text-white" />
                <span>Direct Link</span>
              </a>
            )}
          </div>
        </div>

        {/* Center Title Column: centered on Desktop, stacked on Mobile */}
        <div className="text-left md:text-center flex-1 min-w-0 py-0.5 md:py-0">
          <h2 className="font-extrabold text-xs sm:text-sm md:text-base tracking-tight text-white uppercase italic text-glow truncate">
            Now Streaming: {activeMedia.title}
          </h2>
          {isShow && (
            <p className="text-[9px] sm:text-[10px] text-slate-400 font-mono font-bold mt-0.5 tracking-wider">
              Season {season} • Episode {episode}
            </p>
          )}
        </div>

        {/* Right Row Actions: Hidden on mobile if redundant, or formatted beautifully */}
        <div className="flex items-center justify-between md:justify-end gap-2.5 w-full md:w-auto border-t border-white/5 pt-2.5 md:pt-0 md:border-none">
          {isOfflineMode ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] sm:text-[9px] font-black tracking-widest font-mono bg-amber-500/10 border border-amber-500/20 text-amber-400 uppercase">
              <WifiOff className="w-3 h-3" />
              <span>OFFLINE DISK PLAYBACK</span>
            </span>
          ) : (
            <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-3 w-full md:w-auto flex-wrap">
              {/* Server selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] sm:text-[9px] font-bold tracking-widest font-mono text-slate-400 uppercase">
                  Gateway:
                </span>
                <div className="bg-brand-500/10 border border-brand-500/20 rounded-full px-2.5 py-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse shrink-0" />
                  <select
                    value={serverId}
                    onChange={(e) => onServerChange?.(e.target.value)}
                    className="bg-transparent border-none text-[8px] sm:text-[9px] font-black tracking-widest font-mono text-brand-400 focus:outline-none focus:ring-0 cursor-pointer uppercase pr-1 py-0.5"
                    id="player-server-select"
                  >
                    {servers?.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#050505] text-slate-200 font-sans tracking-normal font-medium normal-case">
                        {s.name.split(' (')[0]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sandbox Shield controller for iOS/Android compatibility */}
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] sm:text-[9px] font-bold tracking-widest font-mono text-slate-400 uppercase">
                  Shield:
                </span>
                <div className={`px-2.5 py-0.5 rounded-full flex items-center gap-1 border transition-all ${
                  sandboxMode === 'unrestricted'
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    : sandboxMode === 'compat'
                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}>
                  <select
                    value={sandboxMode}
                    onChange={(e) => setSandboxMode(e.target.value as any)}
                    className="bg-transparent border-none text-[8px] sm:text-[9px] font-black tracking-widest font-mono focus:outline-none focus:ring-0 cursor-pointer uppercase pr-1 py-0.5 animate-pulse"
                    id="player-shield-select"
                  >
                    <option value="unrestricted" className="bg-[#050505] text-amber-400 font-sans tracking-normal font-medium normal-case">Off (iOS/Android OK)</option>
                    <option value="compat" className="bg-[#050505] text-blue-400 font-sans tracking-normal font-medium normal-case">Lite Ad-Block</option>
                    <option value="safe" className="bg-[#050505] text-emerald-400 font-sans tracking-normal font-medium normal-case">Max Ad-Block</option>
                  </select>
                </div>
              </div>

              {/* Direct Link for Desktop */}
              <div className="hidden md:block">
                <a
                  href={iframePatternUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-400 text-white rounded-full text-[9px] font-black tracking-widest uppercase transition-all shadow-md shrink-0 cursor-pointer text-glow"
                  id="external-stream-launcher-desktop"
                  title="Bypass nested iframe blocks by opening the gateway directly in a new window"
                >
                  <ExternalLink className="w-3 h-3 text-white" />
                  <span>Direct Link</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main player box view area */}
      <div className="flex-1 flex flex-col items-center justify-center relative bg-black p-2 sm:p-6 select-none overflow-y-auto">
        
        {!isOfflineMode ? (
          /* ONLINE MODE REAL STREAM PORTAL EMBED COVER */
          <div className="w-full max-w-5xl flex flex-col gap-4">
            
            {/* Aspect Ratio Video container */}
            <div className="w-full aspect-video rounded-3xl overflow-hidden glass border border-white/10 shadow-2xl relative bg-black">
              {/* The secure ad-blocker sandboxed Cover Iframe! */}
              <iframe
                src={iframePatternUrl}
                className="w-full h-full bg-black/90"
                allowFullScreen
                referrerPolicy="no-referrer"
                allow="autoplay; encrypted-media; picture-in-picture"
                sandbox={
                  sandboxMode === 'safe'
                    ? "allow-scripts allow-same-origin allow-forms allow-presentation allow-pointer-lock"
                    : sandboxMode === 'compat'
                    ? "allow-scripts allow-same-origin allow-forms allow-presentation allow-pointer-lock allow-popups allow-popups-to-escape-sandbox"
                    : undefined // completely disabled for maximum compatibility on iOS / Android
                }
                title="Secure ImdbCover Feed"
                id="cinematic-iframe-stream"
              />
            </div>

            {/* Non-intrusive Flow Notice underneath the video, completely clear of the playback view */}
            {showSandboxAlert && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-brand-500/10 border border-brand-500/20 rounded-2xl p-4 text-xs text-slate-300 flex items-start justify-between gap-3 shadow-xl w-full leading-relaxed z-10"
              >
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <h4 className="font-bold text-white flex items-center gap-1.5 mb-1 text-xs uppercase tracking-wider">
                      <span>Gateway Sandbox Alert</span>
                      <span className="text-[9px] font-black tracking-widest uppercase bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded">Active Protection</span>
                    </h4>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      If the video screen is black or infinite loads, it indicates your mobile browser (e.g. iOS Safari / Chrome Android) blocks sandboxed frames. Keep <strong className="text-brand-400">Shield OFF</strong>, or try switching <strong className="text-cyan-400">Gateways</strong> or tapping <strong className="text-brand-400">Direct Link</strong>!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSandboxAlert(false)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded-full hover:bg-white/10 shrink-0"
                  id="dismiss-sandbox-hud"
                  title="Dismiss Note"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </div>
        ) : (
          /* OFFLINE CAPABILITY MODE INTERACTIVE CINEMA SIMULATION */
          <div className="w-full max-w-5xl aspect-video bg-gradient-to-tr from-[#050505] via-slate-900/60 to-[#050505] rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden flex flex-col justify-between p-4 group glass">
            
            {/* Visual audio synthesizer waveform background */}
            <canvas
              ref={canvasRef}
              width={700}
              height={200}
              className="absolute inset-0 w-full h-full opacity-35 z-0 pointer-events-none"
            />

            {/* Poster graphic backdrop center card */}
            <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-20">
              <img
                src={activeMedia.poster}
                alt="blurred poster background"
                className="w-72 h-auto object-contain brightness-75 rounded-2xl"
              />
            </div>

            {/* Subtitle Display track */}
            <div className="absolute bottom-24 left-4 right-4 text-center z-10 pointer-events-none">
              {showSubtitles && (
                <span className="bg-black/90 px-5 py-2 rounded-2xl text-xs sm:text-sm font-sans font-medium text-amber-200 border border-white/5 shadow-lg tracking-wide inline-block max-w-[90%]">
                  [{selectedSubtitle}] {subText}
                </span>
              )}
            </div>

            {/* Simulated Buffering/Loading offline stats overlay top left */}
            <div className="z-10 flex justify-between items-start w-full pointer-events-none">
              <div className="bg-black/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/5 flex flex-col gap-1 text-[10px] text-slate-400 font-mono">
                <span className="text-white font-black text-xs flex items-center gap-1.5 uppercase tracking-wide">
                  <Laptop className="w-4 h-4 text-brand-400" /> offline_buffer.vtt
                </span>
                <span>Bitrate: 4500kbps (Cached Block)</span>
                <span>Container: H.265 / HEVC Direct Copy</span>
                <span>Framerates: 23.976 fps</span>
              </div>
            </div>

            {/* Controls Bar for Simulated offline video player */}
            <div className="w-full bg-black/92 border border-white/5 p-3 sm:p-4 rounded-2xl z-20 mt-auto shadow-2xl">
              
              {/* Progress Slider track bar */}
              <div className="flex items-center gap-2.5 mb-3">
                <span className="text-[10px] font-mono text-slate-400 font-bold">{mockTime.current}</span>
                <div 
                  className="flex-1 h-1.5 bg-white/5 rounded-full cursor-pointer relative overflow-hidden"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const percent = ((e.clientX - rect.left) / rect.width) * 100;
                    setProgress(percent);
                  }}
                >
                  <div 
                    className="h-full bg-brand-500 rounded-full transition-all" 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-400 font-semibold">{mockTime.duration}</span>
              </div>

              {/* Bottom control row buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                
                <div className="flex items-center gap-4">
                  {/* Play & Pause */}
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-1.5 hover:text-cyan-400 text-white transition-colors cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                  </button>

                  <button 
                    onClick={() => setProgress(0)}
                    className="p-1.5 hover:text-cyan-400 text-white transition-colors cursor-pointer"
                    title="Replay from start"
                  >
                    <RotateCcw className="w-4.5 h-4.5" />
                  </button>

                  {/* Volume Control */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-1.5 hover:text-cyan-400 text-white transition-colors cursor-pointer"
                    >
                      {isMuted ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        setVolume(Number(e.target.value));
                        setIsMuted(false);
                      }}
                      className="w-16 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 justify-between sm:justify-end">
                  {/* Subtitle Selector */}
                  <div className="flex items-center gap-1.5 bg-black border border-white/5 px-2.5 py-1.5 rounded-full select-none">
                    <Subtitles className="text-brand-400 w-3.5 h-3.5 shrink-0" />
                    <select
                      value={selectedSubtitle}
                      onChange={(e) => {
                        setSelectedSubtitle(e.target.value);
                        setShowSubtitles(true);
                      }}
                      className="bg-transparent border-none text-[10.5px] font-bold focus:outline-none focus:ring-0 text-slate-300 cursor-pointer pr-1"
                    >
                      <option value="English" className="bg-black text-white">ENG Sub</option>
                      <option value="Japanese" className="bg-black text-white">JPN Org</option>
                      <option value="Spanish" className="bg-black text-white">ESP Sub</option>
                      <option value="Hindi" className="bg-black text-white">HIN Dub</option>
                    </select>
                  </div>

                  <button
                    onClick={() => setShowSubtitles(!showSubtitles)}
                    className={`px-3 py-1.5 rounded-full text-[9px] font-black border transition-colors cursor-pointer ${
                      showSubtitles 
                        ? 'bg-brand-500/20 border-brand-500 text-brand-300' 
                        : 'bg-black border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    CC
                  </button>

                  <button 
                    onClick={handleFullscreenTrigger}
                    className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>

      {/* Floating Gorgeous Custom Modal Notification replacing alert() */}
      <AnimatePresence>
        {fullscreenToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-[#050505] border border-brand-500/50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 glass max-w-sm"
          >
            <div className="w-9 h-9 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-400 shrink-0">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="text-white text-xs font-black uppercase tracking-wider">Theater Viewport</div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                Simulated screen optimization initialized. True full-screen mode responds to browser device viewport size.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
