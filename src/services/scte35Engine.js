/**
 * SCTE-35 (ANSI/SCTE 35) Digital Program Insertion Cue Message Engine
 * Simulates and parses SCTE-35 binary cue payloads, splice insert commands,
 * UPID ad IDs, cue-out / cue-in triggers, and real-time broadcast event telemetry.
 */

class SCTE35Engine {
  constructor() {
    this.listeners = new Set();
    this.history = [];
    this.activeCue = null;
    this.autoSchedulerTimer = null;
    this.autoIntervalMinutes = 3;
    this.autoSchedulerActive = false;
    this.roomCode = (typeof window !== 'undefined' && localStorage.getItem('scte35_sync_room')) || 'livebox-scte35';
    this.eventSource = null;

    // Cross-tab broadcast synchronization channel
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      this.syncChannel = new BroadcastChannel('scte35_broadcast_sync');
      this.syncChannel.onmessage = (event) => {
        const { action, payload } = event.data;
        if (action === 'CUE_OUT') {
          this.activeCue = payload;
          this.notify(payload);
        } else if (action === 'CUE_IN') {
          this.activeCue = null;
          this.notify(payload);
        }
      };
    }

    this.connectGlobalSync();
  }

  setRoomCode(code) {
    this.roomCode = code || 'livebox-scte35';
    if (typeof window !== 'undefined') {
      localStorage.setItem('scte35_sync_room', this.roomCode);
    }
    this.connectGlobalSync();
  }

  connectGlobalSync() {
    if (typeof window === 'undefined') return;

    if (this.eventSource) {
      this.eventSource.close();
    }

    const sseUrl = `https://ntfy.sh/scte35_room_${this.roomCode}/sse`;
    this.eventSource = new EventSource(sseUrl);

    this.eventSource.onmessage = (event) => {
      try {
        const rawData = JSON.parse(event.data);
        if (rawData.message) {
          const syncEvent = JSON.parse(rawData.message);
          if (syncEvent.type === 'CUE_OUT') {
            this.activeCue = syncEvent;
            this.notify(syncEvent);
          } else if (syncEvent.type === 'CUE_IN') {
            this.activeCue = null;
            this.notify(syncEvent);
          }
        }
      } catch (e) {
        // Ignore system notifications
      }
    };
  }

  async publishGlobalSync(event) {
    try {
      // Remove raw binary files from global sync payload to respect size limits
      const syncPayload = { ...event, adFile: null };
      await fetch(`https://ntfy.sh/scte35_room_${this.roomCode}`, {
        method: 'POST',
        body: JSON.stringify(syncPayload)
      });
    } catch (e) {
      console.warn("Global real-time sync publish failed:", e);
    }
  }

  /**
   * Add event listener for SCTE-35 broadcast cues
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(event) {
    this.history.unshift(event);
    if (this.history.length > 50) this.history.pop();
    this.listeners.forEach((cb) => cb(event, this.history));
  }

  /**
   * Helper to encode SCTE-35 command into realistic hex byte string
   */
  generateSCTE35Hex(commandType, durationSeconds, eventId) {
    const tableId = 'fc';
    const sectionSyntax = '30';
    const sectionLength = '2b';
    const protocolVersion = '00';
    const encrypted = '000000000000';
    const ptsPtsOffset = 'fff014';
    
    const cmdTypeHex = commandType === 'SPLICE_INSERT' ? '05' : '06';
    const hexEventId = (eventId || Math.floor(Math.random() * 90000 + 10000)).toString(16).padStart(8, '0');
    const hexDuration = (durationSeconds * 90000).toString(16).padStart(8, '0');
    const upidData = '4f54545f41445f504f445f313031';
    const crc32 = '8f4c2e1a';

    return `${tableId}${sectionSyntax}${sectionLength}${protocolVersion}${encrypted}${ptsPtsOffset}${cmdTypeHex}${hexEventId}007e02${hexDuration}${upidData}${crc32}`;
  }

  /**
   * Parse hex payload into structured SCTE-35 metadata object
   */
  parseHexPayload(hexString) {
    try {
      const tableId = hexString.substring(0, 2);
      const isSpliceInsert = hexString.substring(22, 24) === '05';
      const rawEventId = hexString.substring(24, 32);
      const eventId = parseInt(rawEventId, 16) || Math.floor(Math.random() * 8999 + 1000);
      const rawDuration = hexString.substring(38, 46);
      const durationPts = parseInt(rawDuration, 16) || 2700000;
      const durationSec = Math.round(durationPts / 90000) || 30;

      return {
        tableId: `0x${tableId.toUpperCase()}`,
        commandType: isSpliceInsert ? 'Splice Insert (0x05)' : 'Time Signal (0x06)',
        eventId: eventId,
        spliceImmediate: true,
        durationSeconds: durationSec,
        ptsTicks: durationPts,
        upid: 'UPID:AD_POD_' + eventId,
        protocolVersion: 0,
        crc32: '0x' + hexString.slice(-8)
      };
    } catch (e) {
      return {
        tableId: '0xFC',
        commandType: 'Splice Insert (0x05)',
        eventId: 1042,
        durationSeconds: 30,
        ptsTicks: 2700000,
        upid: 'UPID:AD_POD_1042',
        protocolVersion: 0,
        crc32: '0x8F4C2E1A'
      };
    }
  }

  triggerCueOut(durationSeconds = 30, adUrl = null, adMediaType = 'video', adFile = null, channelId = 'ch-1') {
    const eventId = Math.floor(Math.random() * 90000 + 10000);
    const hex = this.generateSCTE35Hex('SPLICE_INSERT', durationSeconds, eventId);
    const parsed = this.parseHexPayload(hex);

    const event = {
      id: `evt-${Date.now()}`,
      type: 'CUE_OUT',
      timestamp: new Date().toISOString(),
      displayTime: new Date().toLocaleTimeString(),
      channelId,
      eventId,
      duration: durationSeconds,
      adUrl,
      adMediaType: adMediaType || 'video',
      adFile, // Binary File or Blob object
      adPodId: null,
      hexPayload: hex,
      metadata: parsed,
      spliceDriftMs: Math.floor(Math.random() * 8 + 2),
      status: 'ACTIVE_AD_BREAK'
    };

    this.activeCue = event;
    this.notify(event);
    if (this.syncChannel) {
      this.syncChannel.postMessage({ action: 'CUE_OUT', payload: event });
    }
    this.publishGlobalSync(event);

    return event;
  }

  /**
   * Inject CUE-IN event (End Ad Break, Return to Main Stream)
   */
  triggerCueIn(channelId = 'ch-1') {
    const eventId = this.activeCue ? this.activeCue.eventId : Math.floor(Math.random() * 90000 + 10000);
    const hex = this.generateSCTE35Hex('TIME_SIGNAL', 0, eventId);
    const parsed = this.parseHexPayload(hex);

    const event = {
      id: `evt-${Date.now()}`,
      type: 'CUE_IN',
      timestamp: new Date().toISOString(),
      displayTime: new Date().toLocaleTimeString(),
      channelId,
      eventId,
      duration: 0,
      hexPayload: hex,
      metadata: parsed,
      spliceDriftMs: Math.floor(Math.random() * 5 + 1),
      status: 'RETURNED_TO_MAIN'
    };

    this.activeCue = null;
    this.notify(event);
    if (this.syncChannel) {
      this.syncChannel.postMessage({ action: 'CUE_IN', payload: event });
    }
    this.publishGlobalSync(event);

    return event;
  }

  /**
   * Toggle Automated SCTE-35 Cue Scheduler
   */
  toggleAutoScheduler(enable, intervalMins = 3, onTriggerCallback) {
    this.autoSchedulerActive = enable;
    if (this.autoSchedulerTimer) {
      clearInterval(this.autoSchedulerTimer);
      this.autoSchedulerTimer = null;
    }

    if (enable) {
      this.autoIntervalMinutes = intervalMins;
      this.autoSchedulerTimer = setInterval(() => {
        if (!this.activeCue) {
          const evt = this.triggerCueOut(30, null, 'video', 'ch-1');
          if (onTriggerCallback) onTriggerCallback(evt);
        }
      }, intervalMins * 60 * 1000);
    }
    return this.autoSchedulerActive;
  }

  getHistory() {
    return this.history;
  }

  getActiveCue() {
    return this.activeCue;
  }
}

export const scte35Engine = new SCTE35Engine();
