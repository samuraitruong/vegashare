"use client";
import React, { useEffect, useState, use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import TournamentMeta from "@/components/TournamentMeta";
import TournamentMenu from "@/components/TournamentMenu";
import PlayerRenderer from "@/components/PlayerRenderer";
import KeyValueTable from "@/components/KeyValueTable";
import PlayerPairingModal from "@/components/PlayerPairingModal";

type TableCaption = string | {
    playerName?: string;
    id?: string | number;
    moreInfo?: {
        anchor?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
};

type Header = { name: string; key: string };
type MixedHeader = Header | string;

type PageData = {
    pageHeading?: string;
    tables?: {
        headers?: MixedHeader[];
        rows?: Record<string, unknown>[];
        caption?: TableCaption;
        footer?: {
            text: string;
            html: string;
        };
    }[];
    pairingScheduleText?: string;
};

type Player = {
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
};

type TournamentData = {
    generatedAt: string;
    tournament: {
        id: string;
        name: string;
        category: string;
        metadata: Record<string, unknown>;
    };
    players: Player[];
    pages: Record<string, PageData>;
    menu: MenuItem[];
};

type MenuItem = {
    text: string;
    href: string;
    isDropdown?: boolean;
    children?: MenuItem[];
};

export default function TournamentClient({ params }: { params: Promise<{ tournament: string }> }) {
    // Unwrap params Promise using React.use()
    const resolvedParams = use(params);
    const [data, setData] = useState<TournamentData | null>(null);
    const searchParams = useSearchParams();
    const router = useRouter();
    const page = searchParams?.get("page") || "index.html";
    const playerId = searchParams?.get("id"); // Get player ID for auto-scroll

    useEffect(() => {
        fetch(process.env.NEXT_PUBLIC_APP_URL + `/www${resolvedParams.tournament}/data_clean.json?ts=${new Date().getTime()}`)
            .then((res) => res.json())
            .then((json) => setData(json));
    }, [resolvedParams.tournament]);

    // Auto-scroll effect for player cards
    useEffect(() => {
        if (data && page === "playercard.html" && playerId) {
            // Small delay to ensure DOM is rendered
            const timer = setTimeout(() => {
                const targetElement = document.getElementById(`table-anchor-${playerId}`);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [data, page, playerId]);

    // Sorting state
    const [sortConfig, setSortConfig] = useState<{ tableIdx: number; key: string; direction: "asc" | "desc" } | null>(null);

    // Search state
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [copiedTableIdx, setCopiedTableIdx] = useState<number | null>(null);

    // Player modal state
    const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
    const [selectedPlayerData, setSelectedPlayerData] = useState<Record<string, unknown> | null>(null);

    // Pairing selector logic
    const isPairingPage = page.startsWith("pairs");
    const pairingPages = data?.pages ? Object.keys(data.pages).filter((k) => k.startsWith("pairs")) : [];
    // const currentPairingIdx = pairingPages.indexOf(page); // Unused variable

    // Handlers
    const handleSelectPage = (href: string) => {
        router.replace(`?page=${encodeURIComponent(href)}`);
    };
    const handlePairingSelect = (idx: number) => {
        if (pairingPages[idx]) {
            router.replace(`?page=${encodeURIComponent(pairingPages[idx])}`);
        }
    };
    const handleHeaderClick = (tableIdx: number, headerKey: string) => {
        setSortConfig((prev) => {
            if (prev && prev.tableIdx === tableIdx && prev.key === headerKey) {
                return { tableIdx, key: headerKey, direction: prev.direction === "asc" ? "desc" : "asc" };
            }
            return { tableIdx, key: headerKey, direction: "asc" };
        });
    };

    const handlePlayerClick = (playerId: string | number, playerData?: Record<string, unknown>) => {
        // Find player data from centralized players array
        const player = data?.players.find(p => p.id === String(playerId));
        
        if (player) {
            // Find player data from playercard page
            const playercardData = data?.pages['playercard.html'];
            
            if (playercardData?.tables) {
                // Look for the player in the playercard tables
                for (let i = 0; i < playercardData.tables.length; i++) {
                    const table = playercardData.tables[i];
                    
                    // Check if this table belongs to the clicked player
                    const caption = table.caption as Record<string, unknown>;
                    const moreInfo = caption.moreInfo as Record<string, unknown> | undefined;
                    if (table.caption && typeof table.caption === 'object' && moreInfo?.anchor === String(playerId)) {
                        // Create a comprehensive player data object from the table
                        const modalPlayerData = {
                            ...table.caption, // Include caption data (name, id, etc.)
                            tables: [table], // Include the table data for detailed information
                            clickedPlayerData: playerData, // Include the clicked player data for title information
                            player: player // Include the centralized player data
                        };
                        
                        setSelectedPlayerData(modalPlayerData);
                        setIsPlayerModalOpen(true);
                        return;
                    }
                }
            }
        }
        
        // Fallback: navigate to playercard page if modal data not found
        router.push(`?page=playercard.html&id=${playerId}`);
    };

    const handleClosePlayerModal = () => {
        setIsPlayerModalOpen(false);
        setSelectedPlayerData(null);
    };



    // Search filtering function
    const getFilteredAndSortedRows = (table: { rows?: Record<string, unknown>[] }, idx: number) => {
        let rows = table.rows || [];

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            rows = rows.filter(row => {
                // Check if any cell in the row contains the search query
                return Object.values(row).some(value => {
                    if (typeof value === 'string') {
                        return value.toLowerCase().includes(query);
                    } else if (typeof value === 'object' && value !== null) {
                        // Handle player objects and other structured data
                        if ('playerName' in value) {
                            return String(value.playerName).toLowerCase().includes(query);
                        }
                        // Handle crosstable cells
                        if ('result' in value) {
                            return String(value.result).toLowerCase().includes(query);
                        }
                        // Recursively check object values
                        return Object.values(value).some(v =>
                            String(v).toLowerCase().includes(query)
                        );
                    }
                    return String(value).toLowerCase().includes(query);
                });
            });
        }

        // Apply sorting
        if (sortConfig && sortConfig.tableIdx === idx) {
            return rows.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];

                // Convert to strings for comparison
                const aStr = String(aVal || '');
                const bStr = String(bVal || '');

                // Check if both values are numeric (including decimal numbers)
                const aNum = parseFloat(aStr);
                const bNum = parseFloat(bStr);

                if (!isNaN(aNum) && !isNaN(bNum)) {
                    // Both are valid numbers, sort numerically
                    return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
                }

                // At least one is not a number, sort as strings
                if (sortConfig.direction === 'asc') {
                    return aStr.localeCompare(bStr);
                } else {
                    return bStr.localeCompare(aStr);
                }
            });
        }

        return rows;
    };

    // Function to check if a column is completely empty
    const isColumnEmpty = (table: { headers?: MixedHeader[]; rows?: Record<string, unknown>[] }, headerKey: string): boolean => {
        if (!table.rows || table.rows.length === 0) return true;
        
        return table.rows.every(row => {
            const value = row[headerKey];
            if (value === null || value === undefined || value === '') return true;
            if (typeof value === 'string' && value.trim() === '') return true;
            if (typeof value === 'object' && value !== null) {
                // Check if it's a player object with empty name
                if ('playerName' in value) {
                    const playerObj = value as Record<string, unknown>;
                    const playerName = playerObj.playerName || playerObj.name || playerObj.player;
                    return !playerName || String(playerName).trim() === '';
                }
                // Check if it's a crosstable cell with empty result
                if ('result' in value) {
                    return !value.result || String(value.result).trim() === '';
                }
                // For other objects, check if all values are empty
                return Object.values(value).every(v => 
                    v === null || v === undefined || v === '' || 
                    (typeof v === 'string' && v.trim() === '')
                );
            }
            return false;
        });
    };

    // Function to check if a table is a pairing table (has White and Black columns)
    const isPairingTable = (table: { headers?: MixedHeader[]; rows?: Record<string, unknown>[] }): boolean => {
        if (!table.headers || !table.rows || table.rows.length === 0) return false;
        
        const headerKeys = table.headers.map(h => (typeof h === 'string' ? h : h.key)).map(k => k.toLowerCase());
        
        // Check for various white/black column name patterns
        const hasWhite = headerKeys.some(key => 
            key.includes('white') || key === 'white' || key === 'w'
        );
        const hasBlack = headerKeys.some(key => 
            key.includes('black') || key === 'black' || key === 'b'
        );
        
        
        return hasWhite && hasBlack;
    };

    // Function to get player data from centralized players array
    const getPlayerData = (playerId: string | number): Player | null => {
        return data?.players.find(p => p.id === String(playerId)) || null;
    };

    // Function to get FIDE ID from player ID
    const getFideId = (playerId: string | number): string | null => {
        const player = getPlayerData(playerId);
        const fideId = player?.fideId;
        
        // Validate FIDE ID - exclude "0", empty strings, and other invalid values
        if (!fideId || fideId === '0' || fideId === 'null' || fideId === 'undefined' || fideId.trim() === '') {
            return null;
        }
        
        return fideId;
    };


    // Function to get filtered headers (excluding empty columns) and add comparison column for pairing tables
    const getFilteredHeaders = (table: { headers?: MixedHeader[]; rows?: Record<string, unknown>[] }): Header[] => {
        const normalizedHeaders: Header[] = (table.headers?.map(h => (typeof h === 'string' ? { name: h, key: h } : h)) || []);
        
        const filteredHeaders = normalizedHeaders.filter(header => !isColumnEmpty(table, header.key));
        
        // Add comparison column for pairing tables
        if (isPairingTable(table)) {
            filteredHeaders.push({ name: 'Compare', key: 'compare' });
        }
        
        return filteredHeaders;
    };

    // Generate a plain-text representation of a table (headers + current filtered/sorted rows)
    const generateTableText = (table: { headers?: MixedHeader[]; rows?: Record<string, unknown>[] }, idx: number) => {
        const filteredHeaders = getFilteredHeaders(table);
        const headerNames = filteredHeaders.map(h => h.name);
        const rows = getFilteredAndSortedRows(table, idx);

        // Helper to serialize a cell value to text
        const serializeCell = (value: unknown): string => {
            if (value === null || value === undefined) return '';
            if (typeof value === 'string' || typeof value === 'number') {
                return String(value).trim();
            }
            if (typeof value === 'object') {
                const obj = value as Record<string, unknown>;
                // Crosstable cell
                if ('result' in obj) {
                    const res = String(obj.result || '').trim();
                    const w = obj.whiteOpponent ? ` W:${String(obj.whiteOpponent)}` : '';
                    const b = obj.blackOpponent ? ` B:${String(obj.blackOpponent)}` : '';
                    return `${res}${w}${b}`.trim();
                }
                // Player object shape
                const name = (obj.playerName || obj.name || obj.player) ? String(obj.playerName || obj.name || obj.player).trim() : '';
                const rating = obj.rating !== undefined && obj.rating !== '' ? ` (${String(obj.rating)})` : '';
                const title = obj.title ? String(obj.title).trim() : '';
                if (name) {
                    const titlePrefix = title ? `${title} ` : '';
                    return `${titlePrefix}${name}${rating}`.trim();
                }
                try { return JSON.stringify(obj); } catch { return String(obj); }
            }
            return String(value);
        };

        // Build matrix [ [headers], ...rows ]
        const matrix: string[][] = [];
        if (headerNames.length > 0) matrix.push(headerNames);
        rows.forEach(row => {
            const line: string[] = filteredHeaders.map(h => serializeCell((row as Record<string, unknown>)[h.key]));
            matrix.push(line);
        });

        // Compute max width per column for padding
        const colWidths: number[] = [];
        matrix.forEach(r => {
            r.forEach((cell, i) => {
                const len = (cell || '').length;
                colWidths[i] = Math.max(colWidths[i] || 0, len);
            });
        });

        // Join rows with padded columns
        const text = matrix
            .map(r => r.map((cell, i) => (cell || '').padEnd(colWidths[i] || 0, ' ')).join('  '))
            .join('\n');
        return text.trim();
    };

    const copyTableToClipboard = async (table: { headers?: MixedHeader[]; rows?: Record<string, unknown>[] }, idx: number) => {
        const text = generateTableText(table, idx);
        try {
            if (navigator && 'clipboard' in navigator && typeof navigator.clipboard.writeText === 'function') {
                await navigator.clipboard.writeText(text);
            } else {
                const ta = document.createElement('textarea');
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            }
            setCopiedTableIdx(idx);
            window.setTimeout(() => setCopiedTableIdx(null), 2000);
        } catch {
            // Fallback attempt
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            setCopiedTableIdx(idx);
            window.setTimeout(() => setCopiedTableIdx(null), 2000);
        }
    };

    const isKeyValueTable = (table: { headers?: MixedHeader[]; rows?: Record<string, unknown>[] }): boolean => {
        if (!table) return false;
        const hasNoHeaders = !table.headers || table.headers.length === 0;
        const firstRow = table.rows && table.rows.length > 0 ? table.rows[0] : null;
        const looksLikeKV = !!firstRow && Object.prototype.hasOwnProperty.call(firstRow, 'col1') && Object.prototype.hasOwnProperty.call(firstRow, 'col2');
        return hasNoHeaders && looksLikeKV;
    };

    if (!data) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading tournament data...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Data is now pre-enriched, so we can use it directly
    const currentPageData = data ? data.pages[page] : null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <TournamentMeta metadata={data.tournament.metadata} />

            <div className="mt-0">
                <TournamentMenu menu={data.menu} activePage={page} onSelectPage={handleSelectPage} />
            </div>

            {currentPageData && (
                <div className="my-8 px-2 md:px-4 py-0 md:py-8">
                    {currentPageData.pageHeading && (
                        <h2 className="text-3xl font-bold text-gray-900 mb-6 w-full text-center ">{currentPageData.pageHeading}</h2>
                    )}

                    {isPairingPage && (currentPageData.pairingScheduleText || pairingPages.length > 1) && (
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                            <div className="text-gray-700 font-bold">
                                {currentPageData.pairingScheduleText}
                            </div>
                            {pairingPages.length > 1 && (
                                <div className="flex flex-wrap gap-2 justify-end">
                                    {pairingPages.map((pairPage, idx) => (
                                        <button
                                            key={pairPage}
                                            onClick={() => handlePairingSelect(idx)}
                                            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${page === pairPage
                                                ? 'bg-blue-600 text-white shadow-lg'
                                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                                }`}
                                        >
                                            R{idx + 1}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {currentPageData.tables && currentPageData.tables.length > 0 ? (
                        <div className="space-y-8">
                            {currentPageData.tables.map((table, idx) => (
                                <div key={idx} className="space-y-4">
                                    {table.caption && (
                                        <div
                                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                                            id={
                                                typeof table.caption === "object" && table.caption.moreInfo?.anchor
                                                    ? "table-anchor-" + table.caption.moreInfo.anchor
                                                    : undefined
                                            }
                                        >
                                            {typeof table.caption === 'string' ? (
                                                <h3 className="text-lg font-semibold text-gray-900">{table.caption}</h3>
                                            ) : (
                                                // Structured player caption
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-4">
                                                        <h3 className="text-lg font-bold text-blue-800">
                                                            {typeof table.caption === 'object' && table.caption.playerName ? String(table.caption.playerName) : ''}
                                                        </h3>
                                                        {typeof table.caption === 'object' && table.caption.id && (
                                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-semibold">
                                                                ID: {String(table.caption.id)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Search Input */}
                                    {table.rows && table.rows.length > 10 && (
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Search in table..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                                            />
                                        </div>
                                    </div>)}

                                    {isKeyValueTable(table) ? (
                                        <>
                                            <KeyValueTable rows={(table.rows || []) as { col1?: unknown; col2?: unknown }[]} searchQuery={searchQuery} />
                                            {table.footer && (
                                                <div className="p-4 bg-gray-50 border border-t-0 border-gray-200 rounded-b-xl">
                                                    <div className="text-sm text-gray-600">
                                                        <div dangerouslySetInnerHTML={{ __html: table.footer.html }} />
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="overflow-hidden rounded-xl shadow-lg border border-gray-200/50 bg-white">
                                            {/* Desktop Table */}
                                            <div className="hidden lg:block overflow-x-auto">
                                                <table className="min-w-full">
                                                    <thead>
                                                        <tr className="bg-gradient-to-r from-slate-50 to-gray-100/80">
                                                            {getFilteredHeaders(table).map((header: Header, hidx: number) => (
                                                                <th
                                                                    key={hidx}
                                                                    className={`px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider cursor-pointer select-none transition-all duration-200 hover:bg-gray-200/50 ${hidx === 0 ? 'rounded-tl-xl' : ''} ${hidx === (table.headers?.length || 0) - 1 ? 'rounded-tr-xl' : ''}`}
                                                                    onClick={() => handleHeaderClick(idx, header.key)}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <span>{header.name}</span>
                                                                        {sortConfig && sortConfig.tableIdx === idx && sortConfig.key === header.key && (
                                                                            <span className="text-blue-600 font-bold text-sm">
                                                                                {sortConfig.direction === "asc" ? "↑" : "↓"}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-100">
                                                        {table.rows && table.rows.length > 0 ? (
                                                            getFilteredAndSortedRows(table, idx).map((row: Record<string, unknown>, ridx: number) => (
                                                                <tr key={ridx} className={`transition-all duration-150 hover:bg-blue-50/50 hover:shadow-sm ${ridx % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
                                                                    {getFilteredHeaders(table).map((header: Header, hidx: number) => (
                                                                        <td key={hidx} className="px-6 py-4 text-sm text-gray-900 font-medium">
                                                                            {header.key === 'compare' ? (
                                                                                // Comparison column for pairing tables
                                                                                (() => {
                                                                                    // Find white and black player columns dynamically
                                                                                    const whiteKey = Object.keys(row).find(key => 
                                                                                        key.toLowerCase().includes('white') || key.toLowerCase() === 'white' || key.toLowerCase() === 'w'
                                                                                    );
                                                                                    const blackKey = Object.keys(row).find(key => 
                                                                                        key.toLowerCase().includes('black') || key.toLowerCase() === 'black' || key.toLowerCase() === 'b'
                                                                                    );
                                                                                    
                                                                                    const whitePlayerId = whiteKey ? row[whiteKey] : null;
                                                                                    const blackPlayerId = blackKey ? row[blackKey] : null;
                                                                                    
                                                                                    const whiteFideId = (whitePlayerId && typeof whitePlayerId === 'string') ? getFideId(whitePlayerId) : null;
                                                                                    const blackFideId = (blackPlayerId && typeof blackPlayerId === 'string') ? getFideId(blackPlayerId) : null;
                                                                                    
                                                                                    if (whiteFideId && blackFideId) {
                                                                                        const compareUrl = `https://fide-compare.truongthings.dev/?id=${whiteFideId},${blackFideId}`;
                                                                                        return (
                                                                                            <a
                                                                                                href={compareUrl}
                                                                                                target="_blank"
                                                                                                rel="noopener noreferrer"
                                                                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                                                                                                title="Compare FIDE ratings"
                                                                                            >
                                                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                                                                </svg>
                                                                                                Compare
                                                                                            </a>
                                                                                        );
                                                                                    }
                                                                                    return <span className="text-gray-400 text-xs">—</span>;
                                                                                })()
                                                                            ) : (
                                                                                <PlayerRenderer
                                                                                    data={row[header.key]}
                                                                                    onPlayerClick={handlePlayerClick}
                                                                                    tournamentPath={`/${resolvedParams.tournament}`}
                                                                                    columnHeader={header.name}
                                                                                    players={data.players}
                                                                                />
                                                                            )}
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={getFilteredHeaders(table).length || 1} className="px-6 py-8 text-center text-gray-500 italic">
                                                                    <div className="flex flex-col items-center gap-2">
                                                                        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                        </svg>
                                                                        <span>{searchQuery.trim() ? 'No results found for your search' : 'No data available'}</span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                    {table.footer && (
                                                        <tfoot>
                                                            <tr>
                                                                <td colSpan={getFilteredHeaders(table).length || 1} className="px-6 py-3 text-sm text-gray-600 bg-gray-50 border-t border-gray-200">
                                                                    <div dangerouslySetInnerHTML={{ __html: table.footer.html }} />
                                                                </td>
                                                            </tr>
                                                        </tfoot>
                                                    )}
                                                </table>
                                            </div>

                                            {/* Mobile Cards */}
                                            <div className="lg:hidden">
                                                {table.rows && table.rows.length > 0 ? (
                                                    <div className="space-y-6 md:space-y-4 p-0 md:p-4">
                                                        {getFilteredAndSortedRows(table, idx).map((row: Record<string, unknown>, ridx: number) => (
                                                            <div key={ridx} className={`bg-white rounded-lg border border-gray-200 p-4 shadow-sm ${ridx % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
                                                                {getFilteredHeaders(table).map((header: Header, hidx: number) => (
                                                                    <div key={hidx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                                                                        <span className="text-sm font-medium text-gray-600 capitalize">
                                                                            {header.name}
                                                                        </span>
                                                                        <div className="text-sm text-gray-900 font-medium">
                                                                            {header.key === 'compare' ? (
                                                                                // Comparison column for pairing tables
                                                                                (() => {
                                                                                    // Find white and black player columns dynamically
                                                                                    const whiteKey = Object.keys(row).find(key => 
                                                                                        key.toLowerCase().includes('white') || key.toLowerCase() === 'white' || key.toLowerCase() === 'w'
                                                                                    );
                                                                                    const blackKey = Object.keys(row).find(key => 
                                                                                        key.toLowerCase().includes('black') || key.toLowerCase() === 'black' || key.toLowerCase() === 'b'
                                                                                    );
                                                                                    
                                                                                    const whitePlayerId = whiteKey ? row[whiteKey] : null;
                                                                                    const blackPlayerId = blackKey ? row[blackKey] : null;
                                                                                    
                                                                                    const whiteFideId = (whitePlayerId && typeof whitePlayerId === 'string') ? getFideId(whitePlayerId) : null;
                                                                                    const blackFideId = (blackPlayerId && typeof blackPlayerId === 'string') ? getFideId(blackPlayerId) : null;
                                                                                    
                                                                                    if (whiteFideId && blackFideId) {
                                                                                        const compareUrl = `https://fide-compare.truongthings.dev/?id=${whiteFideId},${blackFideId}`;
                                                                                        return (
                                                                                            <a
                                                                                                href={compareUrl}
                                                                                                target="_blank"
                                                                                                rel="noopener noreferrer"
                                                                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                                                                                                title="Compare FIDE ratings"
                                                                                            >
                                                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                                                                </svg>
                                                                                                Compare
                                                                                            </a>
                                                                                        );
                                                                                    }
                                                                                    return <span className="text-gray-400 text-xs">—</span>;
                                                                                })()
                                                                            ) : (
                                                                                <PlayerRenderer
                                                                                    data={row[header.key]}
                                                                                    onPlayerClick={handlePlayerClick}
                                                                                    tournamentPath={`/${resolvedParams.tournament}`}
                                                                                    columnHeader={header.name}
                                                                                    players={data.players}
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="p-8 text-center text-gray-500 italic">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                            <span>{searchQuery.trim() ? 'No results found for your search' : 'No data available'}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {table.footer && (
                                                <div className="lg:hidden p-4 bg-gray-50 border-t border-gray-200">
                                                    <div className="text-sm text-gray-600">
                                                        <div dangerouslySetInnerHTML={{ __html: table.footer.html }} />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex justify-end p-3 border-t border-gray-100 bg-white">
                                                <button
                                                    onClick={() => copyTableToClipboard(table, idx)}
                                                    className={`px-3 py-1.5 text-sm rounded-md border ${copiedTableIdx === idx ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'}`}
                                                >
                                                    {copiedTableIdx === idx ? 'Copied!' : 'Copy table'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-gray-500">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No tables found</h3>
                                <p className="mt-1 text-sm text-gray-500">This page doesn&apos;t contain any table data.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Player Pairing Modal */}
            <PlayerPairingModal
                isOpen={isPlayerModalOpen}
                onClose={handleClosePlayerModal}
                playerData={selectedPlayerData}
            />
        </div>
    );
}
