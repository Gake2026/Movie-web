import React, { useState, useEffect } from 'react';
import { Search, Wifi, WifiOff, Download, Film, Tv, Sparkles, AlertCircle } from 'lucide-react';
import { MediaType } from '../types';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedType: MediaType | 'all';
  setSelectedType: (type: MediaType | 'all') => void;
  isOfflineMode: boolean;
  setIsOfflineMode: (off: boolean) => void;
  activeTab: 'browse' | 'downloads' | 'playing';
  setActiveTab: (tab: 'browse' | 'downloads' | 'playing') => void;
  downloadCount: number;
  onSearchSubmit: (e: React.FormEvent) => void;
  searchWarning?: string;
}

export default function Header({
  searchQuery,
  setSearchQuery,
  selectedType,
  setSelectedType,
  isOfflineMode,
  setIsOfflineMode,
  activeTab,
  setActiveTab,
  downloadCount,
  onSearchSubmit,
  searchWarning
}: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'glass bg-[#050505]/85 shadow-2xl py-3' : 'bg-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Brand Logo & Tabs */}
          <div className="flex items-center justify-between md:justify-start gap-8">
            <button 
              onClick={() => { setSelectedType('all'); setSearchQuery(''); setActiveTab('browse'); }}
              className="flex items-center gap-2 text-white font-display text-2xl font-black tracking-tighter hover:opacity-95 transition-all"
              id="brand-logo"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-brand-500/25">
                <Film className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-white">FLUX.</span>
              <span className="text-brand-500">IMDB</span>
            </button>
            
            <nav className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('browse')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 border ${
                  activeTab === 'browse'
                    ? 'bg-brand-600/15 border-brand-500/40 text-brand-400 text-glow'
                    : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                id="tab-browse"
              >
                Discover
              </button>
              <button
                onClick={() => setActiveTab('downloads')}
                className={`relative px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 border flex items-center gap-1.5 ${
                  activeTab === 'downloads'
                    ? 'bg-brand-600/15 border-brand-500/40 text-brand-400 text-glow'
                    : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                id="tab-downloads"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Offline Vault</span>
                {downloadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-brand-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    {downloadCount}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Search Bar & Offline Toggle */}
          <div className="flex flex-1 md:max-w-xl items-center gap-3">
            {!isOfflineMode && activeTab === 'browse' && (
              <form onSubmit={onSearchSubmit} className="relative flex-1" id="search-form">
                <input
                  type="text"
                  placeholder="Query global ad-free streams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-full glass-input border border-white/5 font-sans tracking-wide"
                />
                <Search className="w-3.5 h-3.5 text-slate-450 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button 
                  type="submit" 
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] uppercase font-bold text-slate-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5 hover:text-white"
                >
                  Find
                </button>
              </form>
            )}

            {isOfflineMode && activeTab === 'browse' && (
              <div className="flex-1 text-[11px] text-amber-500 font-mono tracking-wide flex items-center gap-1.5 bg-amber-500/5 border border-amber-500/10 px-3 py-2 rounded-full">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Search disabled (Offline mode active)</span>
              </div>
            )}

            {/* Offline Simulation Toggle Switch with custom premium border glow */}
            <button
              onClick={() => setIsOfflineMode(!isOfflineMode)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border transition-all duration-200 text-[10px] font-bold tracking-widest uppercase cursor-pointer ${
                isOfflineMode
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                  : 'bg-white/5 text-emerald-400 border-emerald-500/20 hover:border-emerald-500/50'
              }`}
              title="Simulate network disconnect to test offline playback of downloaded files"
              id="offline-simulator-toggle"
            >
              {isOfflineMode ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span className="hidden sm:inline">Offline</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Ad-Free Engine</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Categories strip for Browse Tab */}
        {activeTab === 'browse' && (
          <div className="flex items-center justify-between border-t border-white/5 mt-4 pt-3 flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
              {(['all', 'movie', 'series', 'anime'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase transition-all duration-200 border ${
                    selectedType === type
                      ? 'bg-brand-500 text-white border-brand-500 shadow-md font-bold'
                      : 'bg-white/5 text-slate-400 border-transparent hover:text-white hover:bg-white/10'
                  }`}
                  id={`filter-${type}`}
                >
                  {type === 'all' ? 'All Content' : type === 'series' ? 'Web Series' : type}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-black tracking-widest">
              <Sparkles className="w-3 h-3 text-brand-400" />
              <span>Global Protocol Streaming</span>
            </div>
          </div>
        )}

        {/* Server Search Warning Banner */}
        {searchWarning && !isOfflineMode && activeTab === 'browse' && (
          <div className="mt-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-3 py-1.5 text-[11px] text-indigo-300 font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-400 animate-spin shrink-0" />
            <span>{searchWarning}</span>
          </div>
        )}
      </div>
    </header>
  );
}
