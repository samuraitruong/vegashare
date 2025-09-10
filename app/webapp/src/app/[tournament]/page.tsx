
import { Suspense } from 'react';
import { createClient } from '@libsql/client';
import TournamentClient from './TournamentClient';

export async function generateStaticParams() {
    try {
        const url = process.env.NEXT_PUBLIC_TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL;
        const authToken = process.env.NEXT_PUBLIC_TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN;
        
        if (!url || !authToken) {
            console.warn('Missing Turso credentials for generateStaticParams, using placeholder');
            return [{ tournament: 'placeholder' }];
        }

        const db = createClient({ url, authToken });
        const res = await db.execute({
            sql: `SELECT folder_path FROM tournament WHERE folder_path IS NOT NULL AND folder_path != ''`,
            args: []
        });

        const tournaments = (res.rows || []).map((row: unknown) => {
            const r = row as { folder_path: string };
            return { tournament: r.folder_path.replace(/^www\//, "") };
        });

        console.log(`Generated ${tournaments.length} static params for tournaments`);
        
        // If no tournaments found, return placeholder to satisfy Next.js requirements
        if (tournaments.length === 0) {
            return [{ tournament: 'placeholder' }];
        }
        
        return tournaments;
    } catch (error) {
        console.error('Error generating static params from database:', error);
        // Fallback to placeholder if database query fails
        return [{ tournament: 'placeholder' }];
    }
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