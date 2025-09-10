import React from "react";
import { renderFederation } from "@/utils/federationMapping";
import { renderTitle } from "@/utils/titleMapping";

interface PlayerObject {
    id?: string | number;
    playerName?: string;
    gender?: string;
    href?: string;
    rating?: string | number;
    title?: string;
    moreInfo?: {
        FIDE_ID?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown; // Allow for additional properties
}

interface CrosstableCell {
    result: string;
    whiteOpponent?: string | null;
    blackOpponent?: string | null;
}

interface Player {
    id: string;
    name: string;
    title: string;
    federation: string;
    fideId: string;
    fideRating: number | null;
    fideFederation: string;
    gender: string;
    href: string;
    origin: string;
}

interface PlayerRendererProps {
    data: string | PlayerObject | CrosstableCell | unknown;
    className?: string;
    onPlayerClick?: (playerId: string | number, playerData?: PlayerObject) => void;
    tournamentPath?: string; // Add tournament path to generate correct URLs
    columnHeader?: string; // Add column header to determine rendering type
    players?: Player[]; // Add centralized players array for lookup
}

// Helper function to validate FIDE ID
const isValidFideId = (fideId: string | null | undefined): boolean => {
    if (!fideId || fideId === '0' || fideId === 'null' || fideId === 'undefined' || fideId.trim() === '') {
        return false;
    }
    return true;
};

// Helper function to get gender-based styling
const getGenderStyles = (gender: string) => {
    const normalizedGender = gender?.toLowerCase().trim();
    
    if (normalizedGender === 'f' || normalizedGender === 'female') {
        return {
            nameColor: 'text-pink-600',
            linkColor: 'text-pink-600 hover:text-pink-800',
            linkHoverColor: 'hover:text-pink-800'
        };
    }
    
    // Default styling for male/other
    return {
        nameColor: 'text-gray-900',
        linkColor: 'text-blue-600 hover:text-blue-800',
        linkHoverColor: 'hover:text-blue-800'
    };
};

const PlayerRenderer: React.FC<PlayerRendererProps> = ({ data, className = "", onPlayerClick, tournamentPath, columnHeader, players = [] }) => {
    // If data is a string, check if it's a title, federation code, or player ID
    if (typeof data === 'string') {
        // Check if this is a Title column and render as badge
        if (columnHeader === 'Title') {
            const titleElement = renderTitle(data.trim());
            if (titleElement) {
                return (
                    <span className={className}>
                        {titleElement}
                    </span>
                );
            }
        }
        
        // Check if this looks like a federation code (2-3 letters, case insensitive) or flag path format
        const trimmedData = data.trim();
        const isFederationCode = /^[A-Za-z]{2,3}$/.test(trimmedData) || 
                                /^FLAG\/[A-Za-z]{2,3}\.(PNG|JPG|JPEG|GIF|SVG)$/i.test(trimmedData);
        
        if (isFederationCode) {
            return (
                <span className={className}>
                    {renderFederation(trimmedData)}
                </span>
            );
        }
        
        // Check if this is a player ID (numeric string) and we have players data
        // Only do this for specific player columns
        const isPlayerId = /^\d+$/.test(trimmedData);
        const isPlayerColumn = columnHeader && (
            columnHeader.toLowerCase().includes('player') || 
            columnHeader.toLowerCase() === 'white' || 
            columnHeader.toLowerCase() === 'black'
        );
        if (isPlayerId && players.length > 0 && isPlayerColumn) {
            const player = players.find(p => p.id === trimmedData);
            if (player) {
                const handlePlayerClick = () => {
                    if (onPlayerClick) {
                        onPlayerClick(player.id, {
                            id: player.id,
                            playerName: player.name,
                            gender: player.gender,
                            href: player.href,
                            rating: player.fideRating || undefined,
                            title: player.title,
                            moreInfo: {
                                FIDE_ID: player.fideId
                            }
                        });
                    }
                };

                const genderStyles = getGenderStyles(player.gender || '');
                const titleBadge = player.title ? renderTitle(player.title) : null;
                
                return (
                    <div className={`player-info ${className}`}>
                        <div className="flex items-center gap-2">
                            {titleBadge}
                            {onPlayerClick ? (
                                <button
                                    onClick={handlePlayerClick}
                                    className={`${genderStyles.linkColor} hover:underline font-medium cursor-pointer bg-transparent border-none p-0 text-left`}
                                >
                                    {player.name}
                                </button>
                            ) : (
                                <span className={`font-medium ${genderStyles.nameColor}`}>{player.name}</span>
                            )}
                        </div>
                        
                        {/* Display additional info in a subtle way */}
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                            {player.id && <span className="bg-gray-100 px-2 py-0.5 rounded-full">ID: {player.id}</span>}
                            {player.fideRating && <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full">({player.fideRating})</span>}
                            {isValidFideId(player.fideId) && (
                                <a 
                                    href={`https://ratings.fide.com/profile/${player.fideId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full hover:bg-purple-100 hover:text-purple-800 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    FIDE: {player.fideId}
                                </a>
                            )}
                        </div>
                    </div>
                );
            }
        }
        
        // Check if this is a "Pts" or "Result" column and render as bold
        if (columnHeader === 'Pts' || columnHeader === 'Result') {
            return <span className={`${className} font-bold`}>{data}</span>;
        }
        
        return <span className={className}>{data}</span>;
    }

    // If data is null, undefined, or a number, render it as string
    if (data === null || data === undefined || typeof data === 'number') {
        // Check if this is a "Pts" or "Result" column and render as bold
        if (columnHeader === 'Pts' || columnHeader === 'Result') {
            return <span className={`${className} font-bold`}>{String(data || '')}</span>;
        }
        return <span className={className}>{String(data || '')}</span>;
    }

    // Check if this is a crosstable cell object
    if (typeof data === 'object' && data !== null && 'result' in data && 'whiteOpponent' in data) {
        const crosstableData = data as CrosstableCell;
        return (
            <div className={`crosstable-cell ${className} flex flex-col items-center`}>
                <span className="font-medium text-sm">{crosstableData.result}</span>
                {crosstableData.whiteOpponent && (
                    <span className="mt-1 inline-block w-6 h-6 bg-white border border-gray-300 text-center text-xs leading-6 text-gray-700">
                        {crosstableData.whiteOpponent}
                    </span>
                )}
                {crosstableData.blackOpponent && (
                    <span className="mt-1 inline-block w-6 h-6 bg-gray-800 text-center text-xs leading-5 text-white">
                        {crosstableData.blackOpponent}
                    </span>
                )}
            </div>
        );
    }

    // If data is an object, try to extract player information
    if (typeof data === 'object') {
        const playerObj = data as PlayerObject;
        
        // Check for common player object properties
        const playerName = String(playerObj.playerName || playerObj.name || playerObj.player || '');
        const playerId = playerObj.id;
        const gender = playerObj.gender;
        const rating = playerObj.rating;
        const title = playerObj.title;
        const href = playerObj.href;
        const moreInfo = playerObj.moreInfo;
        const fideId = moreInfo?.FIDE_ID;

        // If we have a player name and it's not empty, render detailed player info
        if (playerName && playerName.trim() !== '') {
            const handlePlayerClick = () => {
                if (onPlayerClick && playerId && String(playerId).trim() !== '') {
                    onPlayerClick(playerId);
                }
            };

            // Get gender-based styling
            const genderStyles = getGenderStyles(gender || '');

            // Generate correct tournament URL if href exists
            let tournamentUrl = href;
            if (href && tournamentPath && playerId && String(playerId).trim() !== '') {
                // Convert href like "playercard.html#16" to tournament-scoped URL
                const params = new URLSearchParams();
                params.set('page', 'playercard.html');
                params.set('id', String(playerId));
                tournamentUrl = `${tournamentPath}?${params.toString()}`;
            }

            // Render title badge if available
            const titleBadge = title ? renderTitle(title) : null;
            
            return (
                <div className={`player-info ${className}`}>
                    <div className="flex items-center gap-2">
                        {titleBadge}
                        {href ? (
                            <a 
                                href={tournamentUrl} 
                                className={`${genderStyles.linkColor} hover:underline font-medium`}
                                onClick={(e) => {
                                    // Prevent default and use our navigation instead
                                    e.preventDefault();
                                    if (onPlayerClick && playerId && String(playerId).trim() !== '') {
                                        onPlayerClick(playerId, playerObj);
                                    }
                                }}
                            >
                                {playerName}
                            </a>
                        ) : playerId && String(playerId).trim() !== '' && onPlayerClick ? (
                            <button
                                onClick={() => onPlayerClick(playerId, playerObj)}
                                className={`${genderStyles.linkColor} hover:underline font-medium cursor-pointer bg-transparent border-none p-0 text-left`}
                            >
                                {playerName}
                            </button>
                        ) : (
                            <span className={`font-medium ${genderStyles.nameColor}`}>{playerName}</span>
                        )}
                    </div>
                    
                    {/* Display additional info in a subtle way */}
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                        {playerId && String(playerId).trim() !== '' && <span className="bg-gray-100 px-2 py-0.5 rounded-full">ID: {playerId}</span>}
                        {rating && <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full">({rating})</span>}
                        {isValidFideId(fideId) && (
                            <a 
                                href={`https://ratings.fide.com/profile/${fideId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full hover:bg-purple-100 hover:text-purple-800 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                FIDE: {fideId}
                            </a>
                        )}
                    </div>
                </div>
            );
        }

        // If it's an object but no player name, try to render key-value pairs
        // For debugging, let's be more explicit about what we show
        const entries = Object.entries(playerObj);
        if (entries.length > 0) {
            // Special handling for common player object patterns
            if ('playerName' in playerObj && 'id' in playerObj) {
                // This looks like a player object, show the name prominently
                const genderStyles = getGenderStyles(String(playerObj.gender || ''));
                
                return (
                    <div className={`player-fallback ${className}`}>
                        <span className={`font-medium ${genderStyles.nameColor}`}>
                            {String(playerObj.playerName || 'Unknown Player')}
                        </span>
                        {playerObj.id && String(playerObj.id).trim() !== '' && (
                            <span className="text-xs text-gray-500 ml-2">
                                (ID: {String(playerObj.id)})
                            </span>
                        )}
                    </div>
                );
            }
            
            // Generic object display
            return (
                <div className={`object-data ${className}`}>
                    {entries.map(([key, value], index) => (
                        <div key={key} className="text-xs">
                            {index === 0 ? (
                                <span className="font-medium">{String(value)}</span>
                            ) : (
                                <span className="text-gray-500">{key}: {String(value)}</span>
                            )}
                        </div>
                    ))}
                </div>
            );
        }
    }

    // Fallback: convert to string
    try {
        return <span className={className}>{JSON.stringify(data)}</span>;
    } catch {
        return <span className={className}>{String(data)}</span>;
    }
};

export default PlayerRenderer;
