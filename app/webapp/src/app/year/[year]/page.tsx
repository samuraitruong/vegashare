


import YearTimelineClient from './YearTimelineClient';

export default async function YearTimelinePage({ params }: { params: Promise<{ year: string }> }) {
    const { year } = await params;

    const yearValue = typeof year === 'string' ? year : Array.isArray(year) ? year[0] : '';
    return <YearTimelineClient year={yearValue} />;
}

export function generateStaticParams() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear; y >= 2022; y--) {
        years.push({ year: y.toString() });
    }
    return years;
}