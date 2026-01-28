'use client'

import MuxPlayer from '@mux/mux-player-react'

interface MuxVideoPlayerProps {
  playbackId: string
}

export default function MuxVideoPlayer({ playbackId }: MuxVideoPlayerProps) {
  return (
    <div className="my-8 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
      <div className="max-w-[1028px] mx-auto px-8">
        <MuxPlayer
          playbackId={playbackId}
          className="w-full aspect-video"
          streamType="on-demand"
        />
      </div>
    </div>
  )
}
