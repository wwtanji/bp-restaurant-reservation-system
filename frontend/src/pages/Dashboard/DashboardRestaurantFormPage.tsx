import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import OpeningHoursEditor from '../../components/dashboard/OpeningHoursEditor';
import { apiFetch, API_URL } from '../../utils/api';
import { useNotification } from '../../context/NotificationContext';
import { RestaurantFormData, OwnerRestaurant, MenuCategory, FaqItem } from '../../interfaces/restaurant';
import { createDefaultOpeningHours } from '../../constants/dashboard';

const INITIAL_FORM: RestaurantFormData = {
  name: '',
  description: '',
  cuisine: '',
  price_range: 2,
  phone_number: '',
  email: '',
  address: '',
  city: '',
  country: 'Slovakia',
  latitude: '',
  longitude: '',
  cover_image: '',
  max_capacity: 20,
  reservation_fee: '5.00',
  opening_hours: createDefaultOpeningHours(),
  overview_text: '',
  highlights: [],
  website: '',
  dining_style: '',
  dress_code: '',
  parking_details: '',
  payment_options: '',
  neighborhood: '',
  cross_street: '',
  executive_chef: '',
  public_transit: '',
  catering_info: '',
  private_party_info: '',
  additional_info: '',
  delivery_takeout: '',
  menu: [],
  faqs: [],
};

const DashboardRestaurantFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show } = useNotification();
  const isEditing = !!id;

  const [form, setForm] = useState<RestaurantFormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [existingGallery, setExistingGallery] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    apiFetch<OwnerRestaurant>(`/owners/restaurants/${id}`)
      .then((restaurant) => {
        setForm({
          name: restaurant.name,
          description: restaurant.description || '',
          cuisine: restaurant.cuisine,
          price_range: restaurant.price_range,
          phone_number: restaurant.phone_number || '',
          email: restaurant.email || '',
          address: restaurant.address,
          city: restaurant.city,
          country: restaurant.country,
          latitude: restaurant.latitude?.toString() || '',
          longitude: restaurant.longitude?.toString() || '',
          cover_image: restaurant.cover_image || '',
          max_capacity: restaurant.max_capacity,
          reservation_fee: (restaurant.reservation_fee / 100).toFixed(2),
          opening_hours: restaurant.opening_hours || createDefaultOpeningHours(),
          overview_text: restaurant.overview_text || '',
          highlights: restaurant.highlights || [],
          website: restaurant.website || '',
          dining_style: restaurant.dining_style || '',
          dress_code: restaurant.dress_code || '',
          parking_details: restaurant.parking_details || '',
          payment_options: restaurant.payment_options || '',
          neighborhood: restaurant.neighborhood || '',
          cross_street: restaurant.cross_street || '',
          executive_chef: restaurant.executive_chef || '',
          public_transit: restaurant.public_transit || '',
          catering_info: restaurant.catering_info || '',
          private_party_info: restaurant.private_party_info || '',
          additional_info: restaurant.additional_info || '',
          delivery_takeout: restaurant.delivery_takeout || '',
          menu: restaurant.menu || [],
          faqs: restaurant.faqs || [],
        });
        if (restaurant.cover_image) {
          const url = restaurant.cover_image.startsWith('/static/')
            ? `${API_URL}${restaurant.cover_image}`
            : restaurant.cover_image;
          setCoverPreview(url);
        }
        setExistingGallery(restaurant.gallery_images || []);
      })
      .catch(() => {
        show('Failed to load restaurant', 'error');
        navigate('/dashboard/restaurants');
      })
      .finally(() => setFetching(false));
  }, [id]);

  const updateField = <K extends keyof RestaurantFormData>(
    field: K,
    value: RestaurantFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    updateField('cover_image', '');
  };

  const handleRemoveCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
    updateField('cover_image', '');
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setGalleryFiles((prev) => [...prev, ...files]);
    setGalleryPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const handleRemoveGalleryPending = (index: number) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingGallery = async (imageUrl: string) => {
    if (!id) return;
    try {
      await apiFetch(`/owners/restaurants/${id}/gallery-images`, {
        method: 'DELETE',
        body: JSON.stringify({ image_url: imageUrl }),
      });
      setExistingGallery((prev) => prev.filter((url) => url !== imageUrl));
      show('Photo deleted', 'success');
    } catch {
      show('Failed to delete photo', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.cuisine.trim() || !form.address.trim() || !form.city.trim()) {
      show('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        cuisine: form.cuisine.trim(),
        price_range: form.price_range,
        phone_number: form.phone_number.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        cover_image: form.cover_image.trim() || null,
        max_capacity: form.max_capacity,
        reservation_fee: Math.round(parseFloat(form.reservation_fee || '0') * 100),
        opening_hours: form.opening_hours,
        overview_text: form.overview_text.trim() || null,
        highlights: form.highlights.length > 0 ? form.highlights : null,
        website: form.website.trim() || null,
        dining_style: form.dining_style.trim() || null,
        dress_code: form.dress_code.trim() || null,
        parking_details: form.parking_details.trim() || null,
        payment_options: form.payment_options.trim() || null,
        neighborhood: form.neighborhood.trim() || null,
        cross_street: form.cross_street.trim() || null,
        executive_chef: form.executive_chef.trim() || null,
        public_transit: form.public_transit.trim() || null,
        catering_info: form.catering_info.trim() || null,
        private_party_info: form.private_party_info.trim() || null,
        additional_info: form.additional_info.trim() || null,
        delivery_takeout: form.delivery_takeout.trim() || null,
        menu: form.menu.length > 0 ? form.menu : null,
        faqs: form.faqs.length > 0 ? form.faqs : null,
      };

      let restaurantId = id;

      if (isEditing) {
        await apiFetch(`/owners/restaurants/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        const created = await apiFetch<OwnerRestaurant>('/owners/restaurants', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        restaurantId = String(created.id);
      }

      if (coverFile || galleryFiles.length > 0) {
        setUploadingPhotos(true);

        if (coverFile) {
          const coverForm = new FormData();
          coverForm.append('file', coverFile);
          await apiFetch(`/owners/restaurants/${restaurantId}/cover-image`, {
            method: 'POST',
            body: coverForm,
          });
        }

        if (galleryFiles.length > 0) {
          const galleryForm = new FormData();
          galleryFiles.forEach((f) => galleryForm.append('files', f));
          await apiFetch(`/owners/restaurants/${restaurantId}/gallery-images`, {
            method: 'POST',
            body: galleryForm,
          });
        }

        setUploadingPhotos(false);
      }

      show(
        isEditing ? 'Restaurant updated successfully' : 'Restaurant created successfully',
        'success',
      );
      navigate('/dashboard/restaurants');
    } catch {
      show(isEditing ? 'Failed to update restaurant' : 'Failed to create restaurant', 'error');
    } finally {
      setLoading(false);
      setUploadingPhotos(false);
    }
  };

  if (fetching) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ot-charade dark:border-dark-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const inputClasses =
    'w-full border border-ot-iron dark:border-dark-border rounded-ot-btn px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ot-charade/20 focus:border-ot-charade dark:bg-dark-surface dark:text-dark-text';

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-ot-charade dark:text-dark-text mb-8">
          {isEditing ? 'Edit Restaurant' : 'Add Restaurant'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ot-charade dark:text-dark-text">
              Basic Info
            </h2>
            <div>
              <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">
                Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={inputClasses}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
                className={inputClasses}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">
                  Cuisine *
                </label>
                <input
                  type="text"
                  value={form.cuisine}
                  onChange={(e) => updateField('cuisine', e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">
                  Price Range
                </label>
                <select
                  value={form.price_range}
                  onChange={(e) => updateField('price_range', parseInt(e.target.value))}
                  className={inputClasses}
                >
                  <option value={1}>&#8364; - Budget</option>
                  <option value={2}>&#8364;&#8364; - Moderate</option>
                  <option value={3}>&#8364;&#8364;&#8364; - Upscale</option>
                  <option value={4}>&#8364;&#8364;&#8364;&#8364; - Fine Dining</option>
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ot-charade dark:text-dark-text">Overview</h2>
            <div>
              <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">
                Overview Text
              </label>
              <textarea
                value={form.overview_text}
                onChange={(e) => updateField('overview_text', e.target.value)}
                rows={4}
                placeholder="Write a compelling overview shown on the restaurant page..."
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">
                Highlights
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.highlights.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-sm bg-ot-athens-gray dark:bg-dark-bg border border-ot-iron dark:border-dark-border rounded-full text-ot-charade dark:text-dark-text"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => updateField('highlights', form.highlights.filter((_, j) => j !== i))}
                      className="text-ot-manatee hover:text-red-500 dark:text-dark-text-secondary dark:hover:text-red-400 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Type a highlight and press Enter (e.g. Lively, Good for groups)"
                className={inputClasses}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = e.currentTarget.value.trim();
                    if (val && !form.highlights.includes(val)) {
                      updateField('highlights', [...form.highlights, val]);
                    }
                    e.currentTarget.value = '';
                  }
                }}
              />
              <p className="mt-1 text-xs text-ot-manatee dark:text-dark-text-secondary">Press Enter to add each tag</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ot-charade dark:text-dark-text">Contact</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={form.phone_number}
                  onChange={(e) => updateField('phone_number', e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className={inputClasses}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ot-charade dark:text-dark-text">Location</h2>
            <div>
              <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">
                Address *
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                className={inputClasses}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">
                  City *
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => updateField('country', e.target.value)}
                  className={inputClasses}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">
                  Latitude
                </label>
                <input
                  type="text"
                  value={form.latitude}
                  onChange={(e) => updateField('latitude', e.target.value)}
                  className={inputClasses}
                  placeholder="48.1486"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">
                  Longitude
                </label>
                <input
                  type="text"
                  value={form.longitude}
                  onChange={(e) => updateField('longitude', e.target.value)}
                  className={inputClasses}
                  placeholder="17.1077"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ot-charade dark:text-dark-text">
              Capacity & Pricing
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">
                  Max Capacity
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.max_capacity}
                  onChange={(e) => updateField('max_capacity', parseInt(e.target.value) || 1)}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">
                  Reservation Fee (&euro;)
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.reservation_fee}
                  onChange={(e) => updateField('reservation_fee', e.target.value)}
                  className={inputClasses}
                  placeholder="5.00"
                />
                <p className="mt-1 text-xs text-ot-manatee dark:text-dark-text-secondary">
                  Deposit required to confirm a reservation. Set to 0 for no fee.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ot-charade dark:text-dark-text">Photos</h2>

            <div>
              <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-2">
                Cover Photo
              </label>
              {coverPreview ? (
                <div className="relative inline-block">
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="w-48 h-32 object-cover rounded-ot-btn border border-ot-iron dark:border-dark-border"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveCover}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="w-48 h-32 border-2 border-dashed border-ot-iron dark:border-dark-border rounded-ot-btn flex flex-col items-center justify-center gap-1 text-ot-manatee dark:text-dark-text-secondary hover:border-ot-charade hover:text-ot-charade dark:hover:border-dark-primary dark:hover:text-dark-text transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                    />
                  </svg>
                  <span className="text-xs font-medium">Upload cover</span>
                </button>
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleCoverSelect}
                className="hidden"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-2">
                Gallery Photos
              </label>
              <div className="grid grid-cols-4 gap-3">
                {existingGallery.map((url) => (
                  <div key={url} className="relative group">
                    <img
                      src={`${API_URL}${url}`}
                      alt="Gallery"
                      className="w-full h-24 object-cover rounded-ot-btn border border-ot-iron dark:border-dark-border"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteExistingGallery(url)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
                {galleryPreviews.map((url, i) => (
                  <div key={url} className="relative group">
                    <img
                      src={url}
                      alt="New gallery"
                      className="w-full h-24 object-cover rounded-ot-btn border border-ot-primary/50"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryPending(i)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                    <span className="absolute bottom-1 left-1 bg-ot-primary text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                      New
                    </span>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="w-full h-24 border-2 border-dashed border-ot-iron dark:border-dark-border rounded-ot-btn flex flex-col items-center justify-center gap-1 text-ot-manatee dark:text-dark-text-secondary hover:border-ot-charade hover:text-ot-charade dark:hover:border-dark-primary dark:hover:text-dark-text transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span className="text-[10px] font-medium">Add photos</span>
                </button>
              </div>
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleGallerySelect}
                className="hidden"
              />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ot-charade dark:text-dark-text">
              Opening Hours
            </h2>
            <OpeningHoursEditor
              value={form.opening_hours}
              onChange={(hours) => updateField('opening_hours', hours)}
            />
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ot-charade dark:text-dark-text">Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  className={inputClasses}
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">
                  Dining Style
                </label>
                <input
                  type="text"
                  value={form.dining_style}
                  onChange={(e) => updateField('dining_style', e.target.value)}
                  className={inputClasses}
                  placeholder="Casual Dining"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">
                  Dress Code
                </label>
                <input
                  type="text"
                  value={form.dress_code}
                  onChange={(e) => updateField('dress_code', e.target.value)}
                  className={inputClasses}
                  placeholder="Casual Dress"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">
                  Neighborhood
                </label>
                <input
                  type="text"
                  value={form.neighborhood}
                  onChange={(e) => updateField('neighborhood', e.target.value)}
                  className={inputClasses}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">
                  Cross Street
                </label>
                <input
                  type="text"
                  value={form.cross_street}
                  onChange={(e) => updateField('cross_street', e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">
                  Parking Details
                </label>
                <input
                  type="text"
                  value={form.parking_details}
                  onChange={(e) => updateField('parking_details', e.target.value)}
                  className={inputClasses}
                  placeholder="Street Parking"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">
                  Executive Chef
                </label>
                <input
                  type="text"
                  value={form.executive_chef}
                  onChange={(e) => updateField('executive_chef', e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">
                  Public Transit
                </label>
                <input
                  type="text"
                  value={form.public_transit}
                  onChange={(e) => updateField('public_transit', e.target.value)}
                  className={inputClasses}
                  placeholder="Bus 42, Metro Line 1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">
                Payment Options
              </label>
              <input
                type="text"
                value={form.payment_options}
                onChange={(e) => updateField('payment_options', e.target.value)}
                className={inputClasses}
                placeholder="Visa, Mastercard, AMEX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">
                Delivery &amp; Takeout
              </label>
              <input
                type="text"
                value={form.delivery_takeout}
                onChange={(e) => updateField('delivery_takeout', e.target.value)}
                className={inputClasses}
                placeholder="Order direct"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">
                Catering
              </label>
              <textarea
                value={form.catering_info}
                onChange={(e) => updateField('catering_info', e.target.value)}
                rows={3}
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">
                Private Party Facilities
              </label>
              <textarea
                value={form.private_party_info}
                onChange={(e) => updateField('private_party_info', e.target.value)}
                rows={3}
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">
                Additional
              </label>
              <textarea
                value={form.additional_info}
                onChange={(e) => updateField('additional_info', e.target.value)}
                rows={2}
                className={inputClasses}
                placeholder="Bar/Lounge, Vegan, Wheelchair Access, ..."
              />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ot-charade dark:text-dark-text">Menu</h2>
            <div className="space-y-6">
              {form.menu.map((category: MenuCategory, ci: number) => (
                <div
                  key={ci}
                  className="border border-ot-iron dark:border-dark-border rounded-ot-card p-4 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={category.name}
                      onChange={(e) => {
                        const updated = form.menu.map((c, i) =>
                          i === ci ? { ...c, name: e.target.value } : c,
                        );
                        updateField('menu', updated);
                      }}
                      placeholder="Category name (e.g. Starters)"
                      className={inputClasses}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateField(
                          'menu',
                          form.menu.filter((_, i) => i !== ci),
                        )
                      }
                      className="text-ot-manatee hover:text-red-500 dark:text-dark-text-secondary dark:hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-2 pl-2">
                    {category.items.map((item, ii: number) => (
                      <div key={ii} className="grid grid-cols-[1fr_6rem_1fr_auto] gap-2 items-start">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => {
                            const updated = form.menu.map((c, i) =>
                              i === ci
                                ? { ...c, items: c.items.map((it, j) => j === ii ? { ...it, name: e.target.value } : it) }
                                : c,
                            );
                            updateField('menu', updated);
                          }}
                          placeholder="Item name"
                          className={inputClasses}
                        />
                        <input
                          type="text"
                          value={item.price}
                          onChange={(e) => {
                            const updated = form.menu.map((c, i) =>
                              i === ci
                                ? { ...c, items: c.items.map((it, j) => j === ii ? { ...it, price: e.target.value } : it) }
                                : c,
                            );
                            updateField('menu', updated);
                          }}
                          placeholder="€0.00"
                          className={inputClasses}
                        />
                        <input
                          type="text"
                          value={item.description ?? ''}
                          onChange={(e) => {
                            const updated = form.menu.map((c, i) =>
                              i === ci
                                ? { ...c, items: c.items.map((it, j) => j === ii ? { ...it, description: e.target.value } : it) }
                                : c,
                            );
                            updateField('menu', updated);
                          }}
                          placeholder="Description (optional)"
                          className={inputClasses}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = form.menu.map((c, i) =>
                              i === ci ? { ...c, items: c.items.filter((_, j) => j !== ii) } : c,
                            );
                            updateField('menu', updated);
                          }}
                          className="text-ot-manatee hover:text-red-500 dark:text-dark-text-secondary dark:hover:text-red-400 transition-colors mt-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = form.menu.map((c, i) =>
                          i === ci ? { ...c, items: [...c.items, { name: '', price: '', description: '' }] } : c,
                        );
                        updateField('menu', updated);
                      }}
                      className="text-xs text-ot-primary dark:text-dark-primary font-bold hover:underline"
                    >
                      + Add item
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => updateField('menu', [...form.menu, { name: '', items: [] }])}
                className="text-sm text-ot-primary dark:text-dark-primary font-bold hover:underline"
              >
                + Add category
              </button>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ot-charade dark:text-dark-text">FAQs</h2>
            <div className="space-y-3">
              {form.faqs.map((faq: FaqItem, i: number) => (
                <div
                  key={i}
                  className="border border-ot-iron dark:border-dark-border rounded-ot-card p-4 space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) => {
                        const updated = form.faqs.map((f, j) =>
                          j === i ? { ...f, question: e.target.value } : f,
                        );
                        updateField('faqs', updated);
                      }}
                      placeholder="Question"
                      className={inputClasses}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateField(
                          'faqs',
                          form.faqs.filter((_, j) => j !== i),
                        )
                      }
                      className="text-ot-manatee hover:text-red-500 dark:text-dark-text-secondary dark:hover:text-red-400 transition-colors mt-2 flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <textarea
                    value={faq.answer}
                    onChange={(e) => {
                      const updated = form.faqs.map((f, j) =>
                        j === i ? { ...f, answer: e.target.value } : f,
                      );
                      updateField('faqs', updated);
                    }}
                    placeholder="Answer"
                    rows={2}
                    className={inputClasses}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => updateField('faqs', [...form.faqs, { question: '', answer: '' }])}
                className="text-sm text-ot-primary dark:text-dark-primary font-bold hover:underline"
              >
                + Add FAQ
              </button>
            </div>
          </section>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading || uploadingPhotos}
              className="bg-ot-charade dark:bg-dark-primary text-white px-6 py-2.5 rounded-ot-btn text-sm font-bold hover:bg-ot-primary-dark transition-colors disabled:opacity-50"
            >
              {uploadingPhotos
                ? 'Uploading photos...'
                : loading
                  ? isEditing
                    ? 'Saving...'
                    : 'Creating...'
                  : isEditing
                    ? 'Save Changes'
                    : 'Create Restaurant'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard/restaurants')}
              className="border border-ot-iron dark:border-dark-border text-ot-charade dark:text-dark-text px-6 py-2.5 rounded-ot-btn text-sm font-medium hover:bg-ot-athens-gray dark:hover:bg-dark-surface transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default DashboardRestaurantFormPage;
