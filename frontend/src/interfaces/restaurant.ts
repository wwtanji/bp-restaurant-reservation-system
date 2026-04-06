export interface MenuItem {
  name: string;
  price: string;
  description?: string;
}

export interface MenuCategory {
  name: string;
  items: MenuItem[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

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
  gallery_images: string[] | null;
  rating: number | null;
  review_count: number;
  max_capacity: number;
  reservation_fee: number;
  is_active: boolean;
  opening_hours: OpeningHours | null;
  overview_text: string | null;
  highlights: string[] | null;
  website: string | null;
  dining_style: string | null;
  dress_code: string | null;
  parking_details: string | null;
  payment_options: string | null;
  neighborhood: string | null;
  cross_street: string | null;
  executive_chef: string | null;
  public_transit: string | null;
  catering_info: string | null;
  private_party_info: string | null;
  additional_info: string | null;
  delivery_takeout: string | null;
  menu: MenuCategory[] | null;
  faqs: FaqItem[] | null;
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
  reservation_fee: string;
  opening_hours: OpeningHours;
  overview_text: string;
  highlights: string[];
  website: string;
  dining_style: string;
  dress_code: string;
  parking_details: string;
  payment_options: string;
  neighborhood: string;
  cross_street: string;
  executive_chef: string;
  public_transit: string;
  catering_info: string;
  private_party_info: string;
  additional_info: string;
  delivery_takeout: string;
  menu: MenuCategory[];
  faqs: FaqItem[];
}

import { DailyCount, ReservationStatusBreakdown } from './admin';

export interface OwnerDashboardStats {
  total_restaurants: number;
  total_reservations: number;
  todays_reservations: number;
  total_revenue_cents: number;
  average_rating: number | null;
  total_reviews: number;
  current_period_reservations: number;
  previous_period_reservations: number;
  current_period_revenue_cents: number;
  previous_period_revenue_cents: number;
}

export interface DailyRevenue {
  date: string;
  amount: number;
}

export interface HourlyCount {
  hour: number;
  count: number;
}

export interface PartySizeCount {
  party_size: number;
  count: number;
}

export interface CustomerLoyalty {
  new_customers: number;
  repeat_customers: number;
}

export interface OwnerTrendStats {
  reservation_trends: DailyCount[];
  revenue_trends: DailyRevenue[];
  reservation_status_breakdown: ReservationStatusBreakdown;
  peak_hours: HourlyCount[];
  party_size_distribution: PartySizeCount[];
  customer_loyalty: CustomerLoyalty;
}
