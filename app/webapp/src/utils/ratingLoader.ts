// Utility function to load rating data from separate JSON files
// This is a placeholder for when you have actual rating files

export type RatingData = {
  [playerName: string]: {
    standard_rating?: number;
    rapid_rating?: number;
    blitz_rating?: number;
    acf_rating?: number;
    acf_quick_rating?: number;
  };
};

export type Tournament = {
  tournament: string;
  score: number;
  name: string;
  totalRounds: number;
  ratingType: 'standard' | 'rapid' | 'blitz';
};

export type Player = {
  name: string;
  title?: string;
  id: string;
  fideId: string;
  acfId?: string;
  gender: string;
  href: string;
  tournamentCount: number;
  tournaments: Tournament[];
  birthYear?: number;
  fideStandard?: number;
  fideRapid?: number;
  fideBlitz?: number;
  acfClassic?: number;
  acfQuick?: number;
  points?: {
    standard: number;
    rapid: number;
    blitz: number;
  };
};

export type PlayerRatings = Record<string, number | undefined>;

// Simulated rating data for development
export function generateSimulatedRatings(players: Player[], isSenior: boolean = true): Player[] {
  const baseRating = isSenior ? 1200 : 800;
  const range = isSenior ? 500 : 400;
  const currentYear = new Date().getFullYear();
  
  return players.map((player) => {
    // Generate realistic birth year based on category
    let birthYear = player.birthYear;
    if (!birthYear) {
      if (isSenior) {
        // Senior players: mostly 18+ years old
        birthYear = currentYear - Math.floor(Math.random() * 50) - 18; // 18-68 years old
      } else {
        // Junior players: mostly under 18 years old
        birthYear = currentYear - Math.floor(Math.random() * 18) - 1; // 1-18 years old
      }
    }
    
    return {
      ...player,
      birthYear,
      fideStandard: Math.floor(Math.random() * range) + baseRating,
      fideRapid: Math.floor(Math.random() * range) + baseRating,
      fideBlitz: Math.floor(Math.random() * range) + baseRating,
      acfClassic: Math.floor(Math.random() * range) + baseRating,
      acfQuick: Math.floor(Math.random() * range) + baseRating,
    };
  });
}

// Utility functions for age calculations and filtering
export function calculateAge(birthYear: number): number {
  const currentYear = new Date().getFullYear();
  return currentYear - birthYear;
}

export function isAdult(birthYear: number): boolean {
  return calculateAge(birthYear) >= 18;
}

export function isJunior(birthYear: number): boolean {
  return calculateAge(birthYear) < 18;
}

export function getAgeGroup(birthYear: number): string {
  const age = calculateAge(birthYear);
  if (age < 8) return 'U8';
  if (age < 10) return 'U10';
  if (age < 12) return 'U12';
  if (age < 14) return 'U14';
  if (age < 16) return 'U16';
  if (age < 18) return 'U18';
  if (age < 21) return 'U21';
  return 'Open';
}

// Filter players by age criteria
export function filterPlayersByAge(players: Player[], minAge?: number, maxAge?: number): Player[] {
  return players.filter(player => {
    if (!player.birthYear) return true; // Include players without birth year
    
    const age = calculateAge(player.birthYear);
    
    if (minAge !== undefined && age < minAge) return false;
    if (maxAge !== undefined && age > maxAge) return false;
    
    return true;
  });
}

// Find players who might be in wrong category (e.g., adults in junior tournaments)
export function findMisclassifiedPlayers(players: Player[], expectedCategory: 'junior' | 'senior'): Player[] {
  return players.filter(player => {
    if (!player.birthYear) return false; // Skip players without birth year
    
    const age = calculateAge(player.birthYear);
    const isAdultPlayer = age >= 18;
    
    if (expectedCategory === 'junior' && isAdultPlayer) {
      return true; // Adult player in junior category
    }
    
    if (expectedCategory === 'senior' && !isAdultPlayer) {
      return true; // Junior player in senior category
    }
    
    return false;
  });
}


