import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useRecipes, useLoaves } from '../hooks/useFirebaseStorage';
import { Recipe, Inclusion } from '../types';
import { Upload, X, Star, Plus } from 'lucide-react';
import { validateImageSize, compressImage } from '../utils/firebaseStorage';
import { processImageFallback, validateImageFile } from '../utils/imageFallback';

interface LoafFormData {
  recipeId: string;
  bakeDate: string;
  rating: number;
  notes: string;
  exteriorImageUrl: string; // Optional exterior photo
  crumbImageUrl: string; // Required crumb photo
  inclusions: Inclusion[];
  autolyse_time: string;
  bulk_time: string;
  proof_time: string;
  proof_type: string;
  bulk_temp: string;
}

export function LoafForm({ onClose }: { onClose: () => void }) {
  const { recipes } = useRecipes();
  const { addLoaf } = useLoaves();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const exteriorFileInputRef = useRef<HTMLInputElement>(null);
  const crumbFileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<LoafFormData>({
    recipeId: '',
    bakeDate: new Date().toISOString().split('T')[0],
    rating: 0,
    notes: '',
    exteriorImageUrl: '',
    crumbImageUrl: '',
    inclusions: [],
    autolyse_time: '',
    bulk_time: '',
    proof_time: '',
    proof_type: '',
    bulk_temp: ''
  });

  const [exteriorImagePreview, setExteriorImagePreview] = useState<string>('');
  const [crumbImagePreview, setCrumbImagePreview] = useState<string>('');


  const handleInputChange = (field: keyof LoafFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'exterior' | 'crumb') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Enhanced file validation
    const basicValidation = validateImageFile(file);
    if (!basicValidation.valid) {
      alert(basicValidation.error);
      return;
    }

    // Validate file size for compression
    const sizeValidation = validateImageSize(file);
    if (!sizeValidation.valid) {
      alert(sizeValidation.error);
      return;
    }

    try {
      // Try normal compression first
      const targetSize = type === 'crumb' ? 300 : 800;
      const compressedImage = await compressImage(file, targetSize);
      
      // Validate that we got a proper data URL
      if (!compressedImage || !compressedImage.startsWith('data:image/')) {
        throw new Error('Invalid compressed image format');
      }
      
      // Success with compression
      if (type === 'exterior') {
        setExteriorImagePreview(compressedImage);
        setFormData(prev => ({ ...prev, exteriorImageUrl: compressedImage }));
      } else {
        setCrumbImagePreview(compressedImage);
        setFormData(prev => ({ ...prev, crumbImageUrl: compressedImage }));
      }
      
    } catch (compressionError) {
      console.warn('Compression failed, trying fallback:', compressionError);
      
      // Try fallback processing
      try {
        const fallbackImage = await processImageFallback(file);
        
        if (!fallbackImage || !fallbackImage.startsWith('data:image/')) {
          throw new Error('Fallback processing also failed');
        }
        
        // Success with fallback
        if (type === 'exterior') {
          setExteriorImagePreview(fallbackImage);
          setFormData(prev => ({ ...prev, exteriorImageUrl: fallbackImage }));
        } else {
          setCrumbImagePreview(fallbackImage);
          setFormData(prev => ({ ...prev, crumbImageUrl: fallbackImage }));
        }
        
        // Notify user about fallback
        const sizeInKB = Math.round(fallbackImage.length / 1024);
        console.log(`Used fallback processing for image: ${sizeInKB}KB`);
        
      } catch (fallbackError) {
        console.error('Both compression and fallback failed:', fallbackError);
        const errorMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
        
        // Provide helpful error messages
        if (errorMessage.includes('Failed to load image') || errorMessage.includes('corrupted')) {
          alert('This image file appears to be corrupted or in an unsupported format. Please try:\n\n1. Saving the image as a JPEG\n2. Using a different image\n3. Taking a new photo with your phone');
        } else if (errorMessage.includes('too large')) {
          alert('The image file is too large. Please use an image under 10MB or try compressing it first.');
        } else {
          alert('Unable to process this image. Please try:\n\n1. A different image format (JPEG recommended)\n2. A smaller image file\n3. A different image altogether');
        }
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
      await addLoaf({
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

      window.dispatchEvent(new CustomEvent('loafAdded'));
      onClose();
    } catch (error) {
      console.error('Failed to save loaf:', error);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Add New Loaf</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
              <option value="" className="text-gray-500">Select a recipe</option>
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
            <Label htmlFor="bulk_temp">Bulk Fermentation Temperature (°F)</Label>
            <Input
              id="bulk_temp"
              type="number"
              value={formData.bulk_temp}
              onChange={handleInputChange('bulk_temp')}
              placeholder="75"
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
              <option value="" className="text-gray-500">Select proof type</option>
              <option value="room_temp">Room Temperature</option>
              <option value="cold_proof">Cold</option>
            </select>
          </div>

        </div>

        {/* Recipe Info Display */}
        {selectedRecipe && (
          <div className="bg-amber-50 p-4 rounded-md">
            <h4 className="font-medium text-amber-900 mb-2">Recipe Details</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>
                <span className="text-amber-700">Flour:</span> {selectedRecipe.flours.reduce((sum, f) => sum + f.amount, 0)}g
              </div>
              <div>
                <span className="text-amber-700">Water:</span> {selectedRecipe.water}g
              </div>
              <div>
                <span className="text-amber-700">Starter:</span> {selectedRecipe.starter}g
              </div>
              <div>
                <span className="text-amber-700">Salt:</span> {selectedRecipe.salt}g
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
                  <input
                    ref={exteriorFileInputRef}
                    id="exterior-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleImageUpload(e, 'exterior');
                      }
                    }}
                    style={{display: 'none'}}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => exteriorFileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Exterior Photo
                  </Button>
                </div>

                {exteriorImagePreview && (
                  <div className="relative mx-auto w-32">
                    <img
                      src={exteriorImagePreview}
                      alt="Exterior preview"
                      className="w-32 h-32 object-cover rounded-md"
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
                  <input
                    ref={crumbFileInputRef}
                    id="crumb-image-basic"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleImageUpload(e, 'crumb');
                      }
                    }}
                    style={{display: 'none'}}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => crumbFileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Crumb Photo (Basic)
                  </Button>
                </div>

                {crumbImagePreview && (
                  <div className="relative mx-auto w-32">
                    <img
                      src={crumbImagePreview}
                      alt="Crumb preview"
                      className="w-32 h-32 object-cover rounded-md"
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
                <strong>Crumb Photo:</strong> Take a clear shot of the sliced bread showing the interior structure and holes
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
            placeholder="How did this loaf turn out? Any observations about the crumb, crust, oven spring, etc..."
            className="h-32 resize-none"
          />
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting || !formData.recipeId}
          className="w-full"
        >
          {isSubmitting ? 'Saving Loaf...' : 'Save Loaf'}
        </Button>
      </form>
    </div>
  );
}
