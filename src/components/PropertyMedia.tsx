'use client';

import { type ReactNode } from 'react';
import MuxPlayer from '@mux/mux-player-react';

interface Video {
  _key: string;
  title: string;
  videoType: 'mux' | 'youtube' | 'vimeo' | 'url';
  muxPlaybackId?: string;
  youtubeId?: string;
  vimeoId?: string;
  externalUrl?: string;
  thumbnail?: {
    asset: {
      url: string;
    };
  };
  description?: string;
}

interface Document {
  _key: string;
  title: string;
  documentType: string;
  file: {
    asset: {
      url: string;
      originalFilename?: string;
    };
  };
  description?: string;
}

interface PropertyMediaProps {
  videos?: Video[];
  documents?: Document[];
}

const documentTypeLabels: Record<string, string> = {
  floor_plan: 'Floor Plan',
  brochure: 'Brochure',
  survey: 'Survey',
  disclosures: 'Disclosures',
  hoa: 'HOA Documents',
  inspection: 'Inspection Report',
  other: 'Document',
};

const documentTypeIcons: Record<string, ReactNode> = {
  floor_plan: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  ),
  brochure: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  default: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
};

function VideoPlayer({ video }: { video: Video }) {
  if (video.videoType === 'mux' && video.muxPlaybackId) {
    return (
      <div className="aspect-video bg-black rounded overflow-hidden">
        <MuxPlayer
          playbackId={video.muxPlaybackId}
          className="w-full h-full"
          streamType="on-demand"
        />
      </div>
    );
  }

  if (video.videoType === 'youtube' && video.youtubeId) {
    return (
      <div className="aspect-video bg-black rounded overflow-hidden">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${video.youtubeId}`}
          title={video.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  if (video.videoType === 'vimeo' && video.vimeoId) {
    return (
      <div className="aspect-video bg-black rounded overflow-hidden">
        <iframe
          src={`https://player.vimeo.com/video/${video.vimeoId}`}
          width="100%"
          height="100%"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title={video.title}
          className="w-full h-full"
        />
      </div>
    );
  }

  if (video.videoType === 'url' && video.externalUrl) {
    return (
      <div className="aspect-video bg-black rounded overflow-hidden">
        <video
          src={video.externalUrl}
          controls
          className="w-full h-full"
          poster={video.thumbnail?.asset?.url}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  return null;
}

export default function PropertyMedia({ videos, documents }: PropertyMediaProps) {
  const hasVideos = videos && videos.length > 0;
  const hasDocuments = documents && documents.length > 0;

  if (!hasVideos && !hasDocuments) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Videos Section */}
      {hasVideos && (
        <div className="bg-white p-6 rounded-sm shadow-sm">
          <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--color-sothebys-blue)] mb-6">
            Property Videos
          </h2>
          <div className="space-y-6">
            {videos.map((video) => (
              <div key={video._key} className="space-y-3">
                <VideoPlayer video={video} />
                <div>
                  <h3 className="font-medium text-[#1a1a1a]">{video.title}</h3>
                  {video.description && (
                    <p className="text-sm text-gray-500 mt-1">{video.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents Section */}
      {hasDocuments && (
        <div className="bg-white p-6 rounded-sm shadow-sm">
          <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--color-sothebys-blue)] mb-6">
            Property Documents
          </h2>
          <div className="space-y-3">
            {documents.map((doc) => (
              <a
                key={doc._key}
                href={doc.file.asset.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 border border-gray-200 rounded hover:border-[var(--color-sothebys-blue)] hover:bg-gray-50 transition-all group"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-[var(--color-sothebys-blue)]/10 rounded flex items-center justify-center text-[var(--color-sothebys-blue)]">
                  {documentTypeIcons[doc.documentType] || documentTypeIcons.default}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-[#1a1a1a] group-hover:text-[var(--color-sothebys-blue)] transition-colors">
                    {doc.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {documentTypeLabels[doc.documentType] || 'Document'}
                    {doc.description && ` • ${doc.description}`}
                  </p>
                </div>
                <div className="flex-shrink-0 text-gray-400 group-hover:text-[var(--color-sothebys-blue)] transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
