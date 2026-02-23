import { RestaurantDetail, Review, Experience } from '../interfaces/restaurant';

// ---------------------------------------------------------------------------
// Shared gallery pools
// ---------------------------------------------------------------------------
const GRILL_PHOTOS = [
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=500&fit=crop',
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=500&fit=crop',
  'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=600&h=500&fit=crop',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&h=500&fit=crop',
];

const ASIAN_PHOTOS = [
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&h=500&fit=crop',
  'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=600&h=500&fit=crop',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=500&fit=crop',
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&h=500&fit=crop',
];

const ITALIAN_PHOTOS = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=600&h=500&fit=crop',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=500&fit=crop',
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=500&fit=crop',
  'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=600&h=500&fit=crop',
];

// ---------------------------------------------------------------------------
// Mock detail data
// ---------------------------------------------------------------------------
const MOCK_DETAILS: Record<string, RestaurantDetail> = {
  'glorious-bastards-bratislava': {
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
    cover_image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1400&h=600&fit=crop',
    logo_url: null,
    is_active: true,
    is_verified: true,
    description:
      'Was braucht man mehr als ein gutes Essen zu einem fairen Preis, dazu selbstgebrautes Bier, gute Stimmung und freundliches Personal! Von kleinen SchmankerIn bis zu deftiger Hausmannskost ist für jeden etwas dabei. Für alle, die das Besondere suchen, bieten wir regelmäßig spannende Events und Specials an.',
    tags: ['Lively', 'Hot spot', 'Great for outdoor dining'],
    phone: '+421 2 1234 5678',
    email: 'info@gloriousbastards.sk',
    website: 'https://www.gloriousbastards.sk',
    gallery_images: GRILL_PHOTOS,
    amenities: ['WiFi', 'Outdoor seating', 'Bar', 'Private dining'],
    avg_price_per_person: 28,
    cancellation_hours: 24,
    operating_hours: {
      monday: { open: '11:00', close: '23:00', is_closed: false },
      tuesday: { open: '11:00', close: '23:00', is_closed: false },
      wednesday: { open: '11:00', close: '23:00', is_closed: false },
      thursday: { open: '11:00', close: '23:00', is_closed: false },
      friday: { open: '11:00', close: '00:00', is_closed: false },
      saturday: { open: '12:00', close: '00:00', is_closed: false },
      sunday: { open: '12:00', close: '22:00', is_closed: false },
    },
    food_rating: 4.3,
    service_rating: 4.1,
    ambience_rating: 4.3,
    value_rating: 4.0,
    noise_level: 'Energetic',
    loved_for: ['Good for business meals', 'Good for groups', 'Great for creative cocktails'],
    total_photos: 149,
  },

  'lubu-fusion-bratislava': {
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
    cover_image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400&h=600&fit=crop',
    logo_url: null,
    is_active: true,
    is_verified: true,
    description:
      'Lubu Fusion brings the vibrant flavors of Pan-Asian cuisine to the heart of Bratislava. Our chefs blend traditional techniques with modern creativity, resulting in dishes that are both comforting and surprising. A destination for food lovers seeking something truly different.',
    tags: ['Fancy', 'Romantic', 'Good for groups'],
    phone: '+421 2 9876 5432',
    email: 'info@lubufusion.sk',
    website: null,
    gallery_images: ASIAN_PHOTOS,
    amenities: ['WiFi', 'Vegetarian options', 'Bar', 'Private dining'],
    avg_price_per_person: 55,
    cancellation_hours: 48,
    operating_hours: {
      monday: { open: '12:00', close: '22:00', is_closed: false },
      tuesday: { open: '12:00', close: '22:00', is_closed: false },
      wednesday: { open: '12:00', close: '22:00', is_closed: false },
      thursday: { open: '12:00', close: '22:00', is_closed: false },
      friday: { open: '12:00', close: '23:00', is_closed: false },
      saturday: { open: '13:00', close: '23:00', is_closed: false },
      sunday: { open: '13:00', close: '21:00', is_closed: false },
    },
    food_rating: 5.0,
    service_rating: 5.0,
    ambience_rating: 5.0,
    value_rating: 4.8,
    noise_level: 'Quiet',
    loved_for: ['Romantic', 'Special occasions', 'Vegetarian-friendly'],
    total_photos: 48,
  },

  'paparazzi-bistro-bratislava': {
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
    cover_image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1400&h=600&fit=crop',
    logo_url: null,
    is_active: true,
    is_verified: false,
    description:
      'A lively Italian bistro in the heart of the Old Town. We serve authentic Neapolitan pizza, homemade pasta, and a carefully curated selection of Italian wines. Perfect for both casual dinners and special celebrations.',
    tags: ['Lively', 'Good for groups', 'Outdoor seating'],
    phone: '+421 2 5555 1234',
    email: 'info@paparazzibistro.sk',
    website: 'https://www.paparazzibistro.sk',
    gallery_images: ITALIAN_PHOTOS,
    amenities: ['WiFi', 'Outdoor seating', 'Gluten-free options', 'Bar'],
    avg_price_per_person: 22,
    cancellation_hours: 24,
    operating_hours: {
      monday: { open: '11:30', close: '22:30', is_closed: false },
      tuesday: { open: '11:30', close: '22:30', is_closed: false },
      wednesday: { open: '11:30', close: '22:30', is_closed: false },
      thursday: { open: '11:30', close: '22:30', is_closed: false },
      friday: { open: '11:30', close: '23:30', is_closed: false },
      saturday: { open: '12:00', close: '23:30', is_closed: false },
      sunday: { open: '12:00', close: '22:00', is_closed: false },
    },
    food_rating: 4.4,
    service_rating: 4.2,
    ambience_rating: 4.3,
    value_rating: 4.5,
    noise_level: 'Lively',
    loved_for: ['Good for groups', 'Pizza lovers', 'Date night'],
    total_photos: 72,
  },
};

