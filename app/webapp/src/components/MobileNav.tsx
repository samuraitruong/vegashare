"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onRoute = () => setOpen(false);
    // Close on escape
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="md:hidden">
      <button
        aria-label="Toggle navigation menu"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <svg
          className={`h-6 w-6 transition-transform ${open ? "rotate-90" : "rotate-0"}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[64px] z-40 bg-white border-t border-gray-200 shadow-md">
          <nav className="px-4 py-3 space-y-2">
            <Link
              href="/"
              className="block w-full px-3 py-2 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium"
              onClick={() => setOpen(false)}
            >
              Tournaments
            </Link>
            
          </nav>
        </div>
      )}
    </div>
  );
}
