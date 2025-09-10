/**
 * Reference functions for tournament processing
 */

/**
 * Determines if a player is a senior player based on their name or player data
 * @param {string|object} player - Player name string or player object
 * @returns {boolean} True if the player is considered a senior player
 */
export function IsSeniorPlayer(player) {
  if (!player) return false;
  
  // Handle both string and object inputs
  let playerName = '';
  if (typeof player === 'string') {
    playerName = player;
  } else if (typeof player === 'object' && player.playerName) {
    playerName = player.playerName;
  } else {
    return false;
  }
  
  if (!playerName || typeof playerName !== 'string') {
    return false;
  }
  
  // Convert to lowercase for case-insensitive comparison
  const name = playerName.toLowerCase().trim();
  
  // List of known senior players (this could be expanded or made configurable)
  const seniorPlayers = [
    // Add known senior players here
    // Example: 'john doe', 'jane smith'
  ];
  
  // Check if the player name matches any known senior players
  if (seniorPlayers.includes(name)) {
    return true;
  }
  
  // Additional logic to determine senior status could be added here
  // For example, checking age, rating, or other criteria
  
  return false;
}
