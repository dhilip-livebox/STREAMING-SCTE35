import React, { useState } from 'react';
import { 
  Zap, 
  Video, 
  Link, 
  Upload, 
  Play, 
  Square, 
  Tv, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Save, 
  Radio,
  FileVideo,
  Film
} from 'lucide-react';
import { googleSheetsDB } from '../services/googleSheetsDB';
import { scte35Engine } from '../services/scte35Engine';
import { indexedDBService } from '../services/indexedDBService';

export default function AdminDashboard({ 
  channels, 
  setChannels, 
  currentChannel: activeChannelProps,
  setCurrentChannel,
  ads, 
  onManualCueTrigger,
  scteHistory = [],
  activeCue = null
}) {
  const currentChannel = activeChannelProps || channels[0] || {};
  
  // Stream Source Input States
  const [streamUrl, setStreamUrl] = useState(currentChannel.url || '');
  const [channelName, setChannelName] = useState(currentChannel.name || 'Live Stream Channel');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [rawStreamFile, setRawStreamFile] = useState(null);

  // Handle Video URL Save
  const handleSaveStreamUrl = (e) => {
    e.preventDefault();
    if (!streamUrl.trim()) return;

    const updatedObj = {
      ...currentChannel,
      name: channelName,
      url: streamUrl.trim()
    };
    const updated = googleSheetsDB.saveChannel(updatedObj);
    setChannels(updated);
    if (setCurrentChannel) setCurrentChannel(updatedObj);
    setSaveSuccessMsg('Stream Video URL updated successfully!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  // Handle Local Stream Video File Pick
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setRawStreamFile(file);
    await indexedDBService.set('main_stream_file', file);
    const localObjectUrl = URL.createObjectURL(file);
    setStreamUrl(localObjectUrl);
    setSelectedFileName(file.name);

    const updatedObj = {
      ...currentChannel,
      name: channelName || file.name,
      url: 'indexeddb://main_stream_file',
      fileName: file.name
    };

    const updated = googleSheetsDB.saveChannel(updatedObj);
    setChannels(updated);
    if (setCurrentChannel) setCurrentChannel(updatedObj);

    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      const channelSync = new BroadcastChannel('stream_pulse_channel_sync');
      channelSync.postMessage({
        action: 'CHANNEL_UPDATED',
        payload: {
          channels: updated,
          currentChannel: updatedObj,
          rawStreamFile: file
        }
      });
    }

    setSaveSuccessMsg(`Loaded local stream video file: ${file.name}`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // Ad Video & Image Selection States
  const [selectedAdUrl, setSelectedAdUrl] = useState('');
  const [selectedAdFileName, setSelectedAdFileName] = useState('');
  const [selectedAdMediaType, setSelectedAdMediaType] = useState('video');
  const [rawAdFile, setRawAdFile] = useState(null);

  // Handle Local Commercial Ad File (Video or Image) Selection
  const handleAdFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const mediaType = isImage ? 'image' : 'video';
    setSelectedAdMediaType(mediaType);
    setRawAdFile(file);

    await indexedDBService.set('ad_media_file', file);
    setSelectedAdUrl('indexeddb://ad_media_file');
    setSelectedAdFileName(file.name);
    setSaveSuccessMsg(`Loaded local commercial ${isImage ? 'image' : 'video'}: ${file.name}`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // Manual Cue Return to Main Stream
  const handleReturnToMainStream = () => {
    scte35Engine.triggerCueIn(currentChannel.id);
  };

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 py-4">
      
      {/* HEADER TITLE */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Radio className="w-6 h-6 text-red-500 animate-pulse" />
            Stream & Ad Cue Control Console
          </h2>
          <p className="text-xs text-slate-400">Manage stream source and select custom advertisement video files & URLs</p>
        </div>
        <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-cyan-400">
          ADMIN MODE
        </span>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* SECTION 1: VIDEO SOURCE CONFIGURATION (URL OR FILE) */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Video className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-sm text-white">1. Stream Video Source (URL or Local File)</h3>
        </div>

        <form onSubmit={handleSaveStreamUrl} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Channel Name</label>
              <input
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-400 block mb-1">Live Stream Video URL (.m3u8 / .mp4)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://example.com/stream.m3u8"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 flex items-center gap-1.5 shrink-0"
                >
                  <Save className="w-4 h-4" /> Save URL
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Local File Picker Option for Main Stream */}
        <div className="mt-2 p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <FileVideo className="w-6 h-6 text-slate-400" />
            <div>
              <h4 className="text-xs font-bold text-slate-200">Or Play Local Video File for Live Stream</h4>
              <p className="text-[11px] text-slate-500">
                {selectedFileName ? `Loaded: ${selectedFileName}` : 'Select an MP4, WEBM, or MOV video file from your computer'}
              </p>
            </div>
          </div>

          <label className="cursor-pointer px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 border border-slate-700 transition-colors shrink-0">
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Choose Video File</span>
            <input 
              type="file" 
              accept="video/*" 
              onChange={handleFileSelect} 
              className="hidden" 
            />
          </label>
        </div>
      </div>

      {/* SECTION 2: ADVERTISEMENT SELECTION & SCTE-35 CUE RUNNING */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-white">2. Select Advertisement Video & Trigger SCTE-35 Break</h3>
          </div>
          {activeCue ? (
            <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-400 text-xs font-bold animate-pulse">
              AD CUE RUNNING NOW
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              MAIN STREAM LIVE
            </span>
          )}
        </div>

        {/* Ad Video & Image Source Selection (URL or Local Commercial File) */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-amber-400" />
            <label className="text-xs font-bold text-amber-400">Select Commercial Ad Source (Video / Image File or URL)</label>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Paste Commercial Ad Video / Image URL (.mp4, .png, .jpg)"
              value={selectedAdUrl}
              onChange={(e) => {
                setSelectedAdUrl(e.target.value);
                setSelectedAdFileName('');
                const isImg = /\.(png|jpg|jpeg|webp|gif|svg)($|\?)/i.test(e.target.value);
                setSelectedAdMediaType(isImg ? 'image' : 'video');
              }}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            />

            <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 border border-amber-500/40 transition-colors shrink-0">
              <Upload className="w-4 h-4 text-amber-400" />
              <span>{selectedAdFileName ? selectedAdFileName : 'Upload Local Ad (Video or Image)'}</span>
              <input
                type="file"
                accept="video/*,image/*"
                onChange={handleAdFileSelect}
                className="hidden"
              />
            </label>
          </div>

          {/* Preset Sample Commercials Quick Pills */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-[11px] text-slate-400 font-mono">Or Pick Sample Commercial:</span>
            {ads && ads.slice(0, 5).map((ad) => (
              <button
                key={ad.id}
                type="button"
                onClick={() => {
                  setSelectedAdUrl(ad.url);
                  setSelectedAdFileName(ad.title);
                  setSelectedAdMediaType('video');
                }}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-colors ${
                  selectedAdUrl === ad.url 
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20' 
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {ad.brand} ({ad.duration}s)
              </button>
            ))}
          </div>
        </div>

        {/* Trigger Cue Break Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => onManualCueTrigger(15, selectedAdUrl, selectedAdMediaType, rawAdFile)}
            className="py-4 px-4 rounded-2xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-extrabold text-sm flex flex-col items-center justify-center gap-1 shadow-lg shadow-rose-600/20 active:scale-95 transition-all"
          >
            <Zap className="w-6 h-6 text-amber-300 animate-pulse" />
            <span>Run 15s Ad Break</span>
            <span className="text-[10px] font-mono text-amber-200 opacity-80">SCTE-35 Cue Out</span>
          </button>

          <button
            onClick={() => onManualCueTrigger(30, selectedAdUrl, selectedAdMediaType, rawAdFile)}
            className="py-4 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-sm flex flex-col items-center justify-center gap-1 shadow-lg shadow-red-600/20 active:scale-95 transition-all"
          >
            <Zap className="w-6 h-6 text-white animate-bounce" />
            <span>Run 30s Ad Break</span>
            <span className="text-[10px] font-mono text-red-200 opacity-80">SCTE-35 Cue Out</span>
          </button>

          <button
            onClick={() => onManualCueTrigger(60, selectedAdUrl, selectedAdMediaType, rawAdFile)}
            className="py-4 px-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold text-sm flex flex-col items-center justify-center gap-1 shadow-lg shadow-amber-600/20 active:scale-95 transition-all"
          >
            <Zap className="w-6 h-6 text-amber-300 animate-pulse" />
            <span>Run 60s Ad Break</span>
            <span className="text-[10px] font-mono text-amber-200 opacity-80">SCTE-35 Cue Out</span>
          </button>
        </div>

        {/* Immediate Return to Main Stream */}
        {activeCue && (
          <button
            onClick={handleReturnToMainStream}
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-emerald-500/40 flex items-center justify-center gap-2 shadow-lg"
          >
            <Square className="w-4 h-4 fill-emerald-400" />
            <span>Stop Ad Break & Return to Live Stream (Cue In)</span>
          </button>
        )}

      </div>

      {/* SECTION 3: RECENT SCTE-35 CUE HISTORY LOG */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl flex flex-col gap-3">
        <h3 className="font-bold text-xs text-slate-400 uppercase font-mono tracking-wider">
          Executed SCTE-35 Cue Log History ({scteHistory.length})
        </h3>

        {scteHistory.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">No ad cues triggered yet. Click one of the buttons above to run an SCTE-35 cue.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">Signal Type</th>
                  <th className="p-3">Event ID</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {scteHistory.slice(0, 5).map((log, index) => (
                  <tr key={index} className="hover:bg-slate-900/40">
                    <td className="p-3 text-slate-400">{log.timestamp}</td>
                    <td className="p-3 font-bold text-amber-400">{log.type}</td>
                    <td className="p-3 text-cyan-400">#{log.eventId}</td>
                    <td className="p-3 text-slate-300">{log.duration ? `${log.duration}s` : 'Return'}</td>
                    <td className="p-3 text-emerald-400 font-bold">{log.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
