export interface ReservationRestaurant {
  id: number;
  name: string;
  slug: string;
  address: string;
  city: string;
  cover_image: string | null;
}

export interface Reservation {
  id: number;
  restaurant: ReservationRestaurant;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  status: string;
  guest_name: string | null;
  guest_phone: string | null;
  special_requests: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface SlotAvailability {
  available_seats: number;
  max_capacity: number;
}
