import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import { FaCheckCircle, FaRegClock, FaRegCalendar } from 'react-icons/fa';
import { useState } from 'react';

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
}

export default function VerticalTimelineEvents({ events }: { events: TimelineEvent[] }) {
    const [filterCategory, setFilterCategory] = useState<string | null>(null);
    const handleChipClick = (cat: string) => {
        setFilterCategory(cat);
    };
    const handleClearFilter = () => {
        setFilterCategory(null);
    };

    // Helper to determine status and icon based on period
    const getStatus = (event: TimelineEvent) => {
        switch (event.period) {
            case 'Past':
                return { color: '#28a745', icon: <FaCheckCircle /> };
            case 'Current':
                return { color: '#007bff', icon: <FaRegClock /> };
            case 'Future':
                return { color: '#6c757d', icon: <FaRegCalendar /> };
            default:
                return { color: '#6c757d', icon: <FaRegCalendar /> };
        }
    };

    // Get unique categories for filter chips
    const categories = Array.from(new Set(events.map((ev: TimelineEvent) => ev.category)));
    const years = Array.from(new Set(events.map((ev: TimelineEvent) => ev.year).filter((y): y is string => typeof y === 'string' && y.length > 0)));

    const [filterYear, setFilterYear] = useState<string | null>(null);
    const handleYearClick = (year: string) => {
        setFilterYear(year);
    };
    const handleClearYear = () => {
        setFilterYear(null);
    };

    let filteredEvents = events;
    if (filterCategory) {
        filteredEvents = filteredEvents.filter((ev: TimelineEvent) => ev.category === filterCategory);
    }
    if (filterYear) {
        filteredEvents = filteredEvents.filter((ev: TimelineEvent) => ev.year === filterYear);
    }
    const origin = window.location.origin;
    return (
        <div>
            <div className="mb-4 flex gap-2 flex-wrap justify-center">
                {/* Category chips */}
                {categories.map((cat: string) => (
                    <button
                        key={cat}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${filterCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'} transition-colors`}
                        onClick={() => handleChipClick(cat)}
                    >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                ))}
                {filterCategory && (
                    <button
                        className="px-3 py-1 rounded-full text-xs font-semibold border bg-gray-100 text-gray-800 ml-2"
                        onClick={handleClearFilter}
                    >
                        Show All
                    </button>
                )}
                {/* Year chips */}
                {years.map((year) => (
                    <button
                        key={year}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${filterYear === year ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'} transition-colors`}
                        onClick={() => handleYearClick(year)}
                    >
                        {year}
                    </button>
                ))}
                {filterYear && (
                    <button
                        className="px-3 py-1 rounded-full text-xs font-semibold border bg-gray-100 text-gray-800 ml-2"
                        onClick={handleClearYear}
                    >
                        Show All Years
                    </button>
                )}
            </div>
            <VerticalTimeline>
                {filteredEvents.map((event: TimelineEvent, idx: number) => {
                    const status = getStatus(event);
                    return (
                        <VerticalTimelineElement
                            key={idx}
                            date={event.start}
                            iconStyle={{ background: status.color, color: '#fff' }}
                            icon={status.icon}
                        >
                            <div className='p-3'>
                                <div className="mb-2 flex gap-2 flex-wrap">
                                    {/* Category chip */}
                                    <span
                                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border cursor-pointer ${filterCategory === event.category ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                                        onClick={() => handleChipClick(event.category)}
                                    >
                                        {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                                    </span>
                                    {/* Year chip */}
                                    {typeof event.year === 'string' && event.year.length > 0 && (
                                        <span
                                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border cursor-pointer ${filterYear === event.year ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                                            onClick={() => handleYearClick(event.year as string)}
                                        >
                                            {event.year}
                                        </span>
                                    )}
                                </div>
                                <h3 className="vertical-timeline-element-title text-gray-900 font-bold text-lg mb-1">{event.name}</h3>
                                <div className="mb-1 flex gap-2 flex-wrap">
                                    {event.site && (
                                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold border border-gray-300 bg-gray-50 text-gray-700">
                                            <span className="font-bold">Site:</span> {event.site}
                                        </span>
                                    )}
                                    {event.arbiter && (
                                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold border border-gray-300 bg-gray-50 text-gray-700">
                                            <span className="font-bold">Arbiter:</span> {event.arbiter}
                                        </span>
                                    )}
                                </div>
                                <div className="flex justify-end mt-2">
                                    <a
                                        href={`${origin}/${event.url}`}
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border border-blue-600 bg-white text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        View Detail
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 3h7m0 0v7m0-7L10 14" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        </VerticalTimelineElement>
                    );
                })}
            </VerticalTimeline>
        </div>
    );
}
