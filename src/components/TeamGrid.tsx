'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface TeamMember {
  _id: string;
  name: string;
  slug: { current: string };
  title?: string;
  imageUrl?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  office?: string;
}

interface TeamGridProps {
  members: TeamMember[];
  isRC: boolean;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

type SortOption = 'first-asc' | 'last-asc';

function getFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || '';
}

function getLastName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1] || '';
}

export default function TeamGrid({ members, isRC }: TeamGridProps) {
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('last-asc');

  // Sort members
  const sorted = useMemo(() => {
    return [...members].sort((a, b) => {
      if (sortBy === 'first-asc') {
        return getFirstName(a.name).localeCompare(getFirstName(b.name));
      }
      return getLastName(a.name).localeCompare(getLastName(b.name));
    });
  }, [members, sortBy]);

  // Determine which letters have at least one matching member
  const availableLetters = new Set(
    sorted.map((m) => getLastName(m.name).charAt(0).toUpperCase())
  );

  // Apply search and letter filter
  const filtered = useMemo(() => {
    let result = sorted;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((m) => m.name.toLowerCase().includes(q));
    }
    if (activeLetter) {
      result = result.filter(
        (m) => getLastName(m.name).charAt(0).toUpperCase() === activeLetter
      );
    }
    return result;
  }, [sorted, searchQuery, activeLetter]);

  return (
    <>
      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
        <div className="relative w-full sm:w-80">
          <svg
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
              isRC ? 'text-[var(--rc-brown)]/40' : 'text-gray-400'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setActiveLetter(null);
            }}
            className={`w-full pl-10 pr-4 py-2.5 text-sm border outline-none transition-colors ${
              isRC
                ? 'border-[var(--rc-brown)]/20 bg-white text-[var(--rc-navy)] placeholder:text-[var(--rc-brown)]/40 focus:border-[var(--rc-gold)]'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[#1a1a1a] dark:text-white placeholder:text-gray-400 focus:border-[var(--color-gold,#c19b5f)]'
            }`}
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className={`px-4 py-2.5 text-sm border outline-none cursor-pointer transition-colors ${
            isRC
              ? 'border-[var(--rc-brown)]/20 bg-white text-[var(--rc-navy)] focus:border-[var(--rc-gold)]'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[#1a1a1a] dark:text-white focus:border-[var(--color-gold,#c19b5f)]'
          }`}
        >
          <option value="last-asc">Sort by Last Name</option>
          <option value="first-asc">Sort by First Name</option>
        </select>
      </div>

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
      {(activeLetter || searchQuery.trim()) && (
        <p
          className={`text-center text-sm mb-8 ${
            isRC ? 'text-[var(--rc-brown)]' : 'text-[#6a6a6a] dark:text-gray-400'
          }`}
        >
          {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
          {searchQuery.trim() && <> for &ldquo;{searchQuery.trim()}&rdquo;</>}
          {activeLetter && <> with last name starting with &ldquo;{activeLetter}&rdquo;</>}
        </p>
      )}

      {/* Grid */}
      <div className={
        isRC
          ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8'
          : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8'
      }>
        {filtered.filter((m) => m.slug?.current).map((member) => (
          <Link
            key={member._id}
            href={`/team/${member.slug.current}`}
            className={isRC ? 'group' : 'group text-center'}
          >
            {/* Photo */}
            <div
              className={
                isRC
                  ? 'relative w-full overflow-hidden mb-4 bg-[var(--rc-navy)]/5 group-hover:shadow-lg transition-shadow duration-300'
                  : `relative w-full aspect-square rounded-full overflow-hidden mx-auto mb-4 bg-[#f0f0f0] dark:bg-gray-800 border-2 border-[var(--color-gold,#c19b5f)]/20 group-hover:border-[var(--color-gold,#c19b5f)] transition-colors duration-300`
              }
              style={isRC ? { aspectRatio: '450 / 560' } : undefined}
            >
              {member.imageUrl ? (
                <Image
                  src={member.imageUrl}
                  alt={member.name}
                  fill
                  className="object-cover"
                  sizes={isRC
                    ? '(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw'
                    : '(max-width: 640px) 40vw, (max-width: 1024px) 25vw, 20vw'
                  }
                />
              ) : (
                <div className={`w-full h-full flex items-center justify-center ${
                  isRC ? 'text-[var(--rc-brown)]/30' : 'text-gray-300'
                }`}>
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
              {isRC ? (
                <>
                  {member.name.split(/\s+/).slice(0, -1).join(' ')}<br />
                  {member.name.split(/\s+/).slice(-1)[0]}
                </>
              ) : (
                member.name
              )}
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

            {/* Contact info — RC only */}
            {isRC && (
              <div className="mt-2 space-y-0.5 text-xs text-[var(--rc-brown)]/70">
                {member.mobile && (
                  <p>C: {member.mobile}</p>
                )}
                {(member.office || member.phone) && (
                  <p>O: {member.office || member.phone}</p>
                )}
                {member.email && (
                  <p className="truncate">{member.email}</p>
                )}
              </div>
            )}
          </Link>
        ))}
      </div>
    </>
  );
}
