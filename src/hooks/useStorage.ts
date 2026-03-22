import { useState, useEffect } from 'react';
import { Recipe, Loaf } from '../types';
import { StorageManager } from '../utils/storage';

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecipes = () => {
      try {
        const data = StorageManager.getRecipes();
        setRecipes(data);
      } catch (error) {
        console.error('Failed to load recipes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sourdough_recipes') {
        loadRecipes();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addRecipe = (recipe: Omit<Recipe, 'id' | 'createdAt'>) => {
    const newRecipe = StorageManager.saveRecipe(recipe);
    setRecipes(prev => [...prev, newRecipe]);
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('recipeAdded', { detail: newRecipe }));
    return newRecipe;
  };

  const updateRecipe = (id: string, updates: Partial<Recipe>) => {
    const updated = StorageManager.updateRecipe(id, updates);
    if (updated) {
      setRecipes(prev => prev.map(r => r.id === id ? updated : r));
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('recipeUpdated', { detail: { id, updates } }));
    }
    return updated;
  };

  const deleteRecipe = (id: string) => {
    const success = StorageManager.deleteRecipe(id);
    if (success) {
      setRecipes(prev => prev.filter(r => r.id !== id));
    }
    return success;
  };

  return {
    recipes,
    loading,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    refresh: () => setRecipes(StorageManager.getRecipes())
  };
}

export function useLoaves() {
  const [loaves, setLoaves] = useState<Loaf[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLoaves = () => {
      try {
        const data = StorageManager.getLoaves();
        setLoaves(data);
      } catch (error) {
        console.error('Failed to load loaves:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLoaves();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sourdough_loaves') {
        loadLoaves();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addLoaf = (loaf: Omit<Loaf, 'id' | 'createdAt'>) => {
    const newLoaf = StorageManager.saveLoaf(loaf);
    setLoaves(prev => [...prev, newLoaf]);
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('loafAdded', { detail: newLoaf }));
    return newLoaf;
  };

  const updateLoaf = (id: string, updates: Partial<Loaf>) => {
    const updated = StorageManager.updateLoaf(id, updates);
    if (updated) {
      setLoaves(prev => prev.map(l => l.id === id ? updated : l));
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('loafUpdated', { detail: { id, updates } }));
    }
    return updated;
  };

  const deleteLoaf = (id: string) => {
    const success = StorageManager.deleteLoaf(id);
    if (success) {
      setLoaves(prev => prev.filter(l => l.id !== id));
    }
    return success;
  };

  return {
    loaves,
    loading,
    addLoaf,
    updateLoaf,
    deleteLoaf,
    refresh: () => setLoaves(StorageManager.getLoaves())
  };
}
