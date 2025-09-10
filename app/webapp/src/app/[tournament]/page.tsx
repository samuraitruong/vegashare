
import { Suspense } from 'react';
import TournamentClient from './TournamentClient';

export async function generateStaticParams() {
    // For static export, provide at least one param to satisfy Next.js requirements
    // Dynamic routes will be handled at runtime
    return [{ tournament: 'placeholder' }];
}

export default function TournamentPage({ params }: { params: Promise<{ tournament: string }> }) {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading tournament...</p>
                    </div>
                </div>
            </div>
        }>
            <TournamentClient params={params} />
        </Suspense>
    );
}