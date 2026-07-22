import React, { useState } from 'react';
import { 
  Activity, 
  Zap, 
  Terminal, 
  Code, 
  CheckCircle2, 
  Clock, 
  PlayCircle, 
  StopCircle, 
  Layers, 
  Cpu,
  BarChart2
} from 'lucide-react';
import { scte35Engine } from '../services/scte35Engine';

export default function SCTEMonitor({ history, activeCue, onManualCueTrigger }) {
  const [selectedHex, setSelectedHex] = useState(null);

  const activeMetadata = selectedHex 
    ? scte35Engine.parseHexPayload(selectedHex)
    : (activeCue ? activeCue.metadata : (history[0] ? history[0].metadata : null));

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              SCTE-35 Telemetry & Cue Decoder
            </h3>
            <p className="text-xs text-slate-400 font-mono">ANSI/SCTE 35 Digital Program Insertion (DPI)</p>
          </div>
        </div>

        <span className="px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
          90 kHz PTS Clock
        </span>
      </div>

      {/* Manual SCTE-35 Trigger Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
        <button
          onClick={() => onManualCueTrigger(15)}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all active:scale-95"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Cue Out (15s)</span>
        </button>

        <button
          onClick={() => onManualCueTrigger(30)}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-extrabold transition-all active:scale-95 shadow-md shadow-amber-500/10"
        >
          <Zap className="w-3.5 h-3.5 animate-bounce" />
          <span>Cue Out (30s)</span>
        </button>

        <button
          onClick={() => onManualCueTrigger(60)}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all active:scale-95"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Cue Out (60s)</span>
        </button>

        <button
          onClick={() => scte35Engine.triggerCueIn('ch-1')}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all active:scale-95"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Cue In (End Ad)</span>
        </button>
      </div>

      {/* Hex Inspector & Decoded Table */}
      {activeMetadata && (
        <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-xs font-mono">
          <div className="flex items-center justify-between text-slate-400 mb-2 border-b border-slate-800/80 pb-1.5">
            <span className="flex items-center gap-1 text-cyan-400 font-bold">
              <Code className="w-3.5 h-3.5" /> Hex Field Inspection
            </span>
            <span className="text-[10px] text-slate-500">CRC32: {activeMetadata.crc32}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Command Type</span>
              <span className="text-cyan-300 font-bold">{activeMetadata.commandType}</span>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Event ID</span>
              <span className="text-amber-400 font-bold">#{activeMetadata.eventId}</span>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Duration</span>
              <span className="text-emerald-400 font-bold">{activeMetadata.durationSeconds} seconds</span>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
              <span className="text-[10px] text-slate-500 block">90kHz PTS Ticks</span>
              <span className="text-slate-300 font-bold">{activeMetadata.ptsTicks}</span>
            </div>
          </div>

          {/* Raw Binary Hex String */}
          <div className="bg-slate-900/90 p-2 rounded border border-cyan-900/50 text-[10px] break-all text-cyan-400 selection:bg-cyan-500 selection:text-slate-950">
            <span className="text-slate-500 select-none mr-2">RAW_HEX:</span>
            {selectedHex || (activeCue ? activeCue.hexPayload : (history[0]?.hexPayload || '0xfc302500000000000000fff01405000004d2007e02...'))}
          </div>
        </div>
      )}

      {/* SCTE Event Log Stream */}
      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" /> SCTE-35 Event Log Stream ({history.length})
        </h4>

        <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5 pr-1">
          {history.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 italic bg-slate-950/40 rounded-xl border border-slate-800/50">
              No SCTE-35 messages recorded yet. Click a Cue button above to inject a test marker.
            </div>
          ) : (
            history.map((evt) => (
              <div 
                key={evt.id}
                onClick={() => setSelectedHex(evt.hexPayload)}
                className={`p-2.5 rounded-xl border text-xs font-mono cursor-pointer transition-all flex items-center justify-between gap-2 ${
                  evt.type === 'CUE_OUT' 
                    ? 'bg-amber-950/20 border-amber-800/40 hover:bg-amber-950/40 text-amber-200'
                    : 'bg-emerald-950/20 border-emerald-800/40 hover:bg-emerald-950/40 text-emerald-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    evt.type === 'CUE_OUT' ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-slate-950'
                  }`}>
                    {evt.type}
                  </span>
                  <span className="font-bold">#{evt.eventId}</span>
                  {evt.duration > 0 && <span className="text-slate-400 text-[10px]">({evt.duration}s break)</span>}
                </div>

                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <span>Drift: +{evt.spliceDriftMs}ms</span>
                  <span className="text-slate-300">{evt.displayTime}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
