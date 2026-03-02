/** Matches the backend RestaurantOut schema exactly. */
export interface Restaurant {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  cuisine: string;
  price_range: number; // 1 = $  2 = $$  3 = $$$  4 = $$$$
  phone_number: string | null;
  email: string | null;
  address: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  cover_image: string | null;
  rating: number | null;
  review_count: number;
  is_active: boolean;
}

export interface SearchFilters {
  date: string;
  time: string;
  partySize: number;
  location: string;
}
