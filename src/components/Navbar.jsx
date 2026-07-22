import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Tv, 
  Sun, 
  Moon, 
  Eye, 
  Sliders, 
  Zap, 
  Database,
  Radio
} from 'lucide-react';

export default function Navbar({ 
  activeCue,
  dbConfig,
  theme,
  setTheme,
  roomCode,
  onRoomCodeChange
}) {
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 dark:border-slate-800/80 light:border-slate-300 bg-slate-950/80 dark:bg-slate-950/80 light:bg-white/80 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Single Channel Brand */}
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 text-white shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform">
              <Tv className="w-5.5 h-5.5" />
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                  StreamPulse <span className="text-red-500">SCTE-35</span>
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider rounded bg-red-500/10 text-red-500 border border-red-500/30 uppercase">
                  SINGLE CHANNEL
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Live TV Media & Dynamic Ad Insertion (DAI)</p>
            </div>
          </NavLink>

          {/* Center/Right Actions & Route Links */}
          <div className="flex items-center gap-3">
            
            {/* Active SCTE Cue Badge */}
            {activeCue ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-semibold animate-pulse">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>AD BREAK • #{activeCue.eventId}</span>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>STREAM LIVE</span>
              </div>
            )}

            {/* Global Sync Room Code Input */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 px-2.5 py-1.5 rounded-xl">
              <Radio className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <input
                type="text"
                value={roomCode || ''}
                onChange={(e) => onRoomCodeChange(e.target.value)}
                placeholder="Sync Room"
                className="w-20 bg-transparent text-[11px] font-mono font-bold text-amber-500 focus:outline-none dark:text-amber-400 text-amber-600"
                title="Global Sync Room Code (Match this code on all devices to sync SCTE breaks)"
              />
            </div>

            {/* Light / Dark Mode Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Distinct Page Route Links */}
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 p-1 rounded-xl">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`
                }
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live View</span>
              </NavLink>
              
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`
                }
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Admin Page</span>
              </NavLink>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
