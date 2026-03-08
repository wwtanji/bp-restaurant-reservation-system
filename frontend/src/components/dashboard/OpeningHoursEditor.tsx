import React from 'react';
import { OpeningHours, OpeningHourDay } from '../../interfaces/restaurant';
import { DAYS_OF_WEEK, DAY_LABELS } from '../../constants/dashboard';

interface OpeningHoursEditorProps {
  value: OpeningHours;
  onChange: (hours: OpeningHours) => void;
}

const OpeningHoursEditor: React.FC<OpeningHoursEditorProps> = ({ value, onChange }) => {
  const getDayHours = (day: string): OpeningHourDay => {
    return (value as Record<string, OpeningHourDay | null | undefined>)[day] ?? {
      open: '09:00',
      close: '22:00',
      is_closed: false,
    };
  };

  const updateDay = (day: string, updates: Partial<OpeningHourDay>) => {
    const current = getDayHours(day);
    onChange({
      ...value,
      [day]: { ...current, ...updates },
    });
  };

  return (
    <div className="space-y-3">
      {DAYS_OF_WEEK.map((day) => {
        const hours = getDayHours(day);
        return (
          <div key={day} className="flex items-center gap-4">
            <span className="w-24 text-sm font-medium text-ot-charade">
              {DAY_LABELS[day]}
            </span>
            <input
              type="time"
              value={hours.open}
              onChange={(e) => updateDay(day, { open: e.target.value })}
              disabled={hours.is_closed}
              className="border border-ot-iron rounded-ot-btn px-3 py-1.5 text-sm disabled:opacity-50 disabled:bg-gray-100"
            />
            <span className="text-sm text-gray-500">to</span>
            <input
              type="time"
              value={hours.close}
              onChange={(e) => updateDay(day, { close: e.target.value })}
              disabled={hours.is_closed}
              className="border border-ot-iron rounded-ot-btn px-3 py-1.5 text-sm disabled:opacity-50 disabled:bg-gray-100"
            />
            <label className="flex items-center gap-2 text-sm text-ot-charade">
              <input
                type="checkbox"
                checked={hours.is_closed}
                onChange={(e) => updateDay(day, { is_closed: e.target.checked })}
                className="rounded border-ot-iron"
              />
              Closed
            </label>
          </div>
        );
      })}
    </div>
  );
};

export default OpeningHoursEditor;
