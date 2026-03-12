export interface AdminPlatformStats {
  total_users: number;
  total_restaurants: number;
  active_restaurants: number;
  total_reservations: number;
  todays_reservations: number;
  total_reviews: number;
  users_by_role: Record<string, number>;
}

export interface AdminUser {
  id: number;
  role: number;
  first_name: string;
  last_name: string;
  user_email: string;
  phone_number: string | null;
  email_verified: boolean;
  failed_login_attempts: number;
  locked_until: string | null;
  registered_at: string;
}

export interface AdminUserDetail extends AdminUser {
  restaurant_count: number;
  reservation_count: number;
  review_count: number;
}

export interface AdminRestaurant {
  id: number;
  owner_id: number;
  name: string;
  slug: string;
  cuisine: string;
  city: string;
  address: string;
  price_range: number;
  rating: number | null;
  review_count: number;
  max_capacity: number;
  is_active: boolean;
  created_at: string;
  owner_name: string;
}

export interface AdminReservation {
  id: number;
  user_id: number;
  restaurant_id: number;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  status: string;
  guest_name: string | null;
  guest_phone: string | null;
  special_requests: string | null;
  created_at: string;
  restaurant_name: string;
  user_name: string;
}

export interface AdminReview {
  id: number;
  user_id: number;
  restaurant_id: number;
  rating: number;
  text: string | null;
  created_at: string;
  updated_at: string | null;
  author_name: string;
  restaurant_name: string;
  restaurant_slug: string;
}
