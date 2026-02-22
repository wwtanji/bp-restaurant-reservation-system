import React, { useRef, useEffect } from 'react';
import { RestaurantListItem } from '../../interfaces/restaurant';
import RestaurantCard from './RestaurantCard';

interface Props {
  restaurants: RestaurantListItem[];
  hoveredId: number | null;
  onHover: (id: number | null) => void;
}

const RestaurantList: React.FC<Props> = ({ restaurants, hoveredId, onHover }) => {
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Scroll the card into view when a map marker is clicked (hoveredId set externally)
  useEffect(() => {
    if (hoveredId == null) return;
    const el = cardRefs.current.get(hoveredId);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [hoveredId]);

  if (restaurants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm font-medium">No restaurants found</p>
        <p className="text-xs mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {restaurants.map(r => (
        <RestaurantCard
          key={r.id}
          ref={el => {
            if (el) cardRefs.current.set(r.id, el);
            else cardRefs.current.delete(r.id);
          }}
          restaurant={r}
          isHovered={hoveredId === r.id}
          onHover={onHover}
        />
      ))}
    </div>
  );
};

export default RestaurantList;
