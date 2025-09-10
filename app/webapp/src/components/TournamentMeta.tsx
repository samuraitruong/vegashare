import React from "react";

interface TournamentMetaProps {
    metadata: {
        name?: string;
        startDate?: string;
        endDate?: string;
        location?: string;
        [key: string]: unknown;
    };
}

const TournamentMeta: React.FC<TournamentMetaProps> = ({ metadata }) => {
    if (!metadata) return null;

    // Map legacy keys to hero panel fields
    const name = String(metadata["Tournament Name"] || '');
    const startDate = String(metadata["Date Begin"] || '');
    const endDate = String(metadata["Date End"] || '');
    const location = String(metadata["Place"] || '');
    const federation = String(metadata["Federation"] || '');
    const arbiter = String(metadata["Arbiter(s)"] || '');

    // Format date range
    const dateRange = startDate && endDate ? `${startDate} - ${endDate}` : startDate || endDate;

    return (
        <section className="relative w-full bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-800 text-white shadow-2xl">
            {/* Decorative top border */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"></div>

            <div className="px-4 md:px-6 py-8 md:py-12">
                {/* Tournament Title - Row 1 */}
                {name && (
                    <div className="text-center mb-6">
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-2 tracking-tight">
                            {name}
                        </h1>
                        <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto rounded-full"></div>
                    </div>
                )}

                {/* Location - Row 2 */}
                {location && (
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
                            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xl md:text-2xl font-semibold text-white">
                                {location}
                                {federation && <span className="text-yellow-300 ml-2">({federation})</span>}
                            </span>
                        </div>
                    </div>
                )}

                {/* Date Range - Row 3 */}
                {dateRange && (
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
                            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-lg md:text-xl font-semibold text-white">
                                {dateRange}
                            </span>
                        </div>
                    </div>
                )}

                {/* Additional Information - Row 4 */}
                {arbiter && (
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 text-blue-200">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium">
                                Arbiter: {arbiter}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Decorative elements */}
            <div className="absolute top-4 right-4 w-20 h-20 bg-white/5 rounded-full blur-xl"></div>
            <div className="absolute bottom-4 left-4 w-16 h-16 bg-yellow-400/10 rounded-full blur-lg"></div>
            <div className="absolute top-1/2 left-8 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <div className="absolute top-1/3 right-12 w-1 h-1 bg-white rounded-full animate-pulse"></div>
        </section>
    );
};

export default TournamentMeta;
