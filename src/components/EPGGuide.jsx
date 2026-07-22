import React from 'react';
import { Calendar, Clock, Tv, PlayCircle, Zap } from 'lucide-react';

export default function EPGGuide({ channels, currentChannel, onSelectChannel }) {
  const timeSlots = ['NOW (ON AIR)', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM'];

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">Live TV EPG & Broadcast Schedule</h3>
            <p className="text-xs text-slate-400">Electronic Program Guide with SCTE-35 Scheduled Ad Avails</p>
          </div>
        </div>

        <span className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
          Auto Grid Sync
        </span>
      </div>

      {/* Grid Timeline */}
      <div className="overflow-x-auto">
        <div className="min-w-[650px] flex flex-col gap-2">
          
          {/* Timeline Header Row */}
          <div className="grid grid-cols-6 gap-2 text-xs font-mono font-bold text-slate-400 border-b border-slate-800/80 pb-2">
            <div className="col-span-2 text-slate-300">CHANNEL / NETWORK</div>
            {timeSlots.map((ts, idx) => (
              <div key={idx} className={`text-center ${idx === 0 ? 'text-red-400 font-extrabold' : ''}`}>
                {ts}
              </div>
            ))}
          </div>

          {/* Channels Rows */}
          {channels.map((ch) => {
            const isSelected = ch.id === currentChannel.id;
            return (
              <div
                key={ch.id}
                onClick={() => onSelectChannel(ch)}
                className={`grid grid-cols-6 gap-2 p-2 rounded-xl border transition-all cursor-pointer items-center ${
                  isSelected 
                    ? 'bg-slate-900 border-red-500/50 shadow-md shadow-red-500/10' 
                    : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                {/* Channel Meta */}
                <div className="col-span-2 flex items-center gap-2.5">
                  <span className="text-xl">{ch.logo}</span>
                  <div className="truncate">
                    <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-red-400' : 'text-slate-200'}`}>
                      {ch.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono block">{ch.resolution}</span>
                  </div>
                </div>

                {/* NOW (ON AIR) Slot */}
                <div className="col-span-2 p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 flex flex-col justify-center">
                  <span className="text-[10px] font-mono text-red-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span> ON AIR
                  </span>
                  <span className="truncate">{ch.currentProgram}</span>
                </div>

                {/* UPCOMING Slot 1 */}
                <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400 flex flex-col justify-center">
                  <span className="text-[9px] text-amber-400 font-mono flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5" /> Ad Avail (30s)
                  </span>
                  <span className="truncate">{ch.nextProgram}</span>
                </div>

                {/* UPCOMING Slot 2 */}
                <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-center italic">
                  Evening Prime
                </div>
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}
