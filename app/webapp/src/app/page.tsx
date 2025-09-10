"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import HomeHero from "@/components/HomeHero";
import FilterTabs from "@/components/FilterTabs";
import { createClient } from "@libsql/client/web";

type TournamentMeta = {
  [key: string]: string;
};
type Tournament = {
  data: TournamentMeta;
  path: string;
  category: string;
  status?: string;
};
// Removed getYear; no longer filtering by year

const CATEGORY_OPTIONS = ["All", "Completed", "In Progress", "Planned"];

export default function Home() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeOption, setActiveOption] = useState<string>("All");
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(18);
  const [total, setTotal] = useState<number>(0);
  // const [menuOpen, setMenuOpen] = useState(false); // Unused for now

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      const url = process.env.NEXT_PUBLIC_TURSO_DATABASE_URL as string | undefined;
      const authToken = process.env.NEXT_PUBLIC_TURSO_AUTH_TOKEN as string | undefined;
      if (!url || !authToken) {
        console.warn("Missing NEXT_PUBLIC_TURSO_DATABASE_URL/NEXT_PUBLIC_TURSO_AUTH_TOKEN envs");
        setTournaments([]);
        setTotal(0);
        return;
      }
      const db = createClient({ url, authToken });
      const offset = (page - 1) * pageSize;
      const totalRes = await db.execute(`SELECT COUNT(*) as c FROM tournament`);
      const totalCount = Number((totalRes.rows?.[0] as any)?.c ?? 0);
      setTotal(totalCount);
      const res = await db.execute({
        sql: `SELECT id, name, start_date, end_date, rounds, arbiter, location, folder_path, federation, created_at
              FROM tournament
              ORDER BY datetime(created_at) DESC
              LIMIT ? OFFSET ?`,
        args: [pageSize, offset]
      });
      const list = (res.rows || []).map((r: any) => {
        const data: TournamentMeta = {
          'Tournament Name': String(r.name ?? ''),
          'Date Begin': String(r.start_date ?? ''),
          'Date End': String(r.end_date ?? ''),
          'Arbiter(s)': String(r.arbiter ?? ''),
          'Place': String(r.location ?? ''),
          'Rounds': String(r.rounds ?? ''),
          'Federation': String(r.federation ?? '')
        };
        return {
          id: r.id,
          name: r.name,
          category: '',
          createdAt: r.created_at,
          data,
          path: `www/${r.folder_path || ''}/data.json`
        };
      });
      const now = new Date();
      const withStatus = list.map((t) => {
        const startDateStr = t.data["Date Begin"] || t.data["Date"] || "";
        const endDateStr = t.data["Date End"] || t.data["End Date"] || "";
        const beginDateObj = parseAusDate(startDateStr);
        const endDateObj = parseAusDate(endDateStr);
        let status = "Completed";
        if (endDateObj.getTime() < now.getTime()) {
          status = "Completed";
        } else if (beginDateObj.getTime() > now.getTime()) {
          status = "Planned";
        } else {
          status = "In Progress";
        }
        return { ...t, status } as Tournament;
      });
      setTournaments(withStatus);
    };
    load();
    return () => controller.abort();
  }, [page, pageSize]);

  // Sort tournaments by Date End descending
  // Helper to parse Australian date format DD/MM/YYYY
  function parseAusDate(dateStr: string): Date {
    if (!dateStr) return new Date(0);
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      // DD/MM/YYYY
      const [day, month, year] = parts.map(Number);
      return new Date(year, month - 1, day);
    }
    // fallback to default parsing
    return new Date(dateStr);
  }

  const filtered = useMemo(() => {
    const sorted = [...tournaments].sort((a, b) => {
      const endA = a.data["Date End"] || a.data["End Date"] || "";
      const endB = b.data["Date End"] || b.data["End Date"] || "";
      const dA = parseAusDate(endA);
      const dB = parseAusDate(endB);
      return dB.getTime() - dA.getTime();
    });
    return sorted.filter((t) => {
      if (activeOption === "All") return true;
      return t.status === activeOption;
    });
  }, [tournaments, activeOption]);

  // Pagination for years removed; no year-based navigation currently

  return (
    <div className="font-sans min-h-screen bg-gradient-to-br from-blue-50 to-blue-200">
      {/* Hero section for home page */}
      <HomeHero />

      {/* Main content wrapper with white background */}
      <div className="bg-white min-h-screen">
        {/* Status Filter Tabs */}
        <FilterTabs
          options={CATEGORY_OPTIONS}
          activeOption={activeOption}
          onOptionChange={setActiveOption}
        />

        {/* Tournament Cards */}
        <div className="px-2 py-8 md:px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {filtered.length === 0 && (
              <div className="col-span-full text-center text-gray-500">No tournaments found for selected filters.</div>
            )}
            {filtered.map((t, idx) => {
              const title = t.data["Tournament Name"] || t.data["Place"] || "Untitled";
              const date = t.data["Date Begin"] || t.data["Date"] || "";
              const endDate = t.data["Date End"] || t.data["End Date"] || "";
              const site = t.data["Site"] || t.data["Place"] || "";
              const slug = t.path.replace(/^www/, "").replace(/\/data\.json$/, "");
              // Use the same parseAusDate helper
              const beginDateObj = parseAusDate(date);
              const endDateObj = parseAusDate(endDate);
              const now = new Date();
              let cardClass = "block bg-white rounded-xl shadow-lg hover:shadow-2xl transition border border-blue-100 p-6 text-center group";
              let status = "Completed";
              let statusClass = "bg-gray-300 text-gray-800";
              // Future tournament: begin date > now
              if (beginDateObj.getTime() > now.getTime()) {
                cardClass += " bg-gray-100";
                status = "Planned";
                statusClass = "bg-gray-200 text-gray-700";
              }
              // In-progress: now between begin and end
              else if (beginDateObj.getTime() <= now.getTime() && endDateObj.getTime() >= now.getTime()) {
                cardClass += " border-green-500";
                status = "In Progress";
                statusClass = "bg-green-200 text-green-800";
              }
              // If completed, go to standings page
              const linkUrl = status === "Completed" ? `/${slug}?page=standings.html` : `/${slug}`;
              return (
                <Link
                  key={idx}
                  href={linkUrl}
                  className={cardClass}
                >
                  <div className="mb-2 text-lg font-bold text-blue-800 group-hover:text-blue-600">{title}</div>
                  <div className="mb-1 text-sm text-gray-500">{date}</div>
                  {site && <div className="mb-1 text-xs text-gray-400 italic">Site: {site}</div>}
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}>{status}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Pagination */}
        <div className="px-4 pb-8">
          <div className="flex items-center justify-center gap-3 pt-8 border-t border-gray-100">
            <button
              className="px-3 py-2 rounded border bg-gray-50 text-blue-700 font-semibold shadow-sm disabled:opacity-50 hover:bg-gray-100 transition-colors"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              &larr; Prev
            </button>
            <span className="text-sm text-gray-600">Page {page} of {Math.max(1, Math.ceil(total / pageSize))}</span>
            <button
              className="px-3 py-2 rounded border bg-gray-50 text-blue-700 font-semibold shadow-sm disabled:opacity-50 hover:bg-gray-100 transition-colors"
              disabled={page >= Math.ceil(total / pageSize)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next &rarr;
            </button>
          </div>
        </div>
      </div>
     

    </div>
  );
}
