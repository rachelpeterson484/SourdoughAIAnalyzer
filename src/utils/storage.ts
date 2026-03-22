import { Recipe, Loaf } from '../types';

const STORAGE_KEYS = {
  RECIPES: 'sourdough_recipes',
  LOAVES: 'sourdough_loaves'
};

export class StorageManager {
  // Recipe operations
  static getRecipes(): Recipe[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECIPES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading recipes:', error);
      return [];
    }
  }

  static saveRecipe(recipe: Omit<Recipe, 'id' | 'createdAt'>): Recipe {
    const recipes = this.getRecipes();
    const newRecipe: Recipe = {
      ...recipe,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      hydration: Math.round((recipe.water / recipe.flours.reduce((sum, f) => sum + f.amount, 0)) * 100)
    };
    
    recipes.push(newRecipe);
    localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipes));
    return newRecipe;
  }

  static updateRecipe(id: string, updates: Partial<Recipe>): Recipe | null {
    const recipes = this.getRecipes();
    const index = recipes.findIndex(r => r.id === id);
    
    if (index === -1) return null;
    
    recipes[index] = { ...recipes[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipes));
    return recipes[index];
  }

  static deleteRecipe(id: string): boolean {
    const recipes = this.getRecipes();
    const filteredRecipes = recipes.filter(r => r.id !== id);
    
    if (filteredRecipes.length === recipes.length) return false;
    
    localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(filteredRecipes));
    return true;
  }

  // Loaf operations
  static getLoaves(): Loaf[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOAVES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading loaves:', error);
      return [];
    }
  }

  static saveLoaf(loaf: Omit<Loaf, 'id' | 'createdAt'>): Loaf {
    const loaves = this.getLoaves();
    const newLoaf: Loaf = {
      ...loaf,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };
    
    loaves.push(newLoaf);
    localStorage.setItem(STORAGE_KEYS.LOAVES, JSON.stringify(loaves));
    return newLoaf;
  }

  static updateLoaf(id: string, updates: Partial<Loaf>): Loaf | null {
    const loaves = this.getLoaves();
    const index = loaves.findIndex(l => l.id === id);
    
    if (index === -1) return null;
    
    loaves[index] = { ...loaves[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.LOAVES, JSON.stringify(loaves));
    return loaves[index];
  }

  static deleteLoaf(id: string): boolean {
    const loaves = this.getLoaves();
    const filteredLoaves = loaves.filter(l => l.id !== id);
    
    if (filteredLoaves.length === loaves.length) return false;
    
    localStorage.setItem(STORAGE_KEYS.LOAVES, JSON.stringify(filteredLoaves));
    return true;
  }

  // Utility methods
  static getRecipeById(id: string): Recipe | null {
    const recipes = this.getRecipes();
    return recipes.find(r => r.id === id) || null;
  }

  static getLoavesByRecipeId(recipeId: string): Loaf[] {
    const loaves = this.getLoaves();
    return loaves.filter(l => l.recipeId === recipeId);
  }

  static clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.RECIPES);
    localStorage.removeItem(STORAGE_KEYS.LOAVES);
  }
}
