import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import OpeningHoursEditor from '../../components/dashboard/OpeningHoursEditor';
import { apiFetch, API_URL } from '../../utils/api';
import { useNotification } from '../../context/NotificationContext';
import { RestaurantFormData, OwnerRestaurant } from '../../interfaces/restaurant';
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
  opening_hours: createDefaultOpeningHours(),
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
          opening_hours: restaurant.opening_hours || createDefaultOpeningHours(),
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
        opening_hours: form.opening_hours,
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

      show(isEditing ? 'Restaurant updated successfully' : 'Restaurant created successfully', 'success');
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

  const inputClasses = "w-full border border-ot-iron dark:border-dark-border rounded-ot-btn px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ot-charade/20 focus:border-ot-charade dark:bg-dark-surface dark:text-dark-text";

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-ot-charade dark:text-dark-text mb-8">
          {isEditing ? 'Edit Restaurant' : 'Add Restaurant'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ot-charade dark:text-dark-text">Basic Info</h2>
            <div>
              <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={inputClasses}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
                className={inputClasses}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">Cuisine *</label>
                <input
                  type="text"
                  value={form.cuisine}
                  onChange={(e) => updateField('cuisine', e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">Price Range</label>
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
            <h2 className="text-lg font-semibold text-ot-charade dark:text-dark-text">Contact</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone_number}
                  onChange={(e) => updateField('phone_number', e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">Email</label>
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
              <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">Address *</label>
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
                <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">City *</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">Country</label>
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
                <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">Latitude</label>
                <input
                  type="text"
                  value={form.latitude}
                  onChange={(e) => updateField('latitude', e.target.value)}
                  className={inputClasses}
                  placeholder="48.1486"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">Longitude</label>
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
            <h2 className="text-lg font-semibold text-ot-charade dark:text-dark-text">Capacity</h2>
            <div>
              <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-1">Max Capacity</label>
              <input
                type="number"
                min={1}
                value={form.max_capacity}
                onChange={(e) => updateField('max_capacity', parseInt(e.target.value) || 1)}
                className={`${inputClasses} max-w-xs`}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ot-charade dark:text-dark-text">Photos</h2>

            <div>
              <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-2">Cover Photo</label>
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
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
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
              <label className="block text-sm font-medium text-ot-charade dark:text-dark-text mb-2">Gallery Photos</label>
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
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
            <h2 className="text-lg font-semibold text-ot-charade dark:text-dark-text">Opening Hours</h2>
            <OpeningHoursEditor
              value={form.opening_hours}
              onChange={(hours) => updateField('opening_hours', hours)}
            />
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
                  ? (isEditing ? 'Saving...' : 'Creating...')
                  : (isEditing ? 'Save Changes' : 'Create Restaurant')}
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
