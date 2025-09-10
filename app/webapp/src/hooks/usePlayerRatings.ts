import { useEffect, useState } from "react";

export type PlayerRatingRow = {
    date_2: string;
    id_number: string;
    rating: number | null;
    period_games: number | null;
    rapid_rtng: number | null;
    rapid_games: number | null;
    blitz_rtng: number | null;
    blitz_games: number | null;
    name: string;
    country: string;
};

export type PlayerRatingData = PlayerRatingRow[];

export async function fetchPlayerRatings(id: string): Promise<PlayerRatingData> {
    if (!id) return [];
    const url = `https://ratings.fide.com/a_chart_data.phtml?event=${id}&period=0`;
    const proxyUrl = `https://no-cors.fly.dev/cors/${url}`;
    try {
        const res = await fetch(proxyUrl, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
        if (!res.ok) return [];
        const json = await res.json();
        if (Array.isArray(json) && json.length && typeof json[0] === 'object') {
            return json.map((row: Record<string, unknown>) => {
                let normalizedDate = typeof row.date_2 === 'string' ? row.date_2 : '';
                if (normalizedDate) {
                    const match = normalizedDate.match(/^([0-9]{4})-(\w{3})$/);
                    if (match) {
                        const monthMap: { [key: string]: string } = {
                            Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
                            Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12"
                        };
                        const month = monthMap[match[2]] || "01";
                        normalizedDate = `${match[1]}-${month}`;
                    } else if (/^[0-9]{4}$/.test(normalizedDate)) {
                        normalizedDate = `${normalizedDate}-01`;
                    }
                }
                return {
                    date_2: normalizedDate,
                    id_number: typeof row.id_number === 'string' ? row.id_number : '',
                    rating: row.rating !== null ? Number(row.rating) : null,
                    period_games: row.period_games !== null ? Number(row.period_games) : null,
                    rapid_rtng: row.rapid_rtng !== null ? Number(row.rapid_rtng) : null,
                    rapid_games: row.rapid_games !== null ? Number(row.rapid_games) : null,
                    blitz_rtng: row.blitz_rtng !== null ? Number(row.blitz_rtng) : null,
                    blitz_games: row.blitz_games !== null ? Number(row.blitz_games) : null,
                    name: typeof row.name === 'string' ? row.name : '',
                    country: typeof row.country === 'string' ? row.country : '',
                };
            });
        } else {
            return [];
        }
    } catch {
        return [];
    }
}

export function usePlayerRatings(id: string): PlayerRatingData {
    const [data, setData] = useState<PlayerRatingData>([]);
    useEffect(() => {
        if (!id) return;
        const url = `https://ratings.fide.com/a_chart_data.phtml?event=${id}&period=0`;
        const proxyUrl = `https://no-cors.fly.dev/cors/${url}`;
        fetch(proxyUrl, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
            .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch'))
            .then(json => {
                if (Array.isArray(json) && json.length && typeof json[0] === 'object') {
                    setData(json.map((row: Record<string, unknown>) => {
                        let normalizedDate = typeof row.date_2 === 'string' ? row.date_2 : '';
                        if (normalizedDate) {
                            const match = normalizedDate.match(/^([0-9]{4})-(\w{3})$/);
                            if (match) {
                                const monthMap: { [key: string]: string } = {
                                    Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
                                    Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12"
                                };
                                const month = monthMap[match[2]] || "01";
                                normalizedDate = `${match[1]}-${month}`;
                            } else if (/^[0-9]{4}$/.test(normalizedDate)) {
                                normalizedDate = `${normalizedDate}-01`;
                            }
                        }
                        return {
                            date_2: normalizedDate,
                            id_number: typeof row.id_number === 'string' ? row.id_number : '',
                            rating: row.rating !== null ? Number(row.rating) : null,
                            period_games: row.period_games !== null ? Number(row.period_games) : null,
                            rapid_rtng: row.rapid_rtng !== null ? Number(row.rapid_rtng) : null,
                            rapid_games: row.rapid_games !== null ? Number(row.rapid_games) : null,
                            blitz_rtng: row.blitz_rtng !== null ? Number(row.blitz_rtng) : null,
                            blitz_games: row.blitz_games !== null ? Number(row.blitz_games) : null,
                            name: typeof row.name === 'string' ? row.name : '',
                            country: typeof row.country === 'string' ? row.country : '',
                        };
                    }));
                } else {
                    setData([]);
                }
            })
            .catch(() => setData([]));
    }, [id]);
    return data;
}
