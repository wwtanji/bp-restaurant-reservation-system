import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { apiFetch } from '../../utils/api';
import { useNotification } from '../../context/NotificationContext';
import { Table, TableFormData } from '../../interfaces/table';

const INITIAL_FORM: TableFormData = {
  table_number: 1,
  capacity: 2,
};

const DashboardTableFormPage: React.FC = () => {
  const { restaurantId, tableId } = useParams<{ restaurantId: string; tableId: string }>();
  const navigate = useNavigate();
  const { show } = useNotification();
  const isEditing = !!tableId;

  const [form, setForm] = useState<TableFormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);

  useEffect(() => {
    if (!tableId || !restaurantId) return;
    apiFetch<Table>(`/owners/restaurants/${restaurantId}/tables/${tableId}`)
      .then((table) => {
        setForm({
          table_number: table.table_number,
          capacity: table.capacity,
        });
      })
      .catch(() => {
        show('Failed to load table', 'error');
        navigate(`/dashboard/restaurants/${restaurantId}/tables`);
      })
      .finally(() => setFetching(false));
  }, [tableId, restaurantId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEditing
        ? `/owners/restaurants/${restaurantId}/tables/${tableId}`
        : `/owners/restaurants/${restaurantId}/tables`;
      const method = isEditing ? 'PUT' : 'POST';

      await apiFetch(url, {
        method,
        body: JSON.stringify(form),
      });

      show(isEditing ? 'Table updated successfully' : 'Table created successfully', 'success');
      navigate(`/dashboard/restaurants/${restaurantId}/tables`);
    } catch (err) {
      show(err instanceof Error ? err.message : 'Something went wrong', 'error');
    } finally {
      setLoading(false);
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

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(`/dashboard/restaurants/${restaurantId}/tables`)}
            className="text-ot-manatee dark:text-dark-text-secondary hover:text-ot-charade dark:hover:text-dark-text transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-ot-charade dark:text-dark-text">
            {isEditing ? 'Edit Table' : 'Add Table'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-paper rounded-xl border border-ot-iron dark:border-dark-border p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-ot-charade dark:text-dark-text mb-1.5">
              Table Number
            </label>
            <input
              type="number"
              name="table_number"
              value={form.table_number}
              onChange={handleChange}
              min={1}
              required
              className="w-full px-4 py-3 border border-ot-iron dark:border-dark-border rounded-ot-btn text-sm text-ot-charade dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-ot-primary dark:ring-dark-primary bg-white dark:bg-dark-surface"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-ot-charade dark:text-dark-text mb-1.5">
              Capacity (seats)
            </label>
            <input
              type="number"
              name="capacity"
              value={form.capacity}
              onChange={handleChange}
              min={1}
              max={20}
              required
              className="w-full px-4 py-3 border border-ot-iron dark:border-dark-border rounded-ot-btn text-sm text-ot-charade dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-ot-primary dark:ring-dark-primary bg-white dark:bg-dark-surface"
            />
            <p className="mt-1 text-xs text-ot-manatee dark:text-dark-text-secondary">
              Maximum number of guests this table can accommodate (1-20)
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-sm font-bold text-white bg-ot-charade dark:bg-dark-primary rounded-ot-btn hover:bg-ot-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? (isEditing ? 'Updating...' : 'Creating...')
              : (isEditing ? 'Update Table' : 'Create Table')}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default DashboardTableFormPage;
