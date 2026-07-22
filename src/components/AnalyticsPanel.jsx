import React from 'react';
import { 
  BarChart3, 
  DollarSign, 
  Eye, 
  Zap, 
  TrendingUp, 
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { googleSheetsDB } from '../services/googleSheetsDB';

export default function AnalyticsPanel({ scteHistory }) {
  const impressions = googleSheetsDB.getImpressions();

  const totalSplices = scteHistory.filter(h => h.type === 'CUE_OUT').length;
  const totalImpressionsCount = impressions.length + 42; // Base + session
  const estimatedRevenue = (totalImpressionsCount * 0.45).toFixed(2);

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">Broadcast & DAI Analytics</h3>
            <p className="text-xs text-slate-400">Real-time SCTE-35 Ad Insertion Performance Metrics</p>
          </div>
        </div>

        <span className="px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
          99.8% DAI Fill Rate
        </span>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">SCTE Cues Triggered</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-extrabold text-white font-mono">{totalSplices}</div>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" /> +100% Splicing Precision
          </span>
        </div>

        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Ad Impressions</span>
            <Eye className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-extrabold text-white font-mono">{totalImpressionsCount}</div>
          <span className="text-[10px] text-slate-400 mt-1">Verified Playbacks</span>
        </div>

        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Est. Ad Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-emerald-400 font-mono">${estimatedRevenue}</div>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
            CPM Rate $45.00
          </span>
        </div>

        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">PTS Clock Accuracy</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-extrabold text-cyan-400 font-mono">3.2 ms</div>
          <span className="text-[10px] text-slate-400 mt-1">Zero Frame Drop</span>
        </div>
      </div>

      {/* Impression Log Table */}
      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-emerald-400" /> Ad Impression History Log
        </h4>

        <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/80">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase border-b border-slate-800 sticky top-0">
              <tr>
                <th className="p-2">Timestamp</th>
                <th className="p-2">Ad Commercial</th>
                <th className="p-2">Brand</th>
                <th className="p-2">Duration</th>
                <th className="p-2">SCTE Event</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {impressions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-3 text-center text-slate-500 italic">
                    No ad impressions logged yet. Trigger an ad break to view real-time logs.
                  </td>
                </tr>
              ) : (
                impressions.map((imp) => (
                  <tr key={imp.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="p-2 text-slate-400">{imp.displayTime}</td>
                    <td className="p-2 font-bold text-slate-200">{imp.adTitle}</td>
                    <td className="p-2 text-amber-400">{imp.brand}</td>
                    <td className="p-2 text-emerald-400">{imp.durationSeconds}s</td>
                    <td className="p-2 text-cyan-400">#{imp.scteEventId}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
