export interface Restaurant {
  id: number;
  name: string;
  slug: string;
  image: string;
  rating: number;
  reviewCount: number;
  ratingLabel: string;
  cuisine: string;
  city: string;
  priceRange: string; // '$', '$$', '$$$', '$$$$'
  bookedToday: number;
  coords: [number, number]; // [lat, lng]
  availableTimes: string[];
  isNew?: boolean;
}

export interface SearchFilters {
  date: string;
  time: string;
  partySize: number;
  location: string;
}
