import React, { useState } from 'react';
import { RestaurantDetail } from '../../interfaces/restaurant';

interface Props {
  restaurant: RestaurantDetail;
}

const TIME_SLOTS = ['6:30 PM', '6:45 PM', '7:00 PM', '7:15 PM', '7:30 PM'];
const PRICE_MAP: Record<number, string> = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const ReservationWidget: React.FC<Props> = ({ restaurant }) => {
  const today = new Date().toISOString().split('T')[0];
  const [guests, setGuests] = useState(2);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('19:00');
  const [editing, setEditing] = useState(false);
  const [notifyClicked, setNotifyClicked] = useState(false);

  const bookedToday = (restaurant.id * 7 + 3) % 15 + 3;

  return (
    <div className="border border-gray-200 rounded-2xl shadow-lg overflow-hidden bg-white">
      {/* Mini restaurant header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          {restaurant.cover_image_url ? (
            <img
              src={restaurant.cover_image_url}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm text-gray-900 truncate">{restaurant.name}</p>
          <p className="text-xs text-gray-500">
            ★ {restaurant.average_rating.toFixed(1)} · {PRICE_MAP[restaurant.price_range]} · {restaurant.cuisine_type}
          </p>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {restaurant.city}
          </p>
        </div>
      </div>

      {/* Booking summary / editor */}
      <div className="px-4 py-3 border-b border-gray-100">
        {editing ? (
          <div className="flex flex-col gap-2">
            <select
              value={guests}
              onChange={e => setGuests(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                <option key={n} value={n}>{n} {n === 1 ? 'person' : 'people'}</option>
              ))}
            </select>
            <input
              type="date"
              min={today}
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <select
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              {['17:00','17:30','18:00','18:30','19:00','19:30','20:00','20:30','21:00'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button
              onClick={() => setEditing(false)}
              className="text-sm font-semibold text-red-600 hover:text-red-700 text-right"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              For <span className="font-semibold">{guests} {guests === 1 ? 'person' : 'people'}</span>,{' '}
              {formatDate(date)}, {time}
            </p>
            <button
              onClick={() => setEditing(true)}
              className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0"
              title="Edit booking details"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Time slots */}
      <div className="px-4 pt-4 pb-3">
        <p className="text-sm font-semibold text-gray-900 mb-3">Select a time</p>
        <div className="grid grid-cols-2 gap-2">
          {TIME_SLOTS.map(slot => (
            <button
              key={slot}
              className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
            >
              {slot}
            </button>
          ))}
          <button
            onClick={() => setNotifyClicked(v => !v)}
            className={`
              flex items-center justify-center gap-1.5 text-sm font-medium py-2 rounded-lg border transition-colors
              ${notifyClicked
                ? 'bg-gray-100 border-gray-300 text-gray-600'
                : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50'}
            `}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Notify me
          </button>
        </div>
      </div>

      {/* Social proof */}
      <div className="px-4 py-2 border-t border-gray-100">
        <p className="text-xs text-gray-500 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Booked <span className="font-semibold text-gray-700">{bookedToday}</span> times today
        </p>
      </div>

      {/* View full availability */}
      <div className="px-4 pb-4 pt-2">
        <button className="w-full border border-gray-300 rounded-xl py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
          View full availability
        </button>
      </div>
    </div>
  );
};

export default ReservationWidget;
