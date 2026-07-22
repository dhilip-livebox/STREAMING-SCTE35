import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  PictureInPicture2, 
  Zap, 
  Clock
} from 'lucide-react';
import { googleSheetsDB } from '../services/googleSheetsDB';
import { scte35Engine } from '../services/scte35Engine';
import { indexedDBService } from '../services/indexedDBService';

// Reliable sample commercial stream URLs fallback pool (backed by CDN infrastructure)
const SAMPLE_COMMERCIAL_FALLBACKS = [
  'https://vjs.zencdn.net/v/oceans.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
];

export default function LivePlayer({ 
  channel, 
  activeCue, 
  ads, 
  onAdImpression
}) {
  const mainVideoRef = useRef(null);
  const adVideoRef = useRef(null);
  const hlsRef = useRef(null);
  const adLocalObjUrlRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true); // Default muted to ensure autoplay compliance
  const [volume, setVolume] = useState(0.85);
  
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [currentAd, setCurrentAd] = useState(null);
  const [adRemainingSec, setAdRemainingSec] = useState(0);
  const [adTotalDuration, setAdTotalDuration] = useState(30);
  const [isImageAd, setIsImageAd] = useState(false);
  const [activeAdMediaUrl, setActiveAdMediaUrl] = useState('');
  const [broadcastStreamFile, setBroadcastStreamFile] = useState(null);

  // Synchronize raw main stream video files across tabs via BroadcastChannel
  useEffect(() => {
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      const channelSync = new BroadcastChannel('stream_pulse_channel_sync');
      channelSync.onmessage = (event) => {
        const { action, payload } = event.data;
        if (action === 'CHANNEL_UPDATED') {
          if (payload.rawStreamFile) {
            setBroadcastStreamFile(payload.rawStreamFile);
          }
        }
      };
      return () => channelSync.close();
    }
  }, []);

  // Enforce 1.0 normal playback rate
  useEffect(() => {
    if (mainVideoRef.current) {
      mainVideoRef.current.playbackRate = 1.0;
    }
    if (adVideoRef.current && !isImageAd) {
      adVideoRef.current.playbackRate = 1.0;
    }
  }, [isPlaying, isAdPlaying, channel?.url, isImageAd]);

  // Initialize and handle Main Channel video source
  useEffect(() => {
    const video = mainVideoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    let localObjUrl = null;
    let isActive = true;

    const loadVideoSource = async () => {
      // 1. Prioritize direct BroadcastChannel binary file transfer
      if (channel?.url === 'indexeddb://main_stream_file' && broadcastStreamFile) {
        localObjUrl = URL.createObjectURL(broadcastStreamFile);
        video.src = localObjUrl;
        video.loop = true;
        video.playbackRate = 1.0;
        video.load();
        if (isPlaying && !isAdPlaying) {
          video.play().catch(e => console.warn("Local broadcast video play deferred:", e));
        }
        return;
      }

      // 2. Fallback to loading raw File object from IndexedDB
      if (channel?.url === 'indexeddb://main_stream_file') {
        const file = await indexedDBService.get('main_stream_file');
        if (!isActive) return;
        if (file) {
          localObjUrl = URL.createObjectURL(file);
          video.src = localObjUrl;
          video.loop = true;
          video.playbackRate = 1.0;
          video.load();
          if (isPlaying && !isAdPlaying) {
            video.play().catch(e => console.warn("Local video play deferred:", e));
          }
        }
      } else if (channel?.url) {
        const isHls = channel.url.endsWith('.m3u8');
        if (isHls && Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true });
          hls.loadSource(channel.url);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (isActive && isPlaying && !isAdPlaying) {
              video.playbackRate = 1.0;
              video.play().catch(e => console.warn("HLS play deferred:", e));
            }
          });
          hlsRef.current = hls;
        } else {
          video.src = channel.url;
          video.loop = true;
          video.playbackRate = 1.0;
          video.load();
          if (isPlaying && !isAdPlaying) {
            video.play().catch(e => console.warn("Video play deferred:", e));
          }
        }
      }
    };

    loadVideoSource();

    return () => {
      isActive = false;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (localObjUrl) {
        URL.revokeObjectURL(localObjUrl);
      }
    };
  }, [channel?.url, broadcastStreamFile]);

  // Handle Play/Pause state changes and switch video focus smoothly (resolves frame/audio glitches)
  useEffect(() => {
    const mainVid = mainVideoRef.current;
    const adVid = adVideoRef.current;

    if (isAdPlaying) {
      if (mainVid && !mainVid.paused) {
        mainVid.pause();
      }
      if (adVid && !isImageAd) {
        adVid.playbackRate = 1.0;
        if (isPlaying) {
          adVid.play().catch(() => {});
        } else {
          adVid.pause();
        }
      }
    } else {
      if (adVid && !adVid.paused) {
        adVid.pause();
      }
      if (mainVid) {
        mainVid.playbackRate = 1.0;
        if (isPlaying) {
          mainVid.play().catch(() => {});
        } else {
          mainVid.pause();
        }
      }
    }
  }, [isPlaying, isAdPlaying, isImageAd]);

  // Handle Mute & Volume
  useEffect(() => {
    if (mainVideoRef.current) {
      mainVideoRef.current.muted = isMuted;
      mainVideoRef.current.volume = volume;
    }
    if (adVideoRef.current && !isImageAd) {
      adVideoRef.current.muted = isMuted;
      adVideoRef.current.volume = volume;
    }
  }, [isMuted, volume, isImageAd]);

  // Continuous Video Looping Handler
  const handleMainVideoEnded = () => {
    const video = mainVideoRef.current;
    if (video) {
      video.currentTime = 0;
      video.playbackRate = 1.0;
      video.play().catch(() => {});
    }
  };

  // Continuous Ad Video Loop Handler during Ad Break
  const handleAdVideoEnded = () => {
    const video = adVideoRef.current;
    if (video && isAdPlaying && !isImageAd) {
      video.currentTime = 0;
      video.playbackRate = 1.0;
      video.play().catch(() => {});
    }
  };

  // Error Fallback Handler for Ad Video Streams (prevents aborted load recursion loops)
  const handleAdVideoError = (e) => {
    if (isImageAd) return;
    const adVid = adVideoRef.current;
    if (!adVid) return;

    const error = adVid.error;
    // Only handle critical errors: code 3 (decode error) and code 4 (source not supported/not found)
    if (error && (error.code === 3 || error.code === 4)) {
      console.warn("Critical ad video playback error (code " + error.code + "), loading fallback spot...");
      const fallbackUrl = SAMPLE_COMMERCIAL_FALLBACKS[Math.floor(Math.random() * SAMPLE_COMMERCIAL_FALLBACKS.length)];
      
      if (adVid.src !== fallbackUrl) {
        adVid.src = fallbackUrl;
        adVid.muted = true; // Mute to guarantee autoplay
        adVid.load();
        adVid.play().catch(err => console.error("Ad fallback play failed:", err));
      }
    }
  };

  // Handle SCTE-35 Active Cue Signals (Dynamic Ad Insertion supporting both Videos and Images)
  useEffect(() => {
    let isActive = true;

    if (!activeCue) {
      if (isAdPlaying) {
        setIsAdPlaying(false);
        setCurrentAd(null);
        setIsImageAd(false);
        setActiveAdMediaUrl('');
        if (adLocalObjUrlRef.current) {
          URL.revokeObjectURL(adLocalObjUrlRef.current);
          adLocalObjUrlRef.current = null;
        }
        if (adVideoRef.current) adVideoRef.current.pause();
        if (mainVideoRef.current) {
          mainVideoRef.current.playbackRate = 1.0;
          mainVideoRef.current.play().catch(() => {});
        }
      }
      return;
    }

    const loadAdBreak = async () => {
      if (activeCue.type === 'CUE_OUT') {
        const dbAds = googleSheetsDB.getAds();
        const allAds = (ads && ads.length > 0) ? ads : dbAds;
        const availableAds = allAds.filter(a => a.status === 'ACTIVE');
        const targetDuration = activeCue.duration || 30;
        
        const customAdUrl = activeCue.adUrl;
        const customMediaType = activeCue.adMediaType;

        // Detect image format from URL string or mediaType prop
        const detectImage = customMediaType === 'image' || (customAdUrl && (
          customAdUrl.startsWith('data:image/') || 
          /\.(png|jpg|jpeg|webp|gif|svg)($|\?)/i.test(customAdUrl)
        ));

        if (!isActive) return;
        setIsImageAd(detectImage);

        const selectedAd = availableAds.find(a => a.duration === targetDuration) || availableAds[0] || dbAds[0] || {
          id: 'ad-fallback',
          title: 'Commercial Spot',
          brand: 'SCTE Commercial',
          url: SAMPLE_COMMERCIAL_FALLBACKS[0],
          duration: targetDuration
        };

        let finalAdUrl = customAdUrl || selectedAd.url || SAMPLE_COMMERCIAL_FALLBACKS[0];

        // 1. Prioritize raw ad file attached to the sync channel
        if (activeCue.adFile) {
          if (adLocalObjUrlRef.current) {
            URL.revokeObjectURL(adLocalObjUrlRef.current);
          }
          const objectUrl = URL.createObjectURL(activeCue.adFile);
          adLocalObjUrlRef.current = objectUrl;
          finalAdUrl = objectUrl;
        }
        // 2. Fallback to loading raw File object from IndexedDB
        else if (customAdUrl === 'indexeddb://ad_media_file') {
          const file = await indexedDBService.get('ad_media_file');
          if (!isActive) return;
          if (file) {
            if (adLocalObjUrlRef.current) {
              URL.revokeObjectURL(adLocalObjUrlRef.current);
            }
            const objectUrl = URL.createObjectURL(file);
            adLocalObjUrlRef.current = objectUrl;
            finalAdUrl = objectUrl;
          }
        }

        setActiveAdMediaUrl(finalAdUrl);

        setCurrentAd({
          id: customAdUrl ? 'custom-admin-ad' : selectedAd.id,
          title: customAdUrl ? (detectImage ? 'Custom Image Advertisement' : 'Custom Video Advertisement') : selectedAd.title,
          brand: customAdUrl ? 'Admin Selected Commercial' : selectedAd.brand,
          url: finalAdUrl,
          duration: targetDuration
        });

        setAdTotalDuration(targetDuration);
        setAdRemainingSec(targetDuration);
        setIsAdPlaying(true);

        if (mainVideoRef.current) mainVideoRef.current.pause();

        if (!detectImage) {
          const adVid = adVideoRef.current;
          if (adVid) {
            adVid.src = finalAdUrl;
            adVid.currentTime = 0;
            adVid.loop = true;
            adVid.playbackRate = 1.0;
            adVid.muted = isMuted;
            adVid.volume = volume;
            adVid.load();
            
            const playPromise = adVid.play();
            if (playPromise !== undefined) {
              playPromise.catch(() => {
                adVid.muted = true;
                adVid.play().catch(handleAdVideoError);
              });
            }
          }
        }

        if (channel?.id) {
          googleSheetsDB.logAdImpression(customAdUrl ? 'custom-ad' : selectedAd.id, channel.id, targetDuration, activeCue.eventId);
        }
        if (onAdImpression) onAdImpression();
      }
    };

    loadAdBreak();

    return () => {
      isActive = false;
    };
  }, [activeCue]);

  // Ad Timer Countdown
  useEffect(() => {
    if (!isAdPlaying || adRemainingSec <= 0) return;

    const timer = setInterval(() => {
      setAdRemainingSec((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (channel?.id) scte35Engine.triggerCueIn(channel.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAdPlaying, adRemainingSec]);

  // Fullscreen Handler
  const toggleFullscreen = () => {
    const container = document.getElementById('player-wrapper');
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen().catch(err => console.error(err));
    }
  };

  // PIP Handler
  const togglePictureInPicture = async () => {
    const video = isAdPlaying ? adVideoRef.current : mainVideoRef.current;
    if (!video) return;

    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture().catch(() => {});
    } else {
      await video.requestPictureInPicture().catch(() => {});
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      {/* Real Full Screen Live Video Container */}
      <div 
        id="player-wrapper"
        className="relative w-full aspect-video min-h-[60vh] sm:min-h-[70vh] md:min-h-[78vh] lg:min-h-[82vh] rounded-3xl overflow-hidden bg-slate-950 border border-slate-800/80 shadow-2xl group"
      >
        {/* Main Live Broadcast Video Element */}
        <video
          ref={mainVideoRef}
          loop
          autoPlay
          playsInline
          onEnded={handleMainVideoEnded}
          className={`w-full h-full object-cover transition-opacity duration-500 ${isAdPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* Ad Video Layer (Plays 100% Full Video Size Over Realtime Media) */}
        <video
          ref={adVideoRef}
          loop
          autoPlay
          playsInline
          onEnded={handleAdVideoEnded}
          onError={handleAdVideoError}
          className={`absolute inset-0 w-full h-full object-cover z-20 transition-opacity duration-500 ${isAdPlaying && !isImageAd ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        />

        {/* Ad Image Layer (Displays 100% Full Image Commercial Over Realtime Media) */}
        <img
          src={isImageAd && activeAdMediaUrl ? activeAdMediaUrl : undefined}
          alt="Commercial Advertisement"
          className={`absolute inset-0 w-full h-full object-cover z-20 transition-opacity duration-500 ${isAdPlaying && isImageAd ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        />

        {/* SLEEK TOP OVERLAY (Channel Badge & Live / Realistic Ad Watermark Bug) */}
        <div className="absolute top-0 inset-x-0 z-30 p-5 bg-gradient-to-b from-black/80 via-black/30 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          
          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-semibold">
              <span className="text-base">{channel?.logo || '📺'}</span>
              <span>{channel?.name || 'Live Stream Channel'}</span>
            </div>

            {!isAdPlaying ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/90 text-white text-[11px] font-bold uppercase tracking-wider shadow-lg shadow-red-600/30 border border-red-400/30">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                <span>LIVE STREAM</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/90 text-slate-950 text-[11px] font-bold uppercase tracking-wider shadow-lg shadow-amber-500/30 border border-amber-300">
                <Zap className="w-3.5 h-3.5 text-slate-950 animate-bounce" />
                <span>AD BREAK • 00:{adRemainingSec < 10 ? `0${adRemainingSec}` : adRemainingSec}</span>
              </div>
            )}
          </div>

          {/* Unmute Alert if Muted */}
          <div className="pointer-events-auto">
            {isMuted && !isImageAd && (
              <button
                onClick={() => setIsMuted(false)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500 text-slate-950 text-xs font-bold shadow-lg animate-pulse hover:scale-105 transition-transform"
              >
                <VolumeX className="w-4 h-4" />
                <span>Unmute Audio</span>
              </button>
            )}
          </div>

        </div>

        {/* REALISTIC ON-SCREEN BROADCAST AD WATERMARK BUG */}
        {isAdPlaying && (
          <div className="absolute top-5 right-5 z-30 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-amber-500/50 text-amber-400 text-xs font-mono font-bold shadow-xl animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span>ADVERTISEMENT • 00:{adRemainingSec < 10 ? `0${adRemainingSec}` : adRemainingSec}</span>
          </div>
        )}

        {/* SLEEK BOTTOM OVERLAY CONTROLS BAR (Play/Pause, Volume, Fullscreen) */}
        <div className="absolute bottom-0 inset-x-0 z-30 p-5 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          
          {/* Stream Progress Bar */}
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${isAdPlaying ? 'bg-amber-400' : 'bg-red-500'}`}
              style={{ width: isAdPlaying ? `${((adTotalDuration - adRemainingSec) / adTotalDuration) * 100}%` : '100%' }}
            ></div>
          </div>

          <div className="flex items-center justify-between">
            
            {/* Left Controls: Play / Pause & Volume Slider */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white flex items-center justify-center border border-white/20 shadow-lg transition-transform active:scale-95"
                title={isPlaying ? "Pause Stream" : "Play Stream"}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5 fill-white text-white" />}
              </button>

              {/* Volume Slider & Mute Toggle */}
              <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md border border-white/10 rounded-full px-3.5 py-2">
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-slate-300 hover:text-white transition-colors"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-white" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    if (isMuted) setIsMuted(false);
                  }}
                  className="w-20 accent-red-500 h-1 bg-white/30 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Right Controls: Picture-in-Picture & Fullscreen Only */}
            <div className="flex items-center gap-2">
              <button
                onClick={togglePictureInPicture}
                title="Picture-in-Picture"
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-slate-200 hover:text-white border border-white/10 transition-colors"
              >
                <PictureInPicture2 className="w-4.5 h-4.5" />
              </button>

              <button
                onClick={toggleFullscreen}
                title="Fullscreen"
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-slate-200 hover:text-white border border-white/10 transition-colors"
              >
                <Maximize className="w-4.5 h-4.5" />
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
