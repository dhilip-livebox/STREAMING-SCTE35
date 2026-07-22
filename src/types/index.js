/**
 * Default Media & Channels Inventory for Live Television Stream Simulation
 * Uses highly available, CORS-enabled, public CDN video streams that work on every system.
 */
export const DEFAULT_CHANNELS = [
  {
    id: 'ch-1',
    name: 'Pulse 1 • Global Broadcast HD',
    genre: 'News & Events',
    logo: '🌐',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    resolution: '1080p 60fps',
    bitrate: '6.5 Mbps',
    currentProgram: 'Global Stream Pulse Live',
    nextProgram: 'Horizon Summit (12:00 PM)',
    status: 'ACTIVE',
    scteEnabled: true
  },
  {
    id: 'ch-2',
    name: 'Pulse 2 • Cyber Cinema',
    genre: 'Movies & Sci-Fi',
    logo: '🚀',
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    resolution: '1080p 30fps',
    bitrate: '4.8 Mbps',
    currentProgram: 'Zen Ocean Landscapes',
    nextProgram: 'Neon Syndicate (01:30 PM)',
    status: 'ACTIVE',
    scteEnabled: true
  }
];

/**
 * Default Ad Inventory for SCTE-35 Dynamic Ad Insertion (DAI)
 * Provides high-availability CDN-backed video commercials for 15s, 30s, and 60s durations.
 */
export const DEFAULT_ADS = [
  {
    id: 'ad-101',
    title: 'Mozilla Flower Eco Campaign',
    brand: 'Mozilla Eco',
    category: 'Environment',
    url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    duration: 15,
    maxRunsPerSession: 5,
    currentImpressions: 42,
    targetDemographic: 'General Public',
    status: 'ACTIVE',
    priority: 1
  },
  {
    id: 'ad-102',
    title: 'VideoJS Oceans Preservation Spot',
    brand: 'Oceans Foundation',
    category: 'Non-Profit',
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    duration: 30,
    maxRunsPerSession: 5,
    currentImpressions: 38,
    targetDemographic: 'General Public',
    status: 'ACTIVE',
    priority: 1
  },
  {
    id: 'ad-103',
    title: 'Mux Developer Cloud Console Spot',
    brand: 'Mux Dev',
    category: 'Cloud Services',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    duration: 60,
    maxRunsPerSession: 2,
    currentImpressions: 18,
    targetDemographic: 'Software Developers',
    status: 'ACTIVE',
    priority: 1
  },
  {
    id: 'ad-104',
    title: 'Eco Campaign Spot (Short)',
    brand: 'Mozilla Eco',
    category: 'Environment',
    url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    duration: 15,
    maxRunsPerSession: 3,
    currentImpressions: 29,
    targetDemographic: 'General / Prime Time',
    status: 'ACTIVE',
    priority: 2
  },
  {
    id: 'ad-105',
    title: 'Oceans Preservation Spot (Loop)',
    brand: 'Oceans Foundation',
    category: 'Non-Profit',
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    duration: 30,
    maxRunsPerSession: 4,
    currentImpressions: 35,
    targetDemographic: 'Eco Travelers',
    status: 'ACTIVE',
    priority: 2
  }
];
