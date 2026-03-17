import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { apiFetch } from '../utils/api';
import { FavoriteOut } from '../interfaces/favorite';

interface FavoritesContextValue {
  favorites: FavoriteOut[];
  favoriteIds: Set<number>;
  isFavorite: (restaurantId: number) => boolean;
  toggleFavorite: (restaurantId: number) => Promise<void>;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteOut[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setFavorites([]);
      setFavoriteIds(new Set());
      return;
    }

    setIsLoading(true);
    apiFetch<FavoriteOut[]>('/favorites/')
      .then((data) => {
        setFavorites(data);
        setFavoriteIds(new Set(data.map((f) => f.restaurant_id)));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  const isFavorite = useCallback(
    (restaurantId: number) => favoriteIds.has(restaurantId),
    [favoriteIds],
  );

  const toggleFavorite = useCallback(
    async (restaurantId: number) => {
      const wasFavorited = favoriteIds.has(restaurantId);

      if (wasFavorited) {
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(restaurantId);
          return next;
        });
        setFavorites((prev) => prev.filter((f) => f.restaurant_id !== restaurantId));
      } else {
        setFavoriteIds((prev) => new Set(prev).add(restaurantId));
      }

      try {
        if (wasFavorited) {
          await apiFetch(`/favorites/${restaurantId}`, { method: 'DELETE' });
        } else {
          const added = await apiFetch<FavoriteOut>(`/favorites/${restaurantId}`, {
            method: 'POST',
          });
          setFavorites((prev) => [added, ...prev]);
        }
      } catch {
        if (wasFavorited) {
          setFavoriteIds((prev) => new Set(prev).add(restaurantId));
          const data = await apiFetch<FavoriteOut[]>('/favorites/').catch(() => []);
          setFavorites(data);
        } else {
          setFavoriteIds((prev) => {
            const next = new Set(prev);
            next.delete(restaurantId);
            return next;
          });
          setFavorites((prev) => prev.filter((f) => f.restaurant_id !== restaurantId));
        }
      }
    },
    [favoriteIds],
  );

  return (
    <FavoritesContext.Provider
      value={{ favorites, favoriteIds, isFavorite, toggleFavorite, isLoading }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
