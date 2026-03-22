import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { RecipeForm } from './RecipeForm';
import { LoafHistory } from './LoafHistory';
import { EditRecipeModal } from './EditRecipeModal';
import { UserProfile } from './UserProfile';
import { AIAnalysis } from './AIAnalysis';
import { useRecipes, useLoaves } from '../hooks/useFirebaseStorage';
import { Recipe, Loaf } from '../types';
import { Plus, TrendingUpDown, NotebookPen, Wheat, Edit, Star, TrendingUp } from 'lucide-react';

type TabType = 'recipes' | 'loaves' | 'analytics';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('recipes');
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [selectedLoafForAI, setSelectedLoafForAI] = useState<Loaf | null>(null);
  const { recipes, loading: recipesLoading, refresh: refreshRecipes } = useRecipes();
  const { loaves, refresh: refreshLoaves } = useLoaves();

  useEffect(() => {
    const handleRecipeSuccess = () => {
      setShowRecipeForm(false);
    };

    const handleRecipeUpdate = () => {
      refreshRecipes();
    };

    const handleRecipeAdd = () => {
      refreshRecipes();
    };

    const handleLoafUpdate = () => {
      refreshLoaves();
    };

    const handleLoafAdd = () => {
      refreshLoaves();
    };

    window.addEventListener('recipeFormSuccess', handleRecipeSuccess);
    window.addEventListener('recipeUpdated', handleRecipeUpdate);
    window.addEventListener('recipeAdded', handleRecipeAdd);
    window.addEventListener('loafUpdated', handleLoafUpdate);
    window.addEventListener('loafAdded', handleLoafAdd);
    
    return () => {
      window.removeEventListener('recipeFormSuccess', handleRecipeSuccess);
      window.removeEventListener('recipeUpdated', handleRecipeUpdate);
      window.removeEventListener('recipeAdded', handleRecipeAdd);
      window.removeEventListener('loafUpdated', handleLoafUpdate);
      window.removeEventListener('loafAdded', handleLoafAdd);
    };
  }, [refreshRecipes, refreshLoaves]);

  const averageRating = loaves.length > 0 
    ? (loaves.reduce((sum, loaf) => sum + (loaf.rating || 0), 0) / loaves.filter(loaf => loaf.rating).length).toFixed(1)
    : '-';

  // Analytics helper functions
  const getLoavesInPeriod = (days: number) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return loaves.filter(loaf => new Date(loaf.bakeDate) >= cutoffDate);
  };

  const getLoavesInLast4Weeks = () => getLoavesInPeriod(28);
  const getBestLoaves = (count: number = 5) => {
    return loaves
      .filter(loaf => loaf.rating)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, count);
  };

  const getMonthlyStats = () => {
    const monthlyData: { [key: string]: { count: number; totalRating: number; ratedCount: number } } = {};
    
    loaves.forEach(loaf => {
      const date = new Date(loaf.bakeDate);
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { count: 0, totalRating: 0, ratedCount: 0 };
      }
      
      monthlyData[monthKey].count++;
      if (loaf.rating) {
        monthlyData[monthKey].totalRating += loaf.rating;
        monthlyData[monthKey].ratedCount++;
      }
    });
    
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6); // Last 6 months
  };

  const tabs = [
    { id: 'recipes' as TabType, label: 'Recipes', icon: NotebookPen },
    { id: 'loaves' as TabType, label: 'Loaves', icon: Wheat },
    { id: 'analytics' as TabType, label: 'Analytics', icon: TrendingUpDown }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'recipes':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">My Recipes</h2>
              <Button onClick={() => setShowRecipeForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Recipe
              </Button>
            </div>

            {showRecipeForm && (
              <Card>
                <CardContent className="p-6">
                  <RecipeForm onClose={() => setShowRecipeForm(false)} />
                </CardContent>
              </Card>
            )}

            {recipesLoading ? (
              <div className="text-center py-8">Loading recipes...</div>
            ) : recipes.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500 mb-4">No recipes yet. Create your first recipe!</p>
                  <Button onClick={() => setShowRecipeForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Recipe
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recipes.map((recipe: Recipe) => (
                  <Card key={recipe.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{recipe.name}</CardTitle>
                          <CardDescription>
                            {recipe.hydration}% hydration • {recipe.flours.reduce((sum, f) => sum + f.amount, 0)}g total flour
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingRecipe(recipe)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {recipe.flours.map((flour, index) => (
                          <div key={index} className="flex justify-between">
                            <span className="text-gray-600">{flour.type}:</span>
                            <span>{flour.amount}g {flour.percentage && `(${flour.percentage}%)`}</span>
                          </div>
                        ))}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Water:</span>
                          <span>{recipe.water}g</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Starter:</span>
                          <span>{recipe.starter}g</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Salt:</span>
                          <span>{recipe.salt}g</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 'loaves':
        return <LoafHistory />;

      case 'analytics':
        const loavesInLast4Weeks = getLoavesInLast4Weeks();
        const bestLoaves = getBestLoaves();
        const monthlyStats = getMonthlyStats();
        
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Analytics</h2>
              </div>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-gray-600">Total Recipes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{recipes.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-gray-600">Total Loaves</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{loaves.length}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {loavesInLast4Weeks.length} in past 4 weeks
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-gray-600">Average Rating</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{averageRating}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {loaves.filter(loaf => loaf.rating).length} rated loaves
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-gray-600">Baking Frequency</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {loavesInLast4Weeks.length > 0 ? (loavesInLast4Weeks.length / 4).toFixed(1) : '0'}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">loaves per week</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Loaves Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Loaves Over Time
                  </CardTitle>
                  <CardDescription>Monthly baking activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {monthlyStats.length > 0 ? (
                      monthlyStats.map(([month, stats]) => (
                        <div key={month} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{month}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${Math.min((stats.count / Math.max(...monthlyStats.map(([, s]) => s.count))) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-8">{stats.count}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No data available</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Ratings Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="w-5 h-5 mr-2" />
                    Ratings Over Time
                  </CardTitle>
                  <CardDescription>Average rating by month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {monthlyStats.filter(([, stats]) => stats.ratedCount > 0).length > 0 ? (
                      monthlyStats
                        .filter(([, stats]) => stats.ratedCount > 0)
                        .map(([month, stats]) => {
                          const avgRating = (stats.totalRating / stats.ratedCount).toFixed(1);
                          return (
                            <div key={month} className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">{month}</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-yellow-500 h-2 rounded-full" 
                                    style={{ width: `${(parseFloat(avgRating) / 5) * 100}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium w-12">{avgRating}★</span>
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <p className="text-gray-500 text-center py-4">No ratings available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Best Loaves */}
            {bestLoaves.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="w-5 h-5 mr-2" />
                    Best Loaves
                  </CardTitle>
                  <CardDescription>Top rated loaves of all time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bestLoaves.map((loaf, index) => {
                      const recipe = recipes.find(r => r.id === loaf.recipeId);
                      return (
                        <div key={loaf.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{recipe?.name || 'Unknown Recipe'}</div>
                              <div className="text-sm text-gray-500">
                                {new Date(loaf.bakeDate).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < (loaf.rating || 0)
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium">{loaf.rating}/5</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Analysis Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  AI Sourdough Analysis
                </CardTitle>
                <CardDescription>
                  Get personalized feedback on your sourdough baking
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedLoafForAI ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">
                          {recipes.find(r => r.id === selectedLoafForAI.recipeId)?.name || 'Unknown Recipe'}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Baked: {new Date(selectedLoafForAI.bakeDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedLoafForAI(null)}
                      >
                        Choose Different Loaf
                      </Button>
                    </div>
                    
                    <AIAnalysis 
                      loaf={selectedLoafForAI} 
                      recipe={recipes.find(r => r.id === selectedLoafForAI.recipeId)!}
                    />
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <p className="text-gray-600">
                      Select a loaf to analyze with AI for personalized baking feedback
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {loaves
                        .filter(loaf => loaf.crumbImageUrl) // Only show loaves with crumb photos
                        .slice(0, 6) // Show latest 6 loaves
                        .map(loaf => {
                          const recipe = recipes.find(r => r.id === loaf.recipeId);
                          return (
                            <Button
                              key={loaf.id}
                              variant="outline"
                              className="h-auto p-4 flex flex-col items-start"
                              onClick={() => setSelectedLoafForAI(loaf)}
                            >
                              <div className="w-full">
                                <div className="font-medium text-left">
                                  {recipe?.name || 'Unknown Recipe'}
                                </div>
                                <div className="text-xs text-gray-500 text-left">
                                  {new Date(loaf.bakeDate).toLocaleDateString()}
                                </div>
                                <div className="flex items-center mt-2">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3 h-3 ${
                                        i < (loaf.rating || 0)
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </Button>
                          );
                        })}
                    </div>
                    {loaves.filter(loaf => loaf.crumbImageUrl).length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">
                          No loaves with crumb photos found
                        </p>
                        <p className="text-sm text-gray-400">
                          Add crumb photos to your loaves to enable AI analysis
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-gray-100 shadow-md relative">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">Sourdough Tracker</h1>
        </div>
        <div className="border-t border-gray-300"></div>
        <nav className="mt-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-200 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gray-200 text-gray-900 border-r-4 border-gray-900'
                    : 'text-gray-700'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {tab.label}
              </button>
            );
          })}
        </nav>
        
        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-300">
          <UserProfile />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
      
      {/* Edit Recipe Modal */}
      {editingRecipe && (
        <EditRecipeModal
          recipe={editingRecipe}
          isOpen={!!editingRecipe}
          onClose={() => setEditingRecipe(null)}
        />
      )}
    </div>
  );
}
