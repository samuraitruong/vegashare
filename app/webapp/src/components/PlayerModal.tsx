"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Player } from "@/utils/ratingLoader";
import { FaIdCard, FaTransgender, FaBirthdayCake, FaChessBoard, FaTachometerAlt, FaBolt, FaAward, FaClock, FaUser } from "react-icons/fa";
import { usePlayerRatings } from "@/hooks/usePlayerRatings";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

interface PlayerModalProps {
  player: Player;
  onClose: () => void;
}

type MetricKey = "standard" | "rapid" | "blitz";

export default function PlayerModal({ player, onClose }: PlayerModalProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const birthYear = player.birthYear ?? null;
  const age = birthYear ? new Date().getFullYear() - birthYear : null;

  const [metric, setMetric] = useState<MetricKey>("standard");
  const ratings = usePlayerRatings(player.fideId || "");

  const hasAnyRatings = ratings && ratings.length > 0;

  const chartRows = useMemo(() => {
    if (!hasAnyRatings) return [] as { date: string; standard: number | null; rapid: number | null; blitz: number | null }[];
    return ratings.map((r) => ({
      date: r.date_2 || "",
      standard: r.rating,
      rapid: r.rapid_rtng,
      blitz: r.blitz_rtng,
    }));
  }, [ratings, hasAnyRatings]);

  // Calculate total points for each rating type
  const totalPoints = useMemo(() => {
    if (!player.tournaments || player.tournaments.length === 0) {
      return { standard: 0, rapid: 0, blitz: 0 };
    }

    return player.tournaments.reduce((acc, tournament) => {
      acc[tournament.ratingType] += tournament.score;
      return acc;
    }, { standard: 0, rapid: 0, blitz: 0 });
  }, [player.tournaments]);

  // Get rating types in fixed order: Standard, Rapid, Blitz
  const ratingTypes = useMemo(() => {
    return [
      { type: 'standard' as const, points: totalPoints.standard, icon: FaChessBoard, color: 'blue' },
      { type: 'rapid' as const, points: totalPoints.rapid, icon: FaTachometerAlt, color: 'green' },
      { type: 'blitz' as const, points: totalPoints.blitz, icon: FaBolt, color: 'orange' }
    ];
  }, [totalPoints]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative pb-5 z-10 w-[96%] max-w-5xl rounded-2xl bg-white shadow-2xl border border-gray-200 my-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center text-indigo-700 shadow-inner">
              <FaUser />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {player.fideId ? (
                  <a
                    href={`https://ratings.fide.com/profile/${player.fideId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 hover:underline transition-colors"
                  >
                    {player.name}
                  </a>
                ) : (
                  player.name
                )}
                {player.title && (
                  <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                    {player.title}
                  </span>
                )}
              </h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600 mt-1">
                <span className="inline-flex items-center gap-1"><FaTransgender className="opacity-70" /> {player.gender ? player.gender : "Unspecified"}</span>
                {age !== null && (
                  <span className="inline-flex items-center gap-1"><FaBirthdayCake className="opacity-70" /> Age {age}</span>
                )}
                {birthYear && (
                  <span className="inline-flex items-center gap-1"><FaIdCard className="opacity-70" /> YOB {birthYear}</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="inline-flex items-center justify-center h-9 w-9 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 cursor-pointer group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5 group-hover:rotate-90 transition-transform duration-200">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-3 md:p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            
            <div className="mt-1 md:mt-4 text-sm">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <div className="inline-flex items-center gap-2">
                  <span className="text-gray-600 inline-flex items-center gap-1"><FaIdCard className="opacity-70" /> FIDE:</span>
                  {player.fideId ? (
                    <a
                      href={`https://ratings.fide.com/profile/${player.fideId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {player.fideId}
                    </a>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </div>
                <div className="inline-flex items-center gap-2">
                  <span className="text-gray-600 inline-flex items-center gap-1"><FaIdCard className="opacity-70" /> ACF:</span>
                  {player.acfId ? (
                    <span className="text-gray-800">{player.acfId}</span>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </div>
              </div>
            </div>

            {/* Rating Type Points */}
            {ratingTypes.some(rt => rt.points > 0) && (
              <div className="mt-4 space-y-2 text-sm">
                <div className="text-gray-500 font-medium">Total Points</div>
                <div className="flex gap-2">
                  {ratingTypes.map((ratingType) => {
                    const IconComponent = ratingType.icon;
                    const colorClasses: Record<string, string> = {
                      blue: 'bg-blue-100 text-blue-700 border-blue-200',
                      green: 'bg-green-100 text-green-700 border-green-200',
                      orange: 'bg-orange-100 text-orange-700 border-orange-200'
                    };
                    
                    return (
                      <div
                        key={ratingType.type}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border font-semibold text-sm flex-1 ${
                          colorClasses[ratingType.color]
                        }`}
                      >
                        <IconComponent className="opacity-80" />
                        <div className="text-center flex-1">
                          <div className="font-bold text-base">
                            {ratingType.points}
                          </div>
                          <div className="text-xs opacity-75">
                            pts
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tournament Participation */}
            {player.tournaments && player.tournaments.length > 0 && (
              <div className="mt-4 space-y-2 text-sm">
                <div className="text-gray-500 font-medium">Tournaments</div>
                  <div className="space-y-2">
                    {player.tournaments.slice(0, 5).map((tournament, index) => (
                      <div key={index} className="flex items-start justify-between p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex-1 mr-3">
                          <div className="text-gray-800 font-medium text-sm leading-tight">
                            {tournament.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {tournament.totalRounds} rounds
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            tournament.ratingType === 'blitz' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                            tournament.ratingType === 'rapid' ? 'bg-green-100 text-green-700 border border-green-200' :
                            'bg-blue-100 text-blue-700 border border-blue-200'
                          }`}>
                            {tournament.ratingType}
                          </span>
                          <div className="text-center">
                            <div className="text-sm font-bold text-gray-900">
                              {tournament.score}
                            </div>
                            <div className="text-xs text-gray-500">
                              pts
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {player.tournaments.length > 5 && (
                      <div className="text-xs text-gray-500 italic text-center py-2 bg-gray-50 rounded-lg border border-gray-100">
                        +{player.tournaments.length - 5} more tournaments
                      </div>
                    )}
                  </div>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-gray-100 p-4 bg-gray-50">
                <div className="text-xs uppercase tracking-wider text-gray-500 mb-2 inline-flex items-center gap-2">
                  <FaChessBoard />
                  <span className="hidden sm:inline">Fide Ratings</span>
                  <span className="sm:hidden">Standard</span>
                </div>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-gray-700"><FaChessBoard className="opacity-70" /> <span className="hidden sm:inline">Standard</span><span className="sm:hidden">Standard</span></span>
                    <span className="font-semibold text-gray-900">{player.fideStandard || 0}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-gray-700"><FaTachometerAlt className="opacity-70" /> <span className="hidden sm:inline">Rapid</span><span className="sm:hidden">Rapid</span></span>
                    <span className="font-semibold text-gray-900">{player.fideRapid || 0}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-gray-700"><FaBolt className="opacity-70" /> <span className="hidden sm:inline">Blitz</span><span className="sm:hidden">Blitz</span></span>
                    <span className="font-semibold text-gray-900">{player.fideBlitz || 0}</span>
                  </li>
                </ul>
              </div>
              <div className="rounded-lg border border-gray-100 p-4 bg-gray-50">
                <div className="text-xs uppercase tracking-wider text-gray-500 mb-2 inline-flex items-center gap-2">
                  <FaAward />
                  <span className="hidden sm:inline">ACF Ratings</span>
                  <span className="sm:hidden">Classic</span>
                </div>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-gray-700"><FaAward className="opacity-70" /> <span className="hidden sm:inline">ACF Classic</span><span className="sm:hidden">Classic</span></span>
                    <span className="font-semibold text-gray-900">{player.acfClassic || 0}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-gray-700"><FaClock className="opacity-70" /> <span className="hidden sm:inline">ACF Quick</span><span className="sm:hidden">Quick</span></span>
                    <span className="font-semibold text-gray-900">{player.acfQuick || 0}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="hidden sm:block text-sm font-semibold text-gray-700">Rating Progress</div>
                  <div className="flex gap-2  justify-end md:justify-start w-full md:w-auto ">
                    <button
                      type="button"
                      onClick={() => setMetric("standard")}
                      className={`px-3 py-1.5 rounded-md text-sm inline-flex items-center gap-2 ${metric === "standard" ? "bg-blue-600 text-white" : "bg-white text-gray-700 border"}`}
                    >
                      <FaChessBoard /> <span className="hidden sm:inline">Standard</span><span className="sm:hidden">Std</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMetric("rapid")}
                      className={`px-3 py-1.5 rounded-md text-sm inline-flex items-center gap-2 ${metric === "rapid" ? "bg-blue-600 text-white" : "bg-white text-gray-700 border"}`}
                    >
                      <FaTachometerAlt /> <span className="hidden sm:inline">Rapid</span><span className="sm:hidden">Rap</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMetric("blitz")}
                      className={`px-3 py-1.5 rounded-md text-sm inline-flex items-center gap-2 ${metric === "blitz" ? "bg-blue-600 text-white" : "bg-white text-gray-700 border"}`}
                    >
                      <FaBolt /> <span className="hidden sm:inline">Blitz</span><span className="sm:hidden">Blz</span>
                    </button>
                  </div>
              </div>
              <div className="p-4 pb-8 sm:pb-4">
                {!player.fideId && (
                  <div className="text-sm text-gray-500">No FIDE ID available. Rating progress is unavailable.</div>
                )}
                {player.fideId && !hasAnyRatings && (
                  <div className="text-sm text-gray-500">No rating history found.</div>
                )}
                {player.fideId && hasAnyRatings && (
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartRows} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} minTickGap={24} />
                        <YAxis allowDecimals={false} domain={["dataMin - 20", "dataMax + 20"]} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        {metric === "standard" && (
                          <Line type="monotone" dataKey="standard" name="FIDE Standard" stroke="#2563eb" strokeWidth={2} dot={false} />
                        )}
                        {metric === "rapid" && (
                          <Line type="monotone" dataKey="rapid" name="FIDE Rapid" stroke="#16a34a" strokeWidth={2} dot={false} />
                        )}
                        {metric === "blitz" && (
                          <Line type="monotone" dataKey="blitz" name="FIDE Blitz" stroke="#f59e0b" strokeWidth={2} dot={false} />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-5 pb-5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
