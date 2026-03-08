import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import OpeningHoursEditor from '../../components/dashboard/OpeningHoursEditor';
import { apiFetch } from '../../utils/api';
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

      if (isEditing) {
        await apiFetch(`/owners/restaurants/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        show('Restaurant updated successfully', 'success');
      } else {
        await apiFetch('/owners/restaurants', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        show('Restaurant created successfully', 'success');
      }
      navigate('/dashboard/restaurants');
    } catch {
      show(isEditing ? 'Failed to update restaurant' : 'Failed to create restaurant', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ot-charade"></div>
        </div>
      </DashboardLayout>
    );
  }

  const inputClasses = "w-full border border-ot-iron rounded-ot-btn px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ot-charade/20 focus:border-ot-charade";

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-ot-charade mb-8">
          {isEditing ? 'Edit Restaurant' : 'Add Restaurant'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ot-charade">Basic Info</h2>
            <div>
              <label className="block text-sm font-medium text-ot-charade mb-1">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={inputClasses}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ot-charade mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
                className={inputClasses}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ot-charade mb-1">Cuisine *</label>
                <input
                  type="text"
                  value={form.cuisine}
                  onChange={(e) => updateField('cuisine', e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ot-charade mb-1">Price Range</label>
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
            <h2 className="text-lg font-semibold text-ot-charade">Contact</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ot-charade mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone_number}
                  onChange={(e) => updateField('phone_number', e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ot-charade mb-1">Email</label>
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
            <h2 className="text-lg font-semibold text-ot-charade">Location</h2>
            <div>
              <label className="block text-sm font-medium text-ot-charade mb-1">Address *</label>
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
                <label className="block text-sm font-medium text-ot-charade mb-1">City *</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ot-charade mb-1">Country</label>
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
                <label className="block text-sm font-medium text-ot-charade mb-1">Latitude</label>
                <input
                  type="text"
                  value={form.latitude}
                  onChange={(e) => updateField('latitude', e.target.value)}
                  className={inputClasses}
                  placeholder="48.1486"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ot-charade mb-1">Longitude</label>
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
            <h2 className="text-lg font-semibold text-ot-charade">Capacity & Media</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ot-charade mb-1">Max Capacity</label>
                <input
                  type="number"
                  min={1}
                  value={form.max_capacity}
                  onChange={(e) => updateField('max_capacity', parseInt(e.target.value) || 1)}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ot-charade mb-1">Cover Image URL</label>
                <input
                  type="url"
                  value={form.cover_image}
                  onChange={(e) => updateField('cover_image', e.target.value)}
                  className={inputClasses}
                  placeholder="https://..."
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ot-charade">Opening Hours</h2>
            <OpeningHoursEditor
              value={form.opening_hours}
              onChange={(hours) => updateField('opening_hours', hours)}
            />
          </section>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-ot-charade text-white px-6 py-2.5 rounded-ot-btn text-sm font-bold hover:bg-ot-primary-dark transition-colors disabled:opacity-50"
            >
              {loading
                ? (isEditing ? 'Saving...' : 'Creating...')
                : (isEditing ? 'Save Changes' : 'Create Restaurant')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard/restaurants')}
              className="border border-ot-iron text-ot-charade px-6 py-2.5 rounded-ot-btn text-sm font-medium hover:bg-ot-athens-gray transition-colors"
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
