import React from 'react';

// Chess title mapping utility
// Maps chess titles to their levels and badge colors

export type TitleLevel = 'GM' | 'IM' | 'FM' | 'CM' | 'WGM' | 'WIM' | 'WFM' | 'WCM';

export interface TitleInfo {
  level: TitleLevel;
  color: string;
  bgColor: string;
  borderColor: string;
  order: number; // For sorting (higher = more prestigious)
}

export const titleMapping: Record<string, TitleInfo> = {
  // Men's titles (highest to lowest)
  'GM': {
    level: 'GM',
    color: 'text-white',
    bgColor: 'bg-purple-600',
    borderColor: 'border-purple-700',
    order: 8
  },
  'IM': {
    level: 'IM',
    color: 'text-white',
    bgColor: 'bg-blue-600',
    borderColor: 'border-blue-700',
    order: 7
  },
  'FM': {
    level: 'FM',
    color: 'text-white',
    bgColor: 'bg-green-600',
    borderColor: 'border-green-700',
    order: 6
  },
  'CM': {
    level: 'CM',
    color: 'text-white',
    bgColor: 'bg-orange-600',
    borderColor: 'border-orange-700',
    order: 5
  },
  
  // Women's titles (highest to lowest)
  'WGM': {
    level: 'WGM',
    color: 'text-white',
    bgColor: 'bg-pink-600',
    borderColor: 'border-pink-700',
    order: 4
  },
  'WIM': {
    level: 'WIM',
    color: 'text-white',
    bgColor: 'bg-rose-600',
    borderColor: 'border-rose-700',
    order: 3
  },
  'WFM': {
    level: 'WFM',
    color: 'text-white',
    bgColor: 'bg-red-600',
    borderColor: 'border-red-700',
    order: 2
  },
  'WCM': {
    level: 'WCM',
    color: 'text-white',
    bgColor: 'bg-red-500',
    borderColor: 'border-red-600',
    order: 1
  }
};

/**
 * Gets title information for a given title string
 * @param title - The title string (e.g., "GM", "WIM", "FM")
 * @returns TitleInfo object or null if not found
 */
export function getTitleInfo(title: string): TitleInfo | null {
  if (!title) return null;
  
  const upperTitle = title.toUpperCase().trim();
  return titleMapping[upperTitle] || null;
}

/**
 * Renders a chess title as a colored badge
 * @param title - The title string
 * @returns React element with styled badge or null
 */
export function renderTitle(title: string): React.ReactElement | null {
  const titleInfo = getTitleInfo(title);
  
  if (!titleInfo) {
    return null;
  }
  
  return React.createElement('span', {
    className: `inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border ${titleInfo.color} ${titleInfo.bgColor} ${titleInfo.borderColor}`,
    title: `${titleInfo.level} - ${getTitleDescription(titleInfo.level)}`
  }, titleInfo.level);
}

/**
 * Gets a description for a title level
 * @param level - The title level
 * @returns Description string
 */
function getTitleDescription(level: TitleLevel): string {
  const descriptions: Record<TitleLevel, string> = {
    'GM': 'Grandmaster',
    'IM': 'International Master',
    'FM': 'FIDE Master',
    'CM': 'Candidate Master',
    'WGM': 'Woman Grandmaster',
    'WIM': 'Woman International Master',
    'WFM': 'Woman FIDE Master',
    'WCM': 'Woman Candidate Master'
  };
  
  return descriptions[level] || level;
}

/**
 * Sorts titles by prestige (highest first)
 * @param titles - Array of title strings
 * @returns Sorted array of titles
 */
export function sortTitlesByPrestige(titles: string[]): string[] {
  return titles.sort((a, b) => {
    const infoA = getTitleInfo(a);
    const infoB = getTitleInfo(b);
    
    if (!infoA && !infoB) return 0;
    if (!infoA) return 1;
    if (!infoB) return -1;
    
    return infoB.order - infoA.order; // Higher order first
  });
}
