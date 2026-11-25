import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { savedApi } from '../api/savedApi';
import { useAuth } from './AuthContext';

const ShortlistContext = createContext(null);

export function ShortlistProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [savedIds, setSavedIds] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [isShortlistLoading, setIsShortlistLoading] = useState(false);
  const [pendingIds, setPendingIds] = useState(new Set());

  const refreshSaved = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'tenant') {
      setSavedIds([]);
      setSavedItems([]);
      return;
    }

    setIsShortlistLoading(true);
    try {
      const data = await savedApi.getSavedProperties();
      setSavedItems(Array.isArray(data?.data) ? data.data : []);
      setSavedIds(Array.isArray(data?.savedPropertyIds) ? data.savedPropertyIds : []);
    } catch {
      setSavedItems([]);
      setSavedIds([]);
    } finally {
      setIsShortlistLoading(false);
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    refreshSaved();
  }, [refreshSaved]);

  const isSaved = useCallback(
    (propertyId) => savedIds.includes(propertyId),
    [savedIds]
  );

  const toggleSave = useCallback(
    async (propertyId) => {
      if (!isAuthenticated || user?.role !== 'tenant') {
        return { requiresAuth: true };
      }

      if (pendingIds.has(propertyId)) {
        return { ignored: true };
      }

      const currentlySaved = savedIds.includes(propertyId);

      setPendingIds((prev) => new Set(prev).add(propertyId));
      setSavedIds((prev) =>
        currentlySaved
          ? prev.filter((id) => id !== propertyId)
          : [...prev, propertyId]
      );
      if (currentlySaved) {
        setSavedItems((prev) =>
          prev.filter((item) => item.property?._id !== propertyId)
        );
      }

      try {
        if (currentlySaved) {
          await savedApi.removeSavedProperty(propertyId);
        } else {
          await savedApi.saveProperty(propertyId);
          await refreshSaved();
        }
        return { saved: !currentlySaved };
      } catch (error) {
        await refreshSaved();
        throw error;
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(propertyId);
          return next;
        });
      }
    },
    [isAuthenticated, pendingIds, refreshSaved, savedIds, user?.role]
  );

  return (
    <ShortlistContext.Provider
      value={{
        savedIds,
        savedItems,
        isShortlistLoading,
        isSaved,
        toggleSave,
        pendingIds,
        refreshSaved,
        refreshSavedIds: refreshSaved,
      }}
    >
      {children}
    </ShortlistContext.Provider>
  );
}

export function useShortlist() {
  const ctx = useContext(ShortlistContext);
  if (!ctx) {
    throw new Error('useShortlist must be used inside a ShortlistProvider');
  }
  return ctx;
}
