import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Autocomplete } from './ui/autocomplete';
import { useRecipes } from '../hooks/useFirebaseStorage';
import { FLOUR_TYPES } from '../data/flourTypes';
import { Plus, X } from 'lucide-react';

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

export function RecipeForm({ onClose }: { onClose?: () => void } = {}) {
  const { addRecipe } = useRecipes();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<RecipeFormData>({
    name: '',
    flours: [{ type: 'Bread Flour', amount: '' }],
    water: '',
    starter: '',
    salt: '',
    bake_length: '',
    notes: ''
  });

  const handleInputChange = (field: keyof RecipeFormData) => (
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

  const calculateHydration = () => {
    const totalFlour = formData.flours.reduce((sum, flour) => sum + (parseFloat(flour.amount) || 0), 0);
    const water = parseFloat(formData.water) || 0;
    return totalFlour > 0 ? Math.round((water / totalFlour) * 100) : 0;
  };

  const getTotalFlour = () => {
    return formData.flours.reduce((sum, flour) => sum + (parseFloat(flour.amount) || 0), 0);
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

      await addRecipe({
        name: formData.name,
        flours: floursWithPercentage,
        water: parseFloat(formData.water) || 0,
        starter: parseFloat(formData.starter) || 0,
        salt: parseFloat(formData.salt) || 0,
        bake_length: parseFloat(formData.bake_length) || 0,
        hydration: calculateHydration(),
        notes: formData.notes
      });

      // Reset form
      setFormData({
        name: '',
        flours: [{ type: 'Bread Flour', amount: '' }],
        water: '',
        starter: '',
        salt: '',
        bake_length: '',
        notes: ''
      });

      // Trigger success event
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('recipeFormSuccess'));
      }
    } catch (error) {
      console.error('Failed to save recipe:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Add New Recipe</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Recipe Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={handleInputChange('name')}
            placeholder="Classic Sourdough"
            required
          />
        </div>

        {/* Flours Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Flours</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addFlour}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Flour
            </Button>
          </div>
          
          {formData.flours.map((flour, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1 space-y-2">
                <Label>Flour Type</Label>
                <Autocomplete
                  value={flour.type}
                  onChange={(value) => handleFlourChange(index, 'type')({ target: { value } } as React.ChangeEvent<HTMLInputElement>)}
                  options={FLOUR_TYPES}
                  placeholder="e.g., Bread Flour, Whole Wheat"
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label>Amount (g)</Label>
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
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        
        {getTotalFlour() > 0 && (
          <div className="text-sm text-gray-600">
            Total Flour: {getTotalFlour()}g
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
            placeholder="375"
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
            placeholder="100"
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
            placeholder="10"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Hydration</Label>
          <div className="h-10 w-full rounded-md border border-input bg-gray-50 px-3 py-2 text-sm">
            {calculateHydration()}%
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bake_length">Bake Length (minutes)</Label>
        <Input
          id="bake_length"
          type="number"
          value={formData.bake_length}
          onChange={handleInputChange('bake_length')}
          placeholder="45"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={handleInputChange('notes')}
          placeholder="Any special instructions or observations..."
          rows={3}
        />
      </div>

      <Button 
        type="submit" 
        disabled={isSubmitting || !formData.name || getTotalFlour() === 0}
        className="w-full"
      >
        {isSubmitting ? 'Creating Recipe...' : 'Create Recipe'}
      </Button>
      </form>
    </div>
  );
}
