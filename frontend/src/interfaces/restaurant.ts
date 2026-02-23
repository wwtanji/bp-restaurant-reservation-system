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

export interface RestaurantDetail extends RestaurantListItem {
  description: string | null;
  tags: string[];
  phone: string;
  email: string;
  website: string | null;
  gallery_images: string[];
  amenities: string[];
  avg_price_per_person: number | null;
  cancellation_hours: number;
  operating_hours: Record<string, { open: string; close: string; is_closed: boolean }>;
  food_rating: number;
  service_rating: number;
  ambience_rating: number;
  value_rating: number;
  noise_level: string | null;
  loved_for: string[];
  total_photos: number;
}

export interface Experience {
  id: number;
  title: string;
  price_per_person: number;
  date: string;
  description: string;
  image_url: string | null;
}

export interface Review {
  id: number;
  reviewer_name: string;
  reviewer_location: string;
  reviewer_review_count: number;
  dined_at: string;
  overall: number;
  food: number;
  service: number;
  ambience: number;
  text: string;
  helpful_count: number;
}
