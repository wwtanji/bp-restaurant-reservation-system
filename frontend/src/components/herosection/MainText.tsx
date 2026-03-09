import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PARTY_SIZES,
  TIME_OPTIONS,
  todayISO,
  formatDate,
} from '../../constants/reservation';

export default function MainText() {
  const navigate = useNavigate();
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState('7:00 PM');
  const [partySize, setPartySize] = useState('2 people');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="border-b border-ot-iron dark:border-dark-border">
      <div className="max-w-ot mx-auto px-4 py-6">
        <form onSubmit={handleSearch}>
          <div className="flex items-center gap-3 flex-wrap lg:flex-nowrap">
            <div className="flex items-center gap-2 border border-ot-iron dark:border-dark-border rounded-ot-btn px-3 py-2.5 bg-white dark:bg-dark-surface min-w-[160px]">
              <svg className="w-5 h-5 text-ot-charade dark:text-dark-text flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <select
                value={date}
                onChange={e => setDate(e.target.value)}
                className="appearance-none bg-transparent text-sm font-medium text-ot-charade dark:text-dark-text outline-none flex-1 cursor-pointer"
              >
                {Array.from({ length: 14 }, (_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() + i);
                  const iso = d.toISOString().split('T')[0];
                  return (
                    <option key={iso} value={iso}>
                      {formatDate(iso)}
                    </option>
                  );
                })}
              </select>
              <svg className="w-4 h-4 text-ot-manatee dark:text-dark-text-secondary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            <div className="flex items-center gap-2 border border-ot-iron dark:border-dark-border rounded-ot-btn px-3 py-2.5 bg-white dark:bg-dark-surface min-w-[130px]">
              <svg className="w-5 h-5 text-ot-charade dark:text-dark-text flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <select
                value={time}
                onChange={e => setTime(e.target.value)}
                className="appearance-none bg-transparent text-sm font-medium text-ot-charade dark:text-dark-text outline-none flex-1 cursor-pointer"
              >
                {TIME_OPTIONS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <svg className="w-4 h-4 text-ot-manatee dark:text-dark-text-secondary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            <div className="flex items-center gap-2 border border-ot-iron dark:border-dark-border rounded-ot-btn px-3 py-2.5 bg-white dark:bg-dark-surface min-w-[130px]">
              <svg className="w-5 h-5 text-ot-charade dark:text-dark-text flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <select
                value={partySize}
                onChange={e => setPartySize(e.target.value)}
                className="appearance-none bg-transparent text-sm font-medium text-ot-charade dark:text-dark-text outline-none flex-1 cursor-pointer"
              >
                {PARTY_SIZES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <svg className="w-4 h-4 text-ot-manatee dark:text-dark-text-secondary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            <div className="flex items-center gap-2 border border-ot-iron dark:border-dark-border rounded-ot-btn px-3 py-2.5 bg-white dark:bg-dark-surface flex-1 min-w-[200px]">
              <svg className="w-5 h-5 text-ot-manatee dark:text-dark-text-secondary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Location, Restaurant, or Cuisine"
                className="flex-1 text-sm text-ot-charade dark:text-dark-text bg-transparent outline-none placeholder-ot-manatee dark:placeholder-dark-text-secondary min-w-0"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-ot-manatee dark:text-dark-text-secondary hover:text-ot-charade dark:hover:text-dark-text"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <button
              type="submit"
              className="bg-ot-primary hover:bg-ot-primary-dark text-white font-bold text-sm px-8 py-3 rounded-ot-btn transition-colors whitespace-nowrap"
            >
              Let's go
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
