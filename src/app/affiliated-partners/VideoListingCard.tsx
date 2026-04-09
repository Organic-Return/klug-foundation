'use client';

import { useState } from 'react';

interface VideoListingCardProps {
  embedUrl: string;
  price: string;
  address: string;
  agentName: string;
  title: string;
}

export default function VideoListingCard({ embedUrl, price, address, agentName, title }: VideoListingCardProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !embedUrl) return null;

  return (
    <div className="relative">
      <div className="aspect-[16/9] bg-[var(--color-sothebys-blue)]">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="autoplay; fullscreen; encrypted-media"
          allowFullScreen
          title={title}
          onError={() => setHasError(true)}
          onLoad={(e) => {
            // Check if iframe loaded an error page by trying to detect empty content
            try {
              const iframe = e.target as HTMLIFrameElement;
              // If the iframe src changed to about:blank or is empty, hide it
              if (!iframe.src || iframe.src === 'about:blank') {
                setHasError(true);
              }
            } catch {
              // Cross-origin - can't check, assume OK
            }
          }}
        />
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
        <p className="text-white text-xl font-semibold mb-1">{price}</p>
        <p className="text-white/70 text-sm font-light">{address}</p>
        <p className="text-[#c9ac77] text-xs font-light mt-1">{agentName}</p>
      </div>
    </div>
  );
}
