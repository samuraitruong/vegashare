import React from "react";
import Link from "next/link";

const HomeHero: React.FC = () => {
    return (
        <section className="relative w-full bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-800 text-white shadow-2xl py-2 md:pb-3">
            {/* Decorative top border */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"></div>

            <div className="px-4 md:px-6 py-8 md:py-16">
                {/* Club Title */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight">
                            Current & Archived Tournaments
                        </h1>
                    </div>
                    <div className="w-32 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto rounded-full"></div>
                </div>

                {/* Tournaments subtitle */}
                <div className="text-center">

                    <p className="text-lg text-blue-100 max-w-2xl mx-auto">
                        Explore our comprehensive collection of chess tournaments and championship results
                    </p>
                </div>

                {/* Navigation */}
                <div className="text-center mt-8">
                    <Link
                        href="/timeline"
                        className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-full border border-white/20 hover:bg-white/20 transition-all duration-200 font-medium"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        View Timeline
                    </Link>
                </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-4 right-4 w-20 h-20 bg-white/5 rounded-full blur-xl"></div>
            <div className="absolute bottom-4 left-4 w-16 h-16 bg-yellow-400/10 rounded-full blur-lg"></div>
            <div className="absolute top-1/2 left-8 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <div className="absolute top-1/3 right-12 w-1 h-1 bg-white rounded-full animate-pulse"></div>
        </section>
    );
};

export default HomeHero;
