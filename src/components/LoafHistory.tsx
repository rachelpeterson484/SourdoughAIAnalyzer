import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { LoafForm } from './LoafForm';
import { EditLoafModal } from './EditLoafModal';
import { useLoaves, useRecipes } from '../hooks/useFirebaseStorage';
import { Loaf } from '../types';
import { Plus, Star, Calendar, Wheat, Edit, Trash2, TrendingUp, MoreHorizontal } from 'lucide-react';
import { AIAnalysisModal } from './AIAnalysisModal';

interface LoafHistoryProps {
  onAnalyzeLoaf?: (loaf: Loaf) => void;
}

export function LoafHistory({ onAnalyzeLoaf }: LoafHistoryProps) {
  const { loaves, loading, refresh: refreshLoaves, deleteLoaf } = useLoaves();
  const { recipes } = useRecipes();
  const [showLoafForm, setShowLoafForm] = useState(false);
  const [editingLoaf, setEditingLoaf] = useState<Loaf | null>(null);
  const [analysisModalLoaf, setAnalysisModalLoaf] = useState<Loaf | null>(null);

  const handleDeleteLoaf = async (loaf: Loaf) => {
    if (window.confirm('Are you sure you want to delete this loaf?')) {
      try {
        await deleteLoaf(loaf.id);
        window.dispatchEvent(new CustomEvent('loafUpdated'));
      } catch (error) {
        console.error('Failed to delete loaf:', error);
      }
    }
  };

  const handleAnalyzeLoaf = (loaf: Loaf) => {
    // Open the modal instead of switching tabs
    setAnalysisModalLoaf(loaf);
  };

  const formatProofType = (proofType: string): string => {
    switch (proofType) {
      case 'cold_proof':
        return 'Cold Proof';
      case 'room_temp':
        return 'Room Temperature';
      default:
        return proofType;
    }
  };

  useEffect(() => {
    const handleLoafUpdate = () => {
      refreshLoaves();
    };

    window.addEventListener('loafAdded', handleLoafUpdate);
    window.addEventListener('loafUpdated', handleLoafUpdate);
    
    return () => {
      window.removeEventListener('loafAdded', handleLoafUpdate);
      window.removeEventListener('loafUpdated', handleLoafUpdate);
    };
  }, [refreshLoaves]);

  const getRecipeName = (recipeId: string): string => {
    const recipe = recipes.find(r => r.id === recipeId);
    return recipe?.name || 'Unknown Recipe';
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-crust-500 text-crust-500'
                : 'text-bakery-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-bakery-600">
        <div>Loading loaves...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-bakery-900 font-serif">My Loaves</h2>
        <Button onClick={() => setShowLoafForm(true)} className="bg-bakery-600 hover:bg-bakery-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Loaf
        </Button>
      </div>

      {showLoafForm && (
        <Card className="border-bakery-200">
          <CardContent className="p-6">
            <LoafForm onClose={() => setShowLoafForm(false)} />
          </CardContent>
        </Card>
      )}

      {loaves.length === 0 ? (
        <Card className="border-bakery-200">
          <CardContent className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-bakery-100 rounded-full flex items-center justify-center mb-4">
              <Wheat className="w-8 h-8 text-bakery-500" />
            </div>
            <p className="text-bakery-600 mb-4">Your baking journey starts here. Log your first loaf!</p>
            <Button onClick={() => setShowLoafForm(true)} className="bg-bakery-600 hover:bg-bakery-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add First Loaf
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loaves.map((loaf: Loaf) => (
            <Card key={loaf.id} className="hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border-bakery-200">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-bakery-900">{getRecipeName(loaf.recipeId)}</CardTitle>
                    <CardDescription className="flex items-center mt-1 text-bakery-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(loaf.bakeDate)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {loaf.rating && renderStars(loaf.rating)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingLoaf(loaf)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteLoaf(loaf)} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAnalyzeLoaf(loaf)}>
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Analyze
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Loaf Image - prioritize exterior photo, fallback to crumb photo */}
                {loaf.exteriorImageUrl ? (
                  <div className="w-full h-48 bg-bakery-100 rounded-md overflow-hidden">
                    <img
                      src={loaf.exteriorImageUrl}
                      alt={getRecipeName(loaf.recipeId)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : loaf.crumbImageUrl ? (
                  <div className="w-full h-48 bg-bakery-100 rounded-md overflow-hidden">
                    <img
                      src={loaf.crumbImageUrl}
                      alt={`${getRecipeName(loaf.recipeId)} - Crumb`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-bakery-100 rounded-md flex items-center justify-center">
                    <div className="text-bakery-400 text-center">
                      <Wheat className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">No photos</p>
                    </div>
                  </div>
                )}

                {/* Loaf Notes */}
                {loaf.notes && (
                  <div className="text-sm text-bakery-600">
                    <p className="line-clamp-3">{loaf.notes}</p>
                  </div>
                )}

                {/* Inclusions */}
                {loaf.inclusions && loaf.inclusions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {loaf.inclusions.map((inclusion, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-bakery-100 text-bakery-700"
                      >
                        {inclusion.type} ({inclusion.amount}g)
                      </span>
                    ))}
                  </div>
                )}

                {/* Recipe Info */}
                <div className="text-xs text-bakery-500 pt-2 border-t border-bakery-200">
                  <div className="flex justify-between">
                    <span>Baked: {formatDate(loaf.bakeDate)}</span>
                    {loaf.rating && <span>Rating: {loaf.rating}/5</span>}
                  </div>
                  {(loaf.autolyse_time > 0 || loaf.bulk_time > 0 || loaf.proof_time > 0 || loaf.proof_type || loaf.bulk_temp) && (
                    <div className="flex justify-between mt-1 text-xs">
                      {loaf.autolyse_time > 0 && <span>Autolyse: {loaf.autolyse_time}m</span>}
                      {loaf.bulk_time > 0 && <span>Bulk: {loaf.bulk_time}h</span>}
                      {loaf.proof_time > 0 && <span>Proof: {loaf.proof_time}h</span>}
                      {loaf.proof_type && <span>Type: {formatProofType(loaf.proof_type)}</span>}
                      {loaf.bulk_temp > 0 && <span>Temp: {loaf.bulk_temp}°F</span>}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Edit Loaf Modal */}
      {editingLoaf && (
        <EditLoafModal
          loaf={editingLoaf}
          isOpen={!!editingLoaf}
          onClose={() => setEditingLoaf(null)}
        />
      )}

      {/* AI Analysis Modal */}
      {analysisModalLoaf && (
        <AIAnalysisModal
          loaf={analysisModalLoaf}
          recipe={recipes.find(r => r.id === analysisModalLoaf.recipeId)!}
          isOpen={!!analysisModalLoaf}
          onClose={() => setAnalysisModalLoaf(null)}
        />
      )}
    </div>
  );
}
