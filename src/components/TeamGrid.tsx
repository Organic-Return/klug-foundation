'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface TeamMember {
  _id: string;
  name: string;
  slug: { current: string };
  title?: string;
  imageUrl?: string;
}

interface TeamGridProps {
  members: TeamMember[];
  isRC: boolean;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function getLastName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1] || '';
}

export default function TeamGrid({ members, isRC }: TeamGridProps) {
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  // Determine which letters have at least one matching member
  const availableLetters = new Set(
    members.map((m) => getLastName(m.name).charAt(0).toUpperCase())
  );

  const filtered = activeLetter
    ? members.filter(
        (m) => getLastName(m.name).charAt(0).toUpperCase() === activeLetter
      )
    : members;

  return (
    <>
      {/* Letter Filter */}
      <div className="flex flex-wrap justify-center gap-1 md:gap-1.5 mb-10 md:mb-14">
        <button
          onClick={() => setActiveLetter(null)}
          className={`w-8 h-8 md:w-9 md:h-9 text-xs md:text-sm font-medium transition-all duration-200 ${
            activeLetter === null
              ? isRC
                ? 'bg-[var(--rc-gold)] text-white'
                : 'bg-[var(--color-gold,#c19b5f)] text-white'
              : isRC
                ? 'text-[var(--rc-navy)] hover:bg-[var(--rc-gold)]/10'
                : 'text-[#1a1a1a] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          All
        </button>
        {ALPHABET.map((letter) => {
          const hasMembers = availableLetters.has(letter);
          const isActive = activeLetter === letter;

          return (
            <button
              key={letter}
              onClick={() => hasMembers && setActiveLetter(isActive ? null : letter)}
              disabled={!hasMembers}
              className={`w-8 h-8 md:w-9 md:h-9 text-xs md:text-sm font-medium transition-all duration-200 ${
                isActive
                  ? isRC
                    ? 'bg-[var(--rc-gold)] text-white'
                    : 'bg-[var(--color-gold,#c19b5f)] text-white'
                  : hasMembers
                    ? isRC
                      ? 'text-[var(--rc-navy)] hover:bg-[var(--rc-gold)]/10'
                      : 'text-[#1a1a1a] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                    : isRC
                      ? 'text-[var(--rc-brown)]/25 cursor-default'
                      : 'text-gray-300 dark:text-gray-700 cursor-default'
              }`}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* Results count when filtered */}
      {activeLetter && (
        <p
          className={`text-center text-sm mb-8 ${
            isRC ? 'text-[var(--rc-brown)]' : 'text-[#6a6a6a] dark:text-gray-400'
          }`}
        >
          {filtered.length} {filtered.length === 1 ? 'member' : 'members'} with last name starting with &ldquo;{activeLetter}&rdquo;
        </p>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8">
        {filtered.map((member) => (
          <Link
            key={member._id}
            href={`/team/${member.slug.current}`}
            className="group text-center"
          >
            {/* Avatar */}
            <div
              className={`relative w-full aspect-square rounded-full overflow-hidden mx-auto mb-4 ${
                isRC
                  ? 'bg-[var(--rc-navy)]/5 border-2 border-[var(--rc-gold)]/20 group-hover:border-[var(--rc-gold)] transition-colors duration-300'
                  : 'bg-[#f0f0f0] dark:bg-gray-800 border-2 border-[var(--color-gold,#c19b5f)]/20 group-hover:border-[var(--color-gold,#c19b5f)] transition-colors duration-300'
              }`}
            >
              {member.imageUrl ? (
                <Image
                  src={member.imageUrl}
                  alt={member.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 40vw, (max-width: 1024px) 25vw, 20vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Name */}
            <h3
              className={`text-sm md:text-base font-medium transition-colors duration-200 ${
                isRC
                  ? 'text-[var(--rc-navy)] group-hover:text-[var(--rc-gold)]'
                  : 'text-[#1a1a1a] dark:text-white group-hover:text-[var(--color-gold,#c19b5f)]'
              }`}
            >
              {member.name}
            </h3>

            {/* Title */}
            {member.title && (
              <p
                className={`text-xs mt-1 ${
                  isRC ? 'text-[var(--rc-brown)]' : 'text-[#6a6a6a] dark:text-gray-400'
                }`}
              >
                {member.title}
              </p>
            )}
          </Link>
        ))}
      </div>
    </>
  );
}
