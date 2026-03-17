import React, { useState, useMemo } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { AdminUser } from '../../interfaces/admin';
import { ROLE_LABELS, ROLE_BADGE, ROLE_OPTIONS } from '../../constants/admin';
import { apiFetch } from '../../utils/api';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import useFetch from '../../hooks/useFetch';
import useDebounce from '../../hooks/useDebounce';

const AdminUsersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const { show } = useNotification();
  const { user: currentUser } = useAuth();

  const debouncedQuery = useDebounce(searchQuery, 400);

  const fetchPath = useMemo(() => {
    const params = new URLSearchParams({ limit: '50' });
    if (debouncedQuery) params.set('q', debouncedQuery);
    if (roleFilter !== '') params.set('role', roleFilter);
    return `/admin/users?${params}`;
  }, [debouncedQuery, roleFilter]);

  const { data: users, isLoading, error, refetch } = useFetch<AdminUser[]>(fetchPath);

  const handleRoleChange = async (userId: number, newRole: number) => {
    try {
      await apiFetch(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      show('Role updated successfully', 'success');
      refetch();
    } catch {
      show('Failed to update role', 'error');
    }
  };

  const handleToggleLock = async (userId: number, locked: boolean) => {
    try {
      await apiFetch(`/admin/users/${userId}/lock`, {
        method: 'PATCH',
        body: JSON.stringify({ locked }),
      });
      show(locked ? 'User locked' : 'User unlocked', 'success');
      refetch();
    } catch {
      show('Failed to update lock status', 'error');
    }
  };

  const isLocked = (user: AdminUser) => {
    if (!user.locked_until) return false;
    return new Date(user.locked_until) > new Date();
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-ot-charade dark:text-dark-text">Users</h1>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full text-sm border border-ot-iron dark:border-dark-border rounded-ot-btn px-3 py-2 bg-white dark:bg-dark-surface text-ot-charade dark:text-dark-text outline-none focus:ring-2 focus:ring-ot-charade/30 dark:focus:ring-dark-primary/30 placeholder-gray-400 dark:placeholder-dark-text-secondary"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-sm border border-ot-iron dark:border-dark-border rounded-ot-btn px-3 py-2 bg-white dark:bg-dark-surface text-ot-charade dark:text-dark-text outline-none focus:ring-2 focus:ring-ot-charade/30 dark:focus:ring-dark-primary/30"
          >
            <option value="">All Roles</option>
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ot-charade dark:border-dark-primary" />
          </div>
        ) : error ? (
          <p className="text-red-500 text-sm">{error}</p>
        ) : (users ?? []).length === 0 ? (
          <div className="bg-white dark:bg-dark-paper rounded-xl border border-ot-iron dark:border-dark-border p-12 text-center">
            <p className="text-gray-500 dark:text-dark-text-secondary">No users found.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-paper rounded-xl border border-ot-iron dark:border-dark-border overflow-hidden">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="border-b border-ot-iron dark:border-dark-border bg-ot-athens-gray dark:bg-dark-surface">
                  <th className="text-left px-3 py-2.5 font-medium text-gray-500 dark:text-dark-text-secondary w-[18%]">
                    Name
                  </th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-500 dark:text-dark-text-secondary w-[24%]">
                    Email
                  </th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-500 dark:text-dark-text-secondary w-[10%]">
                    Role
                  </th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-500 dark:text-dark-text-secondary w-[10%]">
                    Status
                  </th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-500 dark:text-dark-text-secondary w-[10%]">
                    Joined
                  </th>
                  <th className="text-right px-3 py-2.5 font-medium text-gray-500 dark:text-dark-text-secondary w-[28%]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {(users ?? []).map((u) => {
                  const locked = isLocked(u);
                  const isSelf = currentUser?.id === u.id;
                  const badge = ROLE_BADGE[u.role] ?? ROLE_BADGE[0];
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-ot-iron/50 dark:border-dark-border last:border-0"
                    >
                      <td className="px-3 py-2.5 font-medium text-ot-charade dark:text-dark-text truncate">
                        {u.first_name} {u.last_name}
                      </td>
                      <td
                        className="px-3 py-2.5 text-gray-500 dark:text-dark-text-secondary truncate"
                        title={u.user_email}
                      >
                        {u.user_email}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}
                        >
                          {ROLE_LABELS[u.role] ?? 'Unknown'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          {locked ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                              Locked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 dark:text-green-400">
                              {u.email_verified ? (
                                <svg
                                  className="w-3.5 h-3.5 text-green-500"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  className="w-3.5 h-3.5 text-amber-500"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                              Active
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 dark:text-dark-text-secondary text-xs whitespace-nowrap">
                        {formatDate(u.registered_at)}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isSelf && (
                            <>
                              <select
                                value={u.role}
                                onChange={(e) => handleRoleChange(u.id, Number(e.target.value))}
                                className="text-xs border border-ot-iron dark:border-dark-border rounded-lg px-1.5 py-1 bg-white dark:bg-dark-surface text-ot-charade dark:text-dark-text outline-none"
                              >
                                {ROLE_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleToggleLock(u.id, !locked)}
                                className={`text-xs px-2.5 py-1 rounded-lg font-medium border transition-colors ${
                                  locked
                                    ? 'border-green-200 dark:border-green-800 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                                    : 'border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                                }`}
                              >
                                {locked ? 'Unlock' : 'Lock'}
                              </button>
                            </>
                          )}
                          {isSelf && (
                            <span className="text-xs text-gray-400 dark:text-dark-text-secondary italic">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsersPage;
