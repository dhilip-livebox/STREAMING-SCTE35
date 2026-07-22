import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ClientDashboard from './components/ClientDashboard';
import AdminDashboard from './components/AdminDashboard';

import { googleSheetsDB } from './services/googleSheetsDB';
import { scte35Engine } from './services/scte35Engine';

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('app-theme') || 'dark';
  });

  const [channels, setChannels] = useState(() => googleSheetsDB.getChannels());
  const [currentChannel, setCurrentChannel] = useState(() => channels[0] || {});
  const [ads, setAds] = useState(() => googleSheetsDB.getAds());
  const [activeCue, setActiveCue] = useState(null);
  const [scteHistory, setScteHistory] = useState([]);
  const [dbConfig, setDbConfig] = useState(() => googleSheetsDB.getConfig());
  const [roomCode, setRoomCode] = useState(() => scte35Engine.roomCode);

  const handleRoomCodeChange = (newCode) => {
    setRoomCode(newCode);
    scte35Engine.setRoomCode(newCode);
  };

  // Synchronize currentChannel whenever channels list updates
  useEffect(() => {
    if (channels && channels.length > 0) {
      setCurrentChannel({ ...channels[0] });
    }
  }, [channels]);

  // Synchronize channel changes across separate browser tabs
  useEffect(() => {
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      const channelSync = new BroadcastChannel('stream_pulse_channel_sync');
      channelSync.onmessage = (event) => {
        const { action, payload } = event.data;
        if (action === 'CHANNEL_UPDATED') {
          if (payload.channels) setChannels(payload.channels);
          if (payload.currentChannel) setCurrentChannel(payload.currentChannel);
        }
      };
      return () => channelSync.close();
    }
  }, []);

  // Synchronize Theme class on root HTML element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  // Subscribe to SCTE-35 Engine Events
  useEffect(() => {
    const unsubscribe = scte35Engine.subscribe((event, history) => {
      setScteHistory([...history]);
      if (event.type === 'CUE_OUT') {
        setActiveCue(event);
      } else if (event.type === 'CUE_IN') {
        setActiveCue(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to Global SCTE-35 Channel Updates (syncs streams/channels across devices)
  useEffect(() => {
    const unsubscribe = scte35Engine.subscribeChannel((event) => {
      if (event.channels) setChannels(event.channels);
      if (event.currentChannel) setCurrentChannel(event.currentChannel);
    });
    return () => unsubscribe();
  }, []);

  // Manual Cue Trigger Callback
  const handleManualCueTrigger = (durationSec = 30, adUrl = null, adMediaType = 'video', adFile = null) => {
    scte35Engine.triggerCueOut(durationSec, adUrl, adMediaType, adFile, currentChannel.id);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-950 dark:bg-slate-950 light:bg-slate-100 text-slate-100 dark:text-slate-100 light:text-slate-900 font-sans transition-colors">
        
        {/* Top Navbar */}
        <Navbar
          activeCue={activeCue}
          dbConfig={dbConfig}
          theme={theme}
          setTheme={setTheme}
          roomCode={roomCode}
          onRoomCodeChange={handleRoomCodeChange}
        />

        {/* Distinct URL Page Routes */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col justify-center">
          <Routes>
            
            {/* Client View Route (http://localhost:5173/) */}
            <Route 
              path="/" 
              element={
                <ClientDashboard
                  currentChannel={currentChannel}
                  activeCue={activeCue}
                  ads={ads}
                  onAdImpression={() => setAds(googleSheetsDB.getAds())}
                />
              } 
            />

            {/* Admin View Route (http://localhost:5173/admin) */}
            <Route 
              path="/admin" 
              element={
                <AdminDashboard
                  channels={channels}
                  setChannels={setChannels}
                  currentChannel={currentChannel}
                  setCurrentChannel={setCurrentChannel}
                  ads={ads}
                  onManualCueTrigger={handleManualCueTrigger}
                  scteHistory={scteHistory}
                  activeCue={activeCue}
                />
              } 
            />

            {/* Fallback Catch-All Route */}
            <Route 
              path="*" 
              element={
                <ClientDashboard
                  currentChannel={currentChannel}
                  activeCue={activeCue}
                  ads={ads}
                  onAdImpression={() => setAds(googleSheetsDB.getAds())}
                />
              } 
            />

          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-300 py-4 text-center text-xs text-slate-500 font-mono">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>StreamPulse SCTE-35 Single Channel TV Engine</span>
            <span>Client URL: <strong>/</strong> • Admin Console URL: <strong>/admin</strong></span>
          </div>
        </footer>

      </div>
    </BrowserRouter>
  );
}
