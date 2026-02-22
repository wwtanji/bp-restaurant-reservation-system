import { RestaurantListItem, RestaurantFilters } from '../interfaces/restaurant';

// ---------------------------------------------------------------------------
// Mock data — replace body of getRestaurants with a real fetch() call once
// the backend has seeded restaurants in the DB.
// ---------------------------------------------------------------------------
const MOCK_RESTAURANTS: RestaurantListItem[] = [
  {
    id: 1,
    name: 'Glorious Bastards',
    slug: 'glorious-bastards-bratislava',
    cuisine_type: 'Grill',
    city: 'Bratislava',
    address: 'Obchodná 52, 811 06 Bratislava',
    price_range: 2,
    average_rating: 4.5,
    total_reviews: 690,
    latitude: 48.1455,
    longitude: 17.1074,
    cover_image_url:
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop',
    logo_url: null,
    is_active: true,
    is_verified: true,
  },
  {
    id: 2,
    name: 'Lubu Fusion',
    slug: 'lubu-fusion-bratislava',
    cuisine_type: 'Asian',
    city: 'Bratislava',
    address: 'Štefánikova 3, 811 04 Bratislava',
    price_range: 3,
    average_rating: 5.0,
    total_reviews: 0,
    latitude: 48.1422,
    longitude: 17.1099,
    cover_image_url:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop',
    logo_url: null,
    is_active: true,
    is_verified: true,
  },
  {
    id: 3,
    name: 'Paparazzi Bistro',
    slug: 'paparazzi-bistro-bratislava',
    cuisine_type: 'Italian',
    city: 'Bratislava',
    address: 'Laurinská 1, 811 01 Bratislava',
    price_range: 2,
    average_rating: 4.3,
    total_reviews: 482,
    latitude: 48.1440,
    longitude: 17.1091,
    cover_image_url:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop',
    logo_url: null,
    is_active: true,
    is_verified: false,
  },
  {
    id: 4,
    name: 'Kolkovna Bratislava',
    slug: 'kolkovna-bratislava',
    cuisine_type: 'Czech',
    city: 'Bratislava',
    address: 'Pánska 12, 811 01 Bratislava',
    price_range: 2,
    average_rating: 4.1,
    total_reviews: 1240,
    latitude: 48.1432,
    longitude: 17.1083,
    cover_image_url:
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&h=400&fit=crop',
    logo_url: null,
    is_active: true,
    is_verified: true,
  },
  {
    id: 5,
    name: 'The Slovak Pub',
    slug: 'the-slovak-pub-bratislava',
    cuisine_type: 'Slovak',
    city: 'Bratislava',
    address: 'Obchodná 62, 811 06 Bratislava',
    price_range: 1,
    average_rating: 3.9,
    total_reviews: 2105,
    latitude: 48.1462,
    longitude: 17.1065,
    cover_image_url:
      'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=600&h=400&fit=crop',
    logo_url: null,
    is_active: true,
    is_verified: false,
  },
  {
    id: 6,
    name: 'Le Monde',
    slug: 'le-monde-bratislava',
    cuisine_type: 'French',
    city: 'Bratislava',
    address: 'Hlavné nám. 5, 811 01 Bratislava',
    price_range: 4,
    average_rating: 4.8,
    total_reviews: 318,
    latitude: 48.1437,
    longitude: 17.1069,
    cover_image_url:
      'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=600&h=400&fit=crop',
    logo_url: null,
    is_active: true,
    is_verified: true,
  },
  {
    id: 7,
    name: 'Sakura Garden',
    slug: 'sakura-garden-bratislava',
    cuisine_type: 'Japanese',
    city: 'Bratislava',
    address: 'Ventúrska 9, 811 01 Bratislava',
    price_range: 3,
    average_rating: 4.6,
    total_reviews: 521,
    latitude: 48.1448,
    longitude: 17.1058,
    cover_image_url:
      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&h=400&fit=crop',
    logo_url: null,
    is_active: true,
    is_verified: true,
  },
  {
    id: 8,
    name: 'El Toro Steakhouse',
    slug: 'el-toro-steakhouse-bratislava',
    cuisine_type: 'Steak',
    city: 'Bratislava',
    address: 'Sedlárska 6, 811 01 Bratislava',
    price_range: 3,
    average_rating: 4.4,
    total_reviews: 874,
    latitude: 48.1428,
    longitude: 17.1101,
    cover_image_url:
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop',
    logo_url: null,
    is_active: true,
    is_verified: false,
  },
];

export const getRestaurants = async (
  filters?: RestaurantFilters
): Promise<RestaurantListItem[]> => {
  // TODO: uncomment below and remove mock data once DB is seeded
  // const params = new URLSearchParams();
  // if (filters?.city) params.set('city', filters.city);
  // if (filters?.cuisine) params.set('cuisine_type', filters.cuisine);
  // const res = await fetch(`/api/restaurants?${params}`);
  // if (!res.ok) throw new Error('Failed to fetch restaurants');
  // return res.json();

  let results = [...MOCK_RESTAURANTS];

  if (filters?.city) {
    results = results.filter(r =>
      r.city.toLowerCase().includes(filters.city!.toLowerCase())
    );
  }
  if (filters?.cuisine) {
    results = results.filter(r =>
      r.cuisine_type.toLowerCase().includes(filters.cuisine!.toLowerCase())
    );
  }

  return results;
};
