'use client'

import dynamic from 'next/dynamic'
import config from '@/../sanity.config'

// Dynamically import NextStudio to reduce initial page load
const NextStudio = dynamic(
  () => import('next-sanity/studio').then((mod) => mod.NextStudio),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Studio...</p>
        </div>
      </div>
    )
  }
)

export default function StudioPage() {
  return <NextStudio config={config} />
}
