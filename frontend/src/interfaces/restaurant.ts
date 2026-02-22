export interface RestaurantListItem {
  id: number;
  name: string;
  slug: string | null;
  cuisine_type: string;
  city: string;
  address: string | null;
  price_range: number; // 1-4
  average_rating: number;
  total_reviews: number;
  latitude: number | null;
  longitude: number | null;
  cover_image_url: string | null;
  logo_url: string | null;
  is_active: boolean;
  is_verified: boolean;
}

export interface RestaurantFilters {
  date?: string;
  time?: string;
  guests?: number;
  city?: string;
  cuisine?: string;
}
