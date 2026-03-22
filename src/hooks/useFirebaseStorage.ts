import { useState, useEffect } from 'react';
import { Recipe, Loaf } from '../types';
import { firebaseStorage } from '../utils/firebaseStorage';

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRecipes = async () => {
      try {
        setLoading(true);
        const data = await firebaseStorage.getRecipes();
        setRecipes(data);
        setError(null);
      } catch (error) {
        console.error('Failed to load recipes:', error);
        setError('Failed to load recipes');
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();
  }, []);

  const addRecipe = async (recipe: Omit<Recipe, 'id' | 'createdAt'>) => {
    try {
      const newRecipe = await firebaseStorage.saveRecipe(recipe);
      setRecipes(prev => [newRecipe, ...prev]);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('recipeAdded', { detail: newRecipe }));
      
      return newRecipe;
    } catch (error) {
      console.error('Failed to add recipe:', error);
      setError('Failed to add recipe');
      throw error;
    }
  };

  const updateRecipe = async (id: string, updates: Partial<Recipe>) => {
    try {
      const updated = await firebaseStorage.updateRecipe(id, updates);
      if (updated) {
        setRecipes(prev => prev.map(r => r.id === id ? updated : r));
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('recipeUpdated', { detail: { id, updates } }));
      }
      return updated;
    } catch (error) {
      console.error('Failed to update recipe:', error);
      setError('Failed to update recipe');
      throw error;
    }
  };

  const deleteRecipe = async (id: string) => {
    try {
      const success = await firebaseStorage.deleteRecipe(id);
      if (success) {
        setRecipes(prev => prev.filter(r => r.id !== id));
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('recipeDeleted', { detail: { id } }));
      }
      return success;
    } catch (error) {
      console.error('Failed to delete recipe:', error);
      setError('Failed to delete recipe');
      throw error;
    }
  };

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await firebaseStorage.getRecipes();
      setRecipes(data);
      setError(null);
    } catch (error) {
      console.error('Failed to refresh recipes:', error);
      setError('Failed to refresh recipes');
    } finally {
      setLoading(false);
    }
  };

  return {
    recipes,
    loading,
    error,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    refresh
  };
}

export function useLoaves() {
  const [loaves, setLoaves] = useState<Loaf[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLoaves = async () => {
      try {
        setLoading(true);
        const data = await firebaseStorage.getLoaves();
        setLoaves(data);
        setError(null);
      } catch (error) {
        console.error('Failed to load loaves:', error);
        setError('Failed to load loaves');
      } finally {
        setLoading(false);
      }
    };

    loadLoaves();
  }, []);

  const addLoaf = async (loaf: Omit<Loaf, 'id' | 'createdAt'>) => {
    try {
      const newLoaf = await firebaseStorage.saveLoaf(loaf);
      setLoaves(prev => [newLoaf, ...prev]);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('loafAdded', { detail: newLoaf }));
      
      return newLoaf;
    } catch (error) {
      console.error('Failed to add loaf:', error);
      setError('Failed to add loaf');
      throw error;
    }
  };

  const updateLoaf = async (id: string, updates: Partial<Loaf>) => {
    try {
      const updated = await firebaseStorage.updateLoaf(id, updates);
      if (updated) {
        setLoaves(prev => prev.map(l => l.id === id ? updated : l));
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('loafUpdated', { detail: { id, updates } }));
      }
      return updated;
    } catch (error) {
      console.error('Failed to update loaf:', error);
      setError('Failed to update loaf');
      throw error;
    }
  };

  const deleteLoaf = async (id: string) => {
    try {
      const success = await firebaseStorage.deleteLoaf(id);
      if (success) {
        setLoaves(prev => prev.filter(l => l.id !== id));
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('loafDeleted', { detail: { id } }));
      }
      return success;
    } catch (error) {
      console.error('Failed to delete loaf:', error);
      setError('Failed to delete loaf');
      throw error;
    }
  };

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await firebaseStorage.getLoaves();
      setLoaves(data);
      setError(null);
    } catch (error) {
      console.error('Failed to refresh loaves:', error);
      setError('Failed to refresh loaves');
    } finally {
      setLoading(false);
    }
  };

  return {
    loaves,
    loading,
    error,
    addLoaf,
    updateLoaf,
    deleteLoaf,
    refresh
  };
}
