import { Restaurant } from './restaurant';

export interface FavoriteOut {
  restaurant_id: number;
  restaurant: Restaurant;
  created_at: string;
}
