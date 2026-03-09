export interface ReviewAuthor {
  id: number;
  first_name: string;
}

export interface ReviewRestaurantBrief {
  id: number;
  name: string;
  slug: string;
  cuisine: string;
  city: string;
  price_range: number;
  rating: number | null;
}

export interface Review {
  id: number;
  user_id: number;
  restaurant_id: number;
  rating: number;
  text: string | null;
  author: ReviewAuthor;
  restaurant: ReviewRestaurantBrief;
  created_at: string;
  updated_at: string | null;
}

export interface ReviewFormData {
  rating: number;
  text: string;
}
