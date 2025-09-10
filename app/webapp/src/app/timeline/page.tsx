
"use client";
import dynamic from 'next/dynamic';
import useTournamentData from '../../hooks/useTournamentData';

const VerticalTimelineEvents = dynamic(() => import('../../components/VerticalTimelineEvents'), { ssr: false });

export default function Home() {
  const events = useTournamentData('./data.json');

  return (
    <div className="font-sans min-h-screen pb-20">
      <VerticalTimelineEvents events={events} />
    </div>
  );
}
