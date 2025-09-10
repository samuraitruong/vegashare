"use client";
import React from "react";

type KeyValueRow = {
	col1?: unknown;
	col2?: unknown;
};

export default function KeyValueTable({ rows, searchQuery }: { rows: KeyValueRow[]; searchQuery: string }) {
	const normalize = (v: unknown) => (v === null || v === undefined ? "" : String(v));
	const query = searchQuery.trim().toLowerCase();
	const filtered = query
		? rows.filter((r) => {
			const k = normalize(r.col1).toLowerCase();
			const v = normalize(r.col2).toLowerCase();
			return k.includes(query) || v.includes(query);
		})
		: rows;

	if (!filtered || filtered.length === 0) {
		return (
			<div className="overflow-hidden rounded-xl shadow-lg border border-gray-200/50 bg-white">
				<div className="p-8 text-center text-gray-500 italic">
					<div className="flex flex-col items-center gap-2">
						<svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
						<span>{query ? "No results found for your search" : "No data available"}</span>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="overflow-hidden rounded-xl shadow-lg border border-gray-200/50 bg-white">
			{/* Desktop */}
			<div className="hidden lg:block overflow-x-auto">
				<table className="min-w-full">
					<tbody className="bg-white divide-y divide-gray-100">
						{filtered.map((row, idx) => (
							<tr key={idx} className={`transition-all duration-150 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
								<th className="px-6 py-4 text-sm font-semibold text-gray-700 text-left align-top w-1/3">
									{normalize(row.col1)}
								</th>
								<td className="px-6 py-4 text-sm text-gray-900 font-medium">
									{normalize(row.col2)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Mobile */}
			<div className="lg:hidden">
				<div className="space-y-3 p-4">
					{filtered.map((row, idx) => (
						<div key={idx} className={`bg-white rounded-lg border border-gray-200 p-4 shadow-sm ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
							<div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{normalize(row.col1)}</div>
							<div className="text-sm text-gray-900 font-medium mt-1">{normalize(row.col2)}</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}


