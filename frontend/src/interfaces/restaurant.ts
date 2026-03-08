export interface Restaurant {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  cuisine: string;
  price_range: number;
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
  max_capacity: number;
  is_active: boolean;
  opening_hours: OpeningHours | null;
}

export interface SearchFilters {
  date: string;
  time: string;
  partySize: number;
  location: string;
}

export interface OpeningHourDay {
  open: string;
  close: string;
  is_closed: boolean;
}

export interface OpeningHours {
  monday?: OpeningHourDay | null;
  tuesday?: OpeningHourDay | null;
  wednesday?: OpeningHourDay | null;
  thursday?: OpeningHourDay | null;
  friday?: OpeningHourDay | null;
  saturday?: OpeningHourDay | null;
  sunday?: OpeningHourDay | null;
}

export interface OwnerRestaurant extends Restaurant {
  owner_id: number;
  created_at: string;
  updated_at: string | null;
}

export interface RestaurantFormData {
  name: string;
  description: string;
  cuisine: string;
  price_range: number;
  phone_number: string;
  email: string;
  address: string;
  city: string;
  country: string;
  latitude: string;
  longitude: string;
  cover_image: string;
  max_capacity: number;
  opening_hours: OpeningHours;
}

export interface DashboardStats {
  total_restaurants: number;
  total_reservations: number;
  todays_reservations: number;
}
