export type Period = 'Past' | 'Current' | 'Future';
export interface TimelineEvent {
    title: string;
    start: string;
    end?: string;
    name: string;
    url: string;
    path?: string;
    StartDate?: Date;
    EndDate?: Date;
    period: Period;
    category: string;
    year?: string;
    site?: string;
    arbiter?: string;
    ratingType?: 'standard' | 'rapid' | 'blitz';
    splitCategory?: string;
}
