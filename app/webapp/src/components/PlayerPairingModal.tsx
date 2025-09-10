import React from 'react';
import { renderFederation } from "@/utils/federationMapping";
import { renderTitle } from "@/utils/titleMapping";

interface PlayerData {
    playerName?: string;
    id?: string | number;
    gender?: string;
    rating?: string | number;
    title?: string;
    federation?: string;
    moreInfo?: {
        FIDE_ID?: string;
        N?: string;
        K?: string;
        Elo?: string;
        anchor?: string;
        [key: string]: unknown;
    };
    tables?: Array<{
        headers?: Array<{ name: string; key: string } | string>;
        rows?: Record<string, unknown>[];
        caption?: Record<string, unknown>;
        footer?: {
            text: string;
            html: string;
        };
    }>;
    clickedPlayerData?: Record<string, unknown>;
    [key: string]: unknown;
}

interface PlayerPairingModalProps {
    isOpen: boolean;
    onClose: () => void;
    playerData: PlayerData | null;
}

const PlayerPairingModal: React.FC<PlayerPairingModalProps> = ({ isOpen, onClose, playerData }) => {
    if (!isOpen || !playerData) return null;

    const playerName = String(playerData.playerName || playerData.name || playerData.player || 'Unknown Player');
    const gender = playerData.gender;
    const rating = playerData.rating;
    const federation = playerData.federation;
    const moreInfo = playerData.moreInfo || {};
    
    // Try to find title from various sources
    let title = playerData.title || moreInfo.title || moreInfo.Title;
    
    // If no title found, try to extract from clicked player data first
    if (!title && playerData.clickedPlayerData) {
        // Check if the clicked player data has a title
        if (playerData.clickedPlayerData.title) {
            title = String(playerData.clickedPlayerData.title);
        }
    }
    
    // If still no title found, try to extract from table data
    if (!title && playerData.tables && playerData.tables.length > 0) {
        for (const table of playerData.tables) {
            if (table.rows && table.rows.length > 0) {
                for (const row of table.rows) {
                    if (row.Title) {
                        title = row.Title;
                        break;
                    }
                }
            }
        }
    }
    
    const fideId = moreInfo.FIDE_ID;
    const playerNumber = moreInfo.anchor; // This is the actual player number for navigation

    // Render title badge
    const titleBadge = title ? renderTitle(String(title)) : null;

    // Get gender-based styling
    const getGenderStyles = (gender: string) => {
        const normalizedGender = gender?.toLowerCase().trim();
        
        if (normalizedGender === 'f' || normalizedGender === 'female') {
            return {
                nameColor: 'text-pink-600',
                bgColor: 'bg-pink-50',
                borderColor: 'border-pink-200'
            };
        }
        
        return {
            nameColor: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200'
        };
    };

    const genderStyles = getGenderStyles(gender || '');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto ${genderStyles.bgColor} ${genderStyles.borderColor} border-2`}>
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {titleBadge && (
                                <div className="flex-shrink-0">
                                    {titleBadge}
                                </div>
                            )}
                            {playerNumber ? (
                                <a
                                    href={`?page=playercard.html&id=${playerNumber}`}
                                    className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
                                >
                                    {playerName}
                                </a>
                            ) : (
                                <h2 className="text-xl font-bold text-gray-900">
                                    {playerName}
                                </h2>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-2 md:p-6 space-y-2 md:space-y-6">
                    {/* K, Elo, and Player Number Badges */}
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            {playerNumber && (
                                <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                                    ID: {playerNumber}
                                </span>
                            )}
                            {moreInfo.K && (
                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                    K: {moreInfo.K}
                                </span>
                            )}
                            {moreInfo.Elo && (
                                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                    Elo: {moreInfo.Elo}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Main Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Rating */}
                        {rating && (
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                    </div>
                                    <h4 className="text-sm font-semibold text-green-700 uppercase tracking-wider">Rating</h4>
                                </div>
                                <p className="text-2xl font-bold text-green-800">{rating}</p>
                            </div>
                        )}

                        {/* Federation */}
                        {federation && (
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h4 className="text-sm font-semibold text-blue-700 uppercase tracking-wider">Federation</h4>
                                </div>
                                <div className="flex items-center gap-3">
                                    {renderFederation(federation)}
                                    <span className="text-xl font-bold text-blue-800">{federation}</span>
                                </div>
                            </div>
                        )}

                        {/* Gender */}
                        {gender && (
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <h4 className="text-sm font-semibold text-purple-700 uppercase tracking-wider">Gender</h4>
                                </div>
                                <p className="text-xl font-bold text-purple-800 capitalize">
                                    {gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : 'Not specified'}
                                </p>
                            </div>
                        )}

                        {/* FIDE ID */}
                        {fideId && (
                            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-orange-100 rounded-lg">
                                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                        </svg>
                                    </div>
                                    <h4 className="text-sm font-semibold text-orange-700 uppercase tracking-wider">FIDE ID</h4>
                                </div>
                                <a 
                                    href={`https://ratings.fide.com/profile/${fideId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xl font-bold text-orange-800 hover:text-orange-600 transition-colors inline-flex items-center gap-2"
                                >
                                    {fideId}
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Player Tables */}
                    {playerData.tables && playerData.tables.length > 0 && (
                        <div className="space-y-6">
                            {playerData.tables.map((table, tableIndex) => (
                                <div key={tableIndex} className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 overflow-hidden shadow-lg">
                                    {/* Enhanced Header */}
                                    <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white/20 rounded-lg">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-semibold">Tournament Performance</h4>
                                                <p className="text-blue-100 text-sm">Detailed match results and statistics</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Enhanced Table */}
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead>
                                                <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                                                    {table.headers?.map((header, headerIndex) => {
                                                        const headerName = typeof header === 'string' ? header : header.name;
                                                        // Skip ID column to keep it clean
                                                        if (headerName.toLowerCase().includes('id')) return null;
                                                        return (
                                                            <th key={headerIndex} className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                                    {headerName}
                                                                </div>
                                                            </th>
                                                        );
                                                    })}
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-100">
                                                {table.rows?.map((row, rowIndex) => (
                                                    <tr key={rowIndex} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 group">
                                                        {table.headers?.map((header, headerIndex) => {
                                                            const headerKey = typeof header === 'string' ? header : header.key;
                                                            const headerName = typeof header === 'string' ? header : header.name;
                                                            const cellValue = row[headerKey];
                                                            
                                                            // Skip ID column to keep it clean
                                                            if (headerName.toLowerCase().includes('id')) return null;
                                                            
                                                            // Enhanced cell rendering with special formatting
                                                            let cellContent: React.ReactNode = '';
                                                            const cellClassName = 'px-6 py-4 text-sm text-gray-900';
                                                            
                                                            if (typeof cellValue === 'string' || typeof cellValue === 'number') {
                                                                const strValue = String(cellValue);
                                                                
                                                                // Special formatting for different types of data
                                                                if (headerName.toLowerCase().includes('result') || headerName.toLowerCase().includes('score')) {
                                                                    cellContent = (
                                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                                                                            {strValue}
                                                                        </span>
                                                                    );
                                                                } else if (headerName.toLowerCase().includes('round') || headerName.toLowerCase().includes('game')) {
                                                                    cellContent = (
                                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                                                            {strValue}
                                                                        </span>
                                                                    );
                                                                } else if (headerName.toLowerCase().includes('opponent')) {
                                                                    cellContent = (
                                                                        <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                                                            {strValue}
                                                                        </span>
                                                                    );
                                                                } else {
                                                                    cellContent = strValue;
                                                                }
                                                            } else if (typeof cellValue === 'object' && cellValue !== null) {
                                                                cellContent = (
                                                                    <span className="text-gray-600 italic">
                                                                        {JSON.stringify(cellValue)}
                                                                    </span>
                                                                );
                                                            } else {
                                                                cellContent = String(cellValue || '');
                                                            }
                                                            
                                                            return (
                                                                <td key={headerIndex} className={cellClassName}>
                                                                    {cellContent}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    {/* Enhanced Footer */}
                                    {table.footer && (
                                        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div dangerouslySetInnerHTML={{ __html: table.footer.html }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-xl">
                    <div className="flex justify-center">
                        {playerNumber && (
                            <a
                                href={`?page=playercard.html&id=${playerNumber}`}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 text-sm font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                            >
                                View Full Profile
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerPairingModal;
