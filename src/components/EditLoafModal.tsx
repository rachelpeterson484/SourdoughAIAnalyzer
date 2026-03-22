import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useLoaves, useRecipes } from '../hooks/useFirebaseStorage';
import { Loaf, Recipe, Inclusion } from '../types';
import { Upload, X, Star, Plus } from 'lucide-react';
import { validateImageSize, compressImage } from '../utils/firebaseStorage';

interface EditLoafModalProps {
  loaf: Loaf;
  isOpen: boolean;
  onClose: () => void;
}

interface LoafFormData {
  recipeId: string;
  bakeDate: string;
  rating: number;
  notes: string;
  exteriorImageUrl: string;
  crumbImageUrl: string;
  inclusions: Inclusion[];
  autolyse_time: string;
  bulk_time: string;
  proof_time: string;
  proof_type: string;
  bulk_temp: string;
}

export function EditLoafModal({ loaf, isOpen, onClose }: EditLoafModalProps) {
  const { updateLoaf } = useLoaves();
  const { recipes } = useRecipes();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const exteriorFileInputRef = useRef<HTMLInputElement>(null);
  const crumbFileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<LoafFormData>({
    recipeId: loaf.recipeId,
    bakeDate: new Date(loaf.bakeDate).toISOString().split('T')[0],
    rating: loaf.rating || 0,
    notes: loaf.notes || '',
    exteriorImageUrl: loaf.exteriorImageUrl || '',
    crumbImageUrl: loaf.crumbImageUrl || '',
    inclusions: loaf.inclusions || [],
    autolyse_time: loaf.autolyse_time?.toString() || '',
    bulk_time: loaf.bulk_time?.toString() || '',
    proof_time: loaf.proof_time?.toString() || '',
    proof_type: loaf.proof_type || '',
    bulk_temp: loaf.bulk_temp?.toString() || ''
  });

  const [exteriorImagePreview, setExteriorImagePreview] = useState<string>('');
  const [crumbImagePreview, setCrumbImagePreview] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        recipeId: loaf.recipeId,
        bakeDate: new Date(loaf.bakeDate).toISOString().split('T')[0],
        rating: loaf.rating || 0,
        notes: loaf.notes || '',
        exteriorImageUrl: loaf.exteriorImageUrl || '',
        crumbImageUrl: loaf.crumbImageUrl || '',
        inclusions: loaf.inclusions || [],
        autolyse_time: loaf.autolyse_time?.toString() || '',
        bulk_time: loaf.bulk_time?.toString() || '',
        proof_time: loaf.proof_time?.toString() || '',
        proof_type: loaf.proof_type || '',
        bulk_temp: loaf.bulk_temp?.toString() || ''
      });
      setExteriorImagePreview(loaf.exteriorImageUrl || '');
      setCrumbImagePreview(loaf.crumbImageUrl || '');
    }
  }, [loaf, isOpen]);

  const handleInputChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'exterior' | 'crumb') => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Use different compression targets: 300KB for crumb (AI analysis), 800KB for exterior
        const targetSize = type === 'crumb' ? 300 : 800;
        const compressedImage = await compressImage(file, targetSize);
        
        if (type === 'exterior') {
          setExteriorImagePreview(compressedImage);
          setFormData(prev => ({ ...prev, exteriorImageUrl: compressedImage }));
        } else {
          setCrumbImagePreview(compressedImage);
          setFormData(prev => ({ ...prev, crumbImageUrl: compressedImage }));
        }
      } catch (error) {
        console.error('Image compression failed:', error);
        alert('Failed to process image. Please try a smaller image.');
      }
    }
  };

  const handleRatingClick = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const addInclusion = () => {
    setFormData(prev => ({
      ...prev,
      inclusions: [...prev.inclusions, { type: '', amount: 0 }]
    }));
  };

  const updateInclusion = (index: number, field: keyof Inclusion, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      inclusions: prev.inclusions.map((inclusion, i) => 
        i === index ? { ...inclusion, [field]: value } : inclusion
      )
    }));
  };

  const removeInclusion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      inclusions: prev.inclusions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateLoaf(loaf.id, {
        recipeId: formData.recipeId,
        bakeDate: new Date(formData.bakeDate),
        rating: formData.rating || undefined,
        notes: formData.notes || undefined,
        exteriorImageUrl: formData.exteriorImageUrl || undefined,
        crumbImageUrl: formData.crumbImageUrl || undefined,
        inclusions: formData.inclusions.length > 0 ? formData.inclusions : undefined,
        autolyse_time: parseFloat(formData.autolyse_time) || 0,
        bulk_time: parseFloat(formData.bulk_time) || 0,
        proof_time: parseFloat(formData.proof_time) || 0,
        proof_type: formData.proof_type || '',
        bulk_temp: parseFloat(formData.bulk_temp) || 0
      });

      window.dispatchEvent(new CustomEvent('loafUpdated'));
      onClose();
    } catch (error) {
      console.error('Failed to update loaf:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearImage = (type: 'exterior' | 'crumb') => {
    if (type === 'exterior') {
      setExteriorImagePreview('');
      setFormData(prev => ({ ...prev, exteriorImageUrl: '' }));
      if (exteriorFileInputRef.current) {
        exteriorFileInputRef.current.value = '';
      }
    } else {
      setCrumbImagePreview('');
      setFormData(prev => ({ ...prev, crumbImageUrl: '' }));
      if (crumbFileInputRef.current) {
        crumbFileInputRef.current.value = '';
      }
    }
  };

  const selectedRecipe = recipes.find(r => r.id === formData.recipeId);

  if (!isOpen || !loaf) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Edit Loaf</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recipeId">Recipe</Label>
              <select
                id="recipeId"
                value={formData.recipeId}
                onChange={handleInputChange('recipeId')}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                {recipes.map((recipe: Recipe) => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.name} ({recipe.hydration}% hydration)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bakeDate">Bake Date</Label>
              <Input
                id="bakeDate"
                type="date"
                value={formData.bakeDate}
                onChange={handleInputChange('bakeDate')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="autolyse_time">Autolyse Time (minutes)</Label>
              <Input
                id="autolyse_time"
                type="number"
                value={formData.autolyse_time}
                onChange={handleInputChange('autolyse_time')}
                placeholder="30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk_time">Bulk Fermentation (hours)</Label>
              <Input
                id="bulk_time"
                type="number"
                value={formData.bulk_time}
                onChange={handleInputChange('bulk_time')}
                placeholder="4"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proof_time">Proof Time (hours)</Label>
              <Input
                id="proof_time"
                type="number"
                value={formData.proof_time}
                onChange={handleInputChange('proof_time')}
                placeholder="2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proof_type">Proof Type</Label>
              <select
                id="proof_type"
                value={formData.proof_type}
                onChange={handleInputChange('proof_type')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select proof type</option>
                <option value="room_temp">Room Temperature</option>
                <option value="cold_proof">Cold Proof</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk_temp">Bulk Fermentation Temperature (°F)</Label>
              <Input
                id="bulk_temp"
                type="number"
                value={formData.bulk_temp}
                onChange={handleInputChange('bulk_temp')}
                placeholder="75"
              />
            </div>
          </div>

          {/* Recipe Info Display */}
          {selectedRecipe && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium text-gray-900 mb-2">Recipe Details</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Flour:</span> {selectedRecipe.flours.reduce((sum, f) => sum + f.amount, 0)}g
                </div>
                <div>
                  <span className="text-gray-600">Water:</span> {selectedRecipe.water}g
                </div>
                <div>
                  <span className="text-gray-600">Starter:</span> {selectedRecipe.starter}g
                </div>
                <div>
                  <span className="text-gray-600">Salt:</span> {selectedRecipe.salt}g
                </div>
              </div>
            </div>
          )}

          {/* Inclusions Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Inclusions</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addInclusion}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Inclusion
              </Button>
            </div>

            {formData.inclusions.length > 0 ? (
              <div className="space-y-2">
                {formData.inclusions.map((inclusion, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <Input
                      placeholder="Type (e.g., Olives, Nuts, Seeds)"
                      value={inclusion.type}
                      onChange={(e) => updateInclusion(index, 'type', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Amount (g)"
                      value={inclusion.amount || ''}
                      onChange={(e) => updateInclusion(index, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-24"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeInclusion(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                
                {/* Display as badges */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.inclusions
                    .filter(inc => inc.type && inc.amount > 0)
                    .map((inclusion, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {inclusion.type} ({inclusion.amount}g)
                      </span>
                    ))}
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-sm p-3 bg-gray-50 rounded-lg text-center">
                No inclusions added. Click "Add Inclusion" to add ingredients like olives, nuts, seeds, etc.
              </div>
            )}
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingClick(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= formData.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-400'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Photo Upload Section */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Exterior Photo (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="exterior-image">
                  Exterior Photo 
                  <span className="text-gray-500 text-sm ml-2">(Optional)</span>
                </Label>
                <div className="space-y-4">
                  <div>
                    <Input
                      ref={exteriorFileInputRef}
                      id="exterior-image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'exterior')}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => exteriorFileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Change Exterior Photo
                    </Button>
                  </div>

                  {exteriorImagePreview && (
                    <div className="relative">
                      <img
                        src={exteriorImagePreview}
                        alt="Exterior preview"
                        className="w-full h-48 object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => clearImage('exterior')}
                        className="absolute top-2 right-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Crumb Photo (Required) */}
              <div className="space-y-2">
                <Label htmlFor="crumb-image">
                  Crumb Photo 
                  <span className="text-red-500 text-sm ml-2">*</span>
                  <span className="text-gray-500 text-sm ml-1">(For AI Analysis)</span>
                </Label>
                <div className="space-y-4">
                  <div>
                    <Input
                      ref={crumbFileInputRef}
                      id="crumb-image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'crumb')}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => crumbFileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Change Crumb Photo
                    </Button>
                  </div>

                  {crumbImagePreview && (
                    <div className="relative">
                      <img
                        src={crumbImagePreview}
                        alt="Crumb preview"
                        className="w-full h-48 object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => clearImage('crumb')}
                        className="absolute top-2 right-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Photo Tips */}
            <div className="bg-blue-50 p-4 rounded-md">
              <h4 className="font-medium text-blue-900 mb-2">📸 Photo Tips</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <strong>Exterior Photo:</strong> Show the full loaf profile, crust color, and oven spring
                </div>
                <div>
                  <strong>Crumb Photo:</strong> Take a clear shot of sliced bread showing interior structure and holes
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Baking Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={handleInputChange('notes')}
              placeholder="How did this loaf turn out? Any observations about crumb, crust, oven spring, etc..."
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
              {isSubmitting ? 'Updating...' : 'Update Loaf'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
