import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Autocomplete } from './ui/autocomplete';
import { useRecipes } from '../hooks/useFirebaseStorage';
import { Recipe } from '../types';
import { FLOUR_TYPES } from '../data/flourTypes';
import { X, Plus } from 'lucide-react';

interface EditRecipeModalProps {
  recipe: Recipe;
  isOpen: boolean;
  onClose: () => void;
}

interface FlourInput {
  type: string;
  amount: string;
}

interface RecipeFormData {
  name: string;
  flours: FlourInput[];
  water: string;
  starter: string;
  salt: string;
  bake_length: string;
  notes: string;
}

export function EditRecipeModal({ recipe, isOpen, onClose }: EditRecipeModalProps) {
  const { updateRecipe } = useRecipes();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<RecipeFormData>({
    name: recipe.name,
    flours: recipe.flours.map((flour: any) => ({ type: flour.type, amount: flour.amount.toString() })),
    water: recipe.water.toString(),
    starter: recipe.starter.toString(),
    salt: recipe.salt.toString(),
    bake_length: recipe.bake_length.toString(),
    notes: recipe.notes
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: recipe.name,
        flours: recipe.flours.map((flour: any) => ({ type: flour.type, amount: flour.amount.toString() })),
        water: recipe.water.toString(),
        starter: recipe.starter.toString(),
        salt: recipe.salt.toString(),
        bake_length: recipe.bake_length.toString(),
        notes: recipe.notes
      });
    }
  }, [recipe, isOpen]);

  const handleInputChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleFlourChange = (index: number, field: keyof FlourInput) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      flours: prev.flours.map((flour, i) => 
        i === index ? { ...flour, [field]: e.target.value } : flour
      )
    }));
  };

  const addFlour = () => {
    setFormData(prev => ({
      ...prev,
      flours: [...prev.flours, { type: '', amount: '' }]
    }));
  };

  const removeFlour = (index: number) => {
    setFormData(prev => ({
      ...prev,
      flours: prev.flours.filter((_, i) => i !== index)
    }));
  };

  const getTotalFlour = () => {
    return formData.flours.reduce((sum, flour) => sum + (parseFloat(flour.amount) || 0), 0);
  };

  const calculateHydration = () => {
    const totalFlour = formData.flours.reduce((sum, flour) => sum + (parseFloat(flour.amount) || 0), 0);
    const water = parseFloat(formData.water) || 0;
    return totalFlour > 0 ? Math.round((water / totalFlour) * 100) : 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const flours = formData.flours
        .filter(f => f.type && f.amount)
        .map(f => ({
          type: f.type,
          amount: parseFloat(f.amount) || 0,
          percentage: 0 // Will be calculated
        }));

      const totalFlour = flours.reduce((sum, f) => sum + f.amount, 0);
      
      // Calculate percentages
      const floursWithPercentage = flours.map(f => ({
        ...f,
        percentage: totalFlour > 0 ? Math.round((f.amount / totalFlour) * 100) : 0
      }));

      await updateRecipe(recipe.id, {
        name: formData.name,
        flours: floursWithPercentage,
        water: parseFloat(formData.water) || 0,
        starter: parseFloat(formData.starter) || 0,
        salt: parseFloat(formData.salt) || 0,
        bake_length: parseFloat(formData.bake_length) || 0,
        hydration: calculateHydration(),
        notes: formData.notes
      });

      onClose();
    } catch (error) {
      console.error('Failed to update recipe:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !recipe) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Edit Recipe</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Recipe Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleInputChange('name')}
              required
            />
          </div>

          {/* Flours Section - Full Width */}
          <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Flours</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addFlour}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Flour
              </Button>
            </div>
            
            <div className="space-y-3">
              {formData.flours.map((flour, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Label className="text-sm">Flour Type</Label>
                    <Autocomplete
                      value={flour.type}
                      onChange={(value) => handleFlourChange(index, 'type')({ target: { value } } as React.ChangeEvent<HTMLInputElement>)}
                      options={FLOUR_TYPES}
                      placeholder="e.g., Bread Flour, Whole Wheat"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm">Amount (g)</Label>
                    <Input
                      type="number"
                      value={flour.amount}
                      onChange={handleFlourChange(index, 'amount')}
                      placeholder="500"
                      required
                    />
                  </div>
                  {formData.flours.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeFlour(index)}
                      className="px-3"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            {getTotalFlour() > 0 && (
              <div className="pt-2 border-t border-gray-200">
                <div className="text-sm font-medium text-gray-700">
                  Total Flour: {getTotalFlour()}g
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="space-y-2">
              <Label htmlFor="water">Water (g)</Label>
              <Input
                id="water"
                type="number"
                value={formData.water}
                onChange={handleInputChange('water')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="starter">Starter (g)</Label>
              <Input
                id="starter"
                type="number"
                value={formData.starter}
                onChange={handleInputChange('starter')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salt">Salt (g)</Label>
              <Input
                id="salt"
                type="number"
                value={formData.salt}
                onChange={handleInputChange('salt')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Hydration</Label>
              <div className="h-10 w-full rounded-md border border-input bg-gray-50 px-3 py-2 text-sm">
                {calculateHydration()}%
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bake_length">Bake Length (minutes)</Label>
              <Input
                id="bake_length"
                type="number"
                value={formData.bake_length}
                onChange={handleInputChange('bake_length')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Baking Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={handleInputChange('notes')}
              rows={4}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Updating...' : 'Update Recipe'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
