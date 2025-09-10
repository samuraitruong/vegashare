
"use client";
import { useState, useMemo } from "react";
import useTournamentData from "../../hooks/useTournamentData";
import useOrigin from "../../hooks/useOrigin";
import { TimelineEvent } from "../../types/timeline";
import Timeline from "react-calendar-timeline";
import moment from "moment";
import "react-calendar-timeline/style.css";

//
export default function CalendarClient() {
    const events = useTournamentData("./data.json") as TimelineEvent[];
    // Remove year navigation, show all events
    const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

    // 6 groups: junior/senior + ratingType
    const groups = useMemo(() => {
        const cats = Array.from(new Set(events.map((ev) => ev.splitCategory || "other-standard")));
        return cats.map((cat, idx) => ({
            id: idx + 1,
            title: cat
        }));
    }, [events]);

    const items = useMemo(() => {
        return events
            .filter((ev) => ev.StartDate)
            .map((ev: TimelineEvent, idx: number) => {
                let bgColor = "#38bdf8"; // default blue for standard
                if (ev.ratingType === "rapid") {
                    bgColor = "#fbbf24"; // amber for rapid
                } else if (ev.ratingType === "blitz") {
                    bgColor = "#ef4444"; // red for blitz
                }
                return {
                    id: idx + 1,
                    ratingType: ev.ratingType,
                    group: groups.find((g) => g.title === ev.splitCategory)?.id || 1,
                    title: ev.name,
                    start_time: moment(ev.StartDate),
                    end_time: moment(ev.EndDate || ev.StartDate),
                    bgColor,
                    site: ev.site,
                    arbiter: ev.arbiter,
                    url: ev.url,
                    category: ev.category,
                    splitCategory: ev.splitCategory
                };
            });
    }, [events, groups]);

    const origin = useOrigin();

    return (
        <div className="font-sans min-h-screen w-full h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-900">
            <h1 className="text-2xl font-bold mb-8 text-center">Tournament Timeline</h1>
            <div className="w-full flex-1 flex flex-col items-center justify-center">
                <div className="w-full h-full max-w-6xl">
                    <Timeline
                        groups={groups}
                        items={items}
                        defaultTimeStart={items.length > 0 ? items.reduce((min, item) => item.start_time.isBefore(min) ? item.start_time : min, items[0].start_time).valueOf() : moment().startOf('year').valueOf()}
                        defaultTimeEnd={items.length > 0 ? items.reduce((max, item) => item.end_time.isAfter(max) ? item.end_time : max, items[0].end_time).valueOf() : moment().endOf('year').valueOf()}
                        sidebarWidth={180}
                        lineHeight={120}
                        itemRenderer={({ item, getItemProps }) => (
                            <div {...getItemProps({ style: { background: item.bgColor, color: 'black', borderRadius: 8, boxShadow: '0 2px 8px #0002', padding: '12px 16px', minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' } })}>
                                <div className="font-bold text-blue-700 text-xs truncate">{item.title}</div>
                            </div>
                        )}
                        onItemSelect={itemId => {
                            const item = items.find(i => i.id === itemId);
                            // Find the original TimelineEvent from events for full details
                            const event = item ? events.find(ev => ev.name === item.title && ev.splitCategory === item.splitCategory) : null;
                            setSelectedEvent(event || null);
                        }}
                    />
                </div>
                {selectedEvent && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white rounded-lg shadow-lg max-w-xl w-full p-6 relative">
                            <button
                                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold"
                                onClick={() => setSelectedEvent(null)}
                                aria-label="Close"
                            >
                                &times;
                            </button>
                            <h2 className="text-2xl font-extrabold mb-6 text-center text-blue-700">
                                {selectedEvent.title}
                            </h2>
                            <div className="space-y-3">
                                <h2 className="text-center text-bold text-3xl">{selectedEvent.name}</h2>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-gray-600">Category</span>
                                    <span>{selectedEvent.category ? selectedEvent.category.charAt(0).toUpperCase() + selectedEvent.category.slice(1) : ""}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-gray-600">Rating Type</span>
                                    <span className="capitalize">{selectedEvent.ratingType || "Standard"}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-gray-600">Site</span>
                                    <span>{selectedEvent.site || "N/A"}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-gray-600">Start</span>
                                    <span>{selectedEvent.StartDate ? moment(selectedEvent.StartDate).format("YYYY-MM-DD") : "N/A"}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-gray-600">End</span>
                                    <span>{selectedEvent.EndDate ? moment(selectedEvent.EndDate).format("YYYY-MM-DD") : "N/A"}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-gray-600">Arbiter</span>
                                    <span>{selectedEvent.arbiter || "N/A"}</span>
                                </div>
                                {selectedEvent.url && (
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-gray-600">Link</span>
                                        <a
                                            href={`${origin}/${selectedEvent.url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 underline text-sm"
                                        >
                                            View Detail
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

}