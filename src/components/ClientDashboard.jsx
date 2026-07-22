import React from 'react';
import LivePlayer from './LivePlayer';

export default function ClientDashboard({ 
  currentChannel, 
  activeCue, 
  ads, 
  onAdImpression 
}) {
  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center max-w-7xl mx-auto py-1">
      <LivePlayer
        channel={currentChannel}
        activeCue={activeCue}
        ads={ads}
        onAdImpression={onAdImpression}
      />
    </div>
  );
}