// Fallback generator for restaurants without specific mock detail
const buildFallbackDetail = (slug: string): RestaurantDetail | null => {
  const FALLBACK_MAP: Record<string, Partial<RestaurantDetail>> = {
    'kolkovna-bratislava': {
      id: 4, name: 'Kolkovna Bratislava', cuisine_type: 'Czech', price_range: 2,
      average_rating: 4.1, total_reviews: 1240, city: 'Bratislava',
      address: 'Pánska 12, 811 01 Bratislava',
      cover_image_url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1400&h=600&fit=crop',
      gallery_images: GRILL_PHOTOS,
    },
    'the-slovak-pub-bratislava': {
      id: 5, name: 'The Slovak Pub', cuisine_type: 'Slovak', price_range: 1,
      average_rating: 3.9, total_reviews: 2105, city: 'Bratislava',
      address: 'Obchodná 62, 811 06 Bratislava',
      cover_image_url: 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=1400&h=600&fit=crop',
      gallery_images: GRILL_PHOTOS,
    },
    'le-monde-bratislava': {
      id: 6, name: 'Le Monde', cuisine_type: 'French', price_range: 4,
      average_rating: 4.8, total_reviews: 318, city: 'Bratislava',
      address: 'Hlavné nám. 5, 811 01 Bratislava',
      cover_image_url: 'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=1400&h=600&fit=crop',
      gallery_images: ITALIAN_PHOTOS,
    },
    'sakura-garden-bratislava': {
      id: 7, name: 'Sakura Garden', cuisine_type: 'Japanese', price_range: 3,
      average_rating: 4.6, total_reviews: 521, city: 'Bratislava',
      address: 'Ventúrska 9, 811 01 Bratislava',
      cover_image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1400&h=600&fit=crop',
      gallery_images: ASIAN_PHOTOS,
    },
    'el-toro-steakhouse-bratislava': {
      id: 8, name: 'El Toro Steakhouse', cuisine_type: 'Steak', price_range: 3,
      average_rating: 4.4, total_reviews: 874, city: 'Bratislava',
      address: 'Sedlárska 6, 811 01 Bratislava',
      cover_image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1400&h=600&fit=crop',
      gallery_images: GRILL_PHOTOS,
    },
  };

  const partial = FALLBACK_MAP[slug];
  if (!partial) return null;

  return {
    slug,
    latitude: 48.1440,
    longitude: 17.1077,
    logo_url: null,
    is_active: true,
    is_verified: false,
    description: `Welcome to ${partial.name}. We offer a wonderful dining experience in the heart of Bratislava.`,
    tags: ['Good for groups', 'Casual dining'],
    phone: '+421 2 0000 0000',
    email: `info@${slug}.sk`,
    website: null,
    amenities: ['WiFi', 'Bar'],
    avg_price_per_person: null,
    cancellation_hours: 24,
    operating_hours: {
      monday: { open: '12:00', close: '22:00', is_closed: false },
      tuesday: { open: '12:00', close: '22:00', is_closed: false },
      wednesday: { open: '12:00', close: '22:00', is_closed: false },
      thursday: { open: '12:00', close: '22:00', is_closed: false },
      friday: { open: '12:00', close: '23:00', is_closed: false },
      saturday: { open: '12:00', close: '23:00', is_closed: false },
      sunday: { open: '12:00', close: '21:00', is_closed: true },
    },
    food_rating: partial.average_rating ?? 4.0,
    service_rating: (partial.average_rating ?? 4.0) - 0.1,
    ambience_rating: (partial.average_rating ?? 4.0) + 0.1,
    value_rating: (partial.average_rating ?? 4.0) - 0.2,
    noise_level: 'Moderate',
    loved_for: ['Good for groups', 'Casual dining'],
    total_photos: 24,
    ...partial,
  } as RestaurantDetail;
};

