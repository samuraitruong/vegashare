import { useEffect, useState } from 'react';
import { TimelineEvent, Period } from '../types/timeline';

function parseDate(dateStr?: string): Date | undefined {
    if (!dateStr) return undefined;
    const [dd, mm, yyyy] = dateStr.split('/');
    if (!dd || !mm || !yyyy) return undefined;
    return new Date(`${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`);
}

export default function useTournamentData(jsonUrl: string, year?: string) {
    const [events, setEvents] = useState<TimelineEvent[]>([]);

    useEffect(() => {
        fetch(jsonUrl)
            .then(res => res.json())
            .then((data: Array<Omit<TimelineEvent, 'StartDate' | 'EndDate' | 'period'> & Partial<Pick<TimelineEvent, 'StartDate' | 'EndDate' | 'period'>>>) => {
                let mapped = data.map(ev => {
                    const StartDate = parseDate(ev.start);
                    const EndDate = parseDate(ev.end);
                    const now = new Date();
                    let period: Period = 'Future';
                    if (StartDate && EndDate) {
                        if (now > EndDate) {
                            period = 'Past';
                        } else if (now >= StartDate && now <= EndDate) {
                            period = 'Current';
                        } else if (now < StartDate) {
                            period = 'Future';
                        }
                    } else if (StartDate) {
                        period = now > StartDate ? 'Past' : 'Future';
                    }
                    // Add ratingType field based on event name
                    let ratingType: 'standard' | 'rapid' | 'blitz' = 'standard';
                    const nameLower = (ev.name || ev.title || '').toLowerCase();
                    if (nameLower.includes('rapid')) {
                        ratingType = 'rapid';
                    } else if (nameLower.includes('blitz')) {
                        ratingType = 'blitz';
                    }
                    // Split into 6 categories: junior/senior + ratingType
                    let splitCategory = '';
                    const cat = (ev.category || '').toLowerCase();
                    if (cat === 'junior') {
                        splitCategory = `junior-${ratingType}`;
                    } else {
                        splitCategory = `senior-${ratingType}`;
                    }
                    return {
                        ...ev,
                        start: ev.start,
                        end: ev.end,
                        name: ev.name || ev.title,
                        url: ev.url,
                        path: ev.path,
                        StartDate,
                        EndDate,
                        period,
                        ratingType,
                        splitCategory,
                    };
                });
                if (year) {
                    mapped = mapped.filter(ev => ev.year === year);
                }
                mapped = mapped.sort((a, b) => {
                    if (!a.StartDate && !b.StartDate) return 0;
                    if (!a.StartDate) return 1;
                    if (!b.StartDate) return -1;
                    return b.StartDate.getTime() - a.StartDate.getTime();
                });
                setEvents(mapped);
            });
    }, [jsonUrl, year]);

    return events;
}
