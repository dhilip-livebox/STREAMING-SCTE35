import { DEFAULT_CHANNELS, DEFAULT_ADS } from '../types/index.js';

const STORAGE_KEY_CHANNELS = 'stream_pulse_channels_v3';
const STORAGE_KEY_ADS = 'stream_pulse_ads_v3';
const STORAGE_KEY_CONFIG = 'stream_pulse_sheets_config';
const STORAGE_KEY_IMPRESSIONS = 'stream_pulse_ad_impressions';

export const googleSheetsDB = {
  /**
   * Get Google Sheets API / Webhook configuration
   */
  getConfig() {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      sheetId: '',
      apiKey: '',
      webAppUrl: '',
      autoSync: false,
      syncIntervalMinutes: 5,
      lastSyncedAt: null,
      status: 'DISCONNECTED'
    };
  },

  saveConfig(config) {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  },

  /**
   * Fetch Live Channels
   */
  getChannels() {
    const saved = localStorage.getItem(STORAGE_KEY_CHANNELS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    localStorage.setItem(STORAGE_KEY_CHANNELS, JSON.stringify(DEFAULT_CHANNELS));
    return DEFAULT_CHANNELS;
  },

  saveChannels(channels) {
    localStorage.setItem(STORAGE_KEY_CHANNELS, JSON.stringify(channels));
  },

  saveChannel(channel) {
    const channels = this.getChannels();
    const index = channels.findIndex(c => c.id === channel.id);
    if (index >= 0) {
      channels[index] = { ...channels[index], ...channel };
    } else {
      channels.push({ ...channel, id: `ch-${Date.now()}` });
    }
    this.saveChannels(channels);
    return channels;
  },

  deleteChannel(id) {
    const channels = this.getChannels().filter(c => c.id !== id);
    this.saveChannels(channels);
    return channels;
  },

  /**
   * Fetch Ad Inventory (Guarantees fresh 15s, 30s, 60s working sample commercials)
   */
  getAds() {
    const saved = localStorage.getItem(STORAGE_KEY_ADS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {}
    }
    localStorage.setItem(STORAGE_KEY_ADS, JSON.stringify(DEFAULT_ADS));
    return DEFAULT_ADS;
  },

  saveAds(ads) {
    localStorage.setItem(STORAGE_KEY_ADS, JSON.stringify(ads));
  },

  saveAd(ad) {
    const ads = this.getAds();
    const index = ads.findIndex(a => a.id === ad.id);
    if (index >= 0) {
      ads[index] = { ...ads[index], ...ad };
    } else {
      ads.push({ ...ad, id: `ad-${Date.now()}` });
    }
    this.saveAds(ads);
    return ads;
  },

  deleteAd(id) {
    const ads = this.getAds().filter(a => a.id !== id);
    this.saveAds(ads);
    return ads;
  },

  /**
   * Log an Ad Impression (DAI SCTE-35 Trigger Execution)
   */
  logAdImpression(adId, channelId, durationSeconds, scteEventId) {
    const ads = this.getAds();
    const ad = ads.find(a => a.id === adId);
    if (ad) {
      ad.currentImpressions = (ad.currentImpressions || 0) + 1;
      this.saveAds(ads);
    }

    const impressions = this.getImpressions();
    const record = {
      id: `imp-${Date.now()}`,
      adId,
      adTitle: ad ? ad.title : 'Commercial Spot',
      brand: ad ? ad.brand : 'SCTE Commercial',
      channelId,
      durationSeconds,
      scteEventId,
      timestamp: new Date().toISOString(),
      displayTime: new Date().toLocaleTimeString()
    };
    impressions.unshift(record);
    if (impressions.length > 100) impressions.pop();
    localStorage.setItem(STORAGE_KEY_IMPRESSIONS, JSON.stringify(impressions));

    return record;
  },

  getImpressions() {
    const saved = localStorage.getItem(STORAGE_KEY_IMPRESSIONS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  }
};