// ---------------------------------------------------------------------------
// Mock reviews
// ---------------------------------------------------------------------------
const REVIEWS_MAP: Record<number, Review[]> = {
  1: [
    {
      id: 1,
      reviewer_name: 'Reinhard',
      reviewer_location: 'Austria',
      reviewer_review_count: 1,
      dined_at: '2026-02-20',
      overall: 5,
      food: 5,
      service: 5,
      ambience: 5,
      text: 'Aufmerksame, sympathische Bedienung; Essen war super!',
      helpful_count: 0,
    },
    {
      id: 2,
      reviewer_name: 'Katharina',
      reviewer_location: 'Austria',
      reviewer_review_count: 1,
      dined_at: '2026-02-14',
      overall: 3,
      food: 2,
      service: 4,
      ambience: 3,
      text: 'Das Essen kam zu unterschiedlichen Zeiten, so mussten wir zeitversetzt essen.\n\nLeider hatten die Short Ribs diesmal nicht die gleiche Qualität, wie zuvor. Es ist schade, denn der Laden hat wirklich Potenzial.',
      helpful_count: 2,
    },
    {
      id: 3,
      reviewer_name: 'Martin',
      reviewer_location: 'Slovakia',
      reviewer_review_count: 8,
      dined_at: '2026-02-10',
      overall: 5,
      food: 5,
      service: 5,
      ambience: 4,
      text: 'Great place! The grill selection is fantastic and the beer is brewed on-site. Staff were very attentive. Will definitely come back.',
      helpful_count: 5,
    },
    {
      id: 4,
      reviewer_name: 'Sophie',
      reviewer_location: 'Germany',
      reviewer_review_count: 3,
      dined_at: '2026-02-05',
      overall: 4,
      food: 4,
      service: 4,
      ambience: 5,
      text: 'Lovely atmosphere and the food was really solid. The outdoor terrace is amazing in the evening. Slightly long wait for the main course but worth it.',
      helpful_count: 1,
    },
  ],
};

const GENERIC_REVIEWS: Review[] = [
  {
    id: 1,
    reviewer_name: 'Anna',
    reviewer_location: 'Slovakia',
    reviewer_review_count: 5,
    dined_at: '2026-02-18',
    overall: 4,
    food: 4,
    service: 4,
    ambience: 4,
    text: 'Great experience overall. The food was fresh and the staff were friendly. Would recommend.',
    helpful_count: 2,
  },
  {
    id: 2,
    reviewer_name: 'David',
    reviewer_location: 'Czech Republic',
    reviewer_review_count: 12,
    dined_at: '2026-02-12',
    overall: 5,
    food: 5,
    service: 5,
    ambience: 4,
    text: 'One of the best restaurants in Bratislava. The quality is consistently excellent.',
    helpful_count: 8,
  },
  {
    id: 3,
    reviewer_name: 'Maria',
    reviewer_location: 'Hungary',
    reviewer_review_count: 2,
    dined_at: '2026-02-08',
    overall: 4,
    food: 4,
    service: 3,
    ambience: 5,
    text: 'Beautiful ambience and tasty food. Service could be a bit quicker during peak hours but overall a lovely evening.',
    helpful_count: 0,
  },
];

// ---------------------------------------------------------------------------
// Mock experiences
// ---------------------------------------------------------------------------
const EXPERIENCES_MAP: Record<number, Experience[]> = {
  1: [
    {
      id: 1,
      title: "Grill Master's Table",
      price_per_person: 98,
      date: '2026-03-21',
      description: 'An exclusive evening at the chef\'s table with a 5-course tasting menu paired with craft beers.',
      image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&h=300&fit=crop',
    },
    {
      id: 2,
      title: 'Sunday Brunch Feast',
      price_per_person: 45,
      date: '2026-03-15',
      description: 'A lavish Sunday brunch with unlimited drinks and a live cooking station.',
      image_url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=300&h=300&fit=crop',
    },
  ],
};

const GENERIC_EXPERIENCE: Experience[] = [
  {
    id: 1,
    title: "Chef's Tasting Evening",
    price_per_person: 75,
    date: '2026-03-28',
    description: 'A special multi-course tasting menu showcasing the best of our seasonal ingredients.',
    image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&h=300&fit=crop',
  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export const getRestaurantDetail = async (slug: string): Promise<RestaurantDetail | null> => {
  return MOCK_DETAILS[slug] ?? buildFallbackDetail(slug);
};

export const getRestaurantReviews = async (restaurantId: number): Promise<Review[]> => {
  return REVIEWS_MAP[restaurantId] ?? GENERIC_REVIEWS;
};

export const getRestaurantExperiences = async (restaurantId: number): Promise<Experience[]> => {
  return EXPERIENCES_MAP[restaurantId] ?? GENERIC_EXPERIENCE;
};
