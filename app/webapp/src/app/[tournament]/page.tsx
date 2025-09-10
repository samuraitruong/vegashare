
import fs from 'fs';
import path from 'path';
import { Suspense } from 'react';
import TournamentClient from './TournamentClient';

export function generateStaticParams() {
    try {
        // Path to the tournament.json file (relative to the timeline directory)
        const tournamentJsonPath = path.join(process.cwd(), '..', 'www', 'tournament.json');
        
        if (!fs.existsSync(tournamentJsonPath)) {
            console.warn('tournament.json not found, returning empty params');
            return [];
        }
        
        const tournamentData = JSON.parse(fs.readFileSync(tournamentJsonPath, 'utf-8'));
        
        // Extract tournament names from paths
        const params = tournamentData.map((tournament: { path: string }) => {
            // Extract the tournament name from the path
            // Example: "www2025HobsonsBayAprilBlitz/data.json" -> "2025HobsonsBayAprilBlitz"
            const pathParts = tournament.path.split('/');
            const folderName = pathParts[0]; // "www2025HobsonsBayAprilBlitz"
            
            // Remove "www" prefix
            const tournamentName = folderName.replace(/^www/, '');
            
            return {
                tournament: tournamentName
            };
        });
        
        console.log(`Generated ${params.length} static params for tournaments`);
        return params;
        
    } catch (error) {
        console.error('Error generating static params:', error);
        return [];
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