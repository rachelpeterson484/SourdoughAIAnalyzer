import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { AIAnalysisResult, aiAnalysisService } from '../services/aiAnalysis';
import { Loaf, Recipe } from '../types';
import { Brain, TrendingUp, AlertTriangle, Target, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';

interface AIAnalysisProps {
  loaf: Loaf;
  recipe: Recipe;
}

export function AIAnalysis({ loaf, recipe }: AIAnalysisProps) {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const runAnalysis = async () => {
    if (!loaf.crumbImageUrl) {
      setError("Crumb photo is required for AI analysis");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await aiAnalysisService.analyzeLoaf(loaf, recipe, loaf.crumbImageUrl);
      setAnalysis(result);
    } catch (err) {
      setError("AI analysis failed. Please try again.");
      console.error("Analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return "Excellent";
    if (score >= 6) return "Good";
    if (score >= 4) return "Fair";
    return "Needs Improvement";
  };

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Sourdough Analysis
          </CardTitle>
          <CardDescription>
            Get personalized feedback on your sourdough from AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-sm text-gray-600">
              <p>AI will analyze your crumb structure, fermentation, and technique to provide:</p>
              <ul className="mt-2 text-left space-y-1">
                <li>• Overall quality score (1-10)</li>
                <li>• Detailed crumb structure analysis</li>
                <li>• Specific improvement recommendations</li>
                <li>• Next steps for your next bake</li>
              </ul>
            </div>
            
            <Button 
              onClick={runAnalysis} 
              disabled={isAnalyzing || !loaf.crumbImageUrl}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Brain className="w-4 h-4 mr-2 animate-pulse" />
                  Analyzing your sourdough...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Analyze This Loaf
                </>
              )}
            </Button>
            
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Analysis Results
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={runAnalysis}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? "Analyzing..." : "Re-analyze"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Overall Score */}
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                {analysis.overallScore}/10
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {getScoreLabel(analysis.overallScore)}
              </div>
              <Progress value={analysis.overallScore * 10} className="mt-2" />
            </div>

            {/* Crumb Analysis */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Target className="w-4 h-4" />
                Crumb Structure
              </h4>
              <div className="text-sm space-y-1">
                <p><span className="font-medium">Structure:</span> {analysis.crumbAnalysis.structure}</p>
                <p><span className="font-medium">Holes:</span> {analysis.crumbAnalysis.holeDistribution}</p>
                <p><span className="font-medium">Moisture:</span> {analysis.crumbAnalysis.moisture}</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Quick Stats
              </h4>
              <div className="text-sm space-y-1">
                <p><span className="font-medium">Hydration:</span> {recipe.hydration}%</p>
                <p><span className="font-medium">Ferment:</span> {loaf.bulk_time + loaf.proof_time}h total</p>
                <p><span className="font-medium">Rating:</span> {loaf.rating || 0}/5 stars</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <button
            onClick={() => toggleSection('insights')}
            className="w-full flex items-center justify-between text-left"
          >
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Key Insights
            </CardTitle>
            {expandedSections.has('insights') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </CardHeader>
        {expandedSections.has('insights') && (
          <CardContent>
            <div className="space-y-3">
              {analysis.keyInsights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-900">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <button
            onClick={() => toggleSection('recommendations')}
            className="w-full flex items-center justify-between text-left"
          >
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Recommendations
            </CardTitle>
            {expandedSections.has('recommendations') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </CardHeader>
        {expandedSections.has('recommendations') && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fermentation */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Badge variant="outline">Fermentation</Badge>
                </h4>
                <div className="space-y-2">
                  {analysis.recommendations.fermentation.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                  {analysis.recommendations.fermentation.length === 0 && (
                    <p className="text-sm text-gray-500">No fermentation recommendations</p>
                  )}
                </div>
              </div>

              {/* Technique */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Badge variant="outline">Technique</Badge>
                </h4>
                <div className="space-y-2">
                  {analysis.recommendations.technique.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                  {analysis.recommendations.technique.length === 0 && (
                    <p className="text-sm text-gray-500">No technique recommendations</p>
                  )}
                </div>
              </div>

              {/* Ingredients */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Badge variant="outline">Ingredients</Badge>
                </h4>
                <div className="space-y-2">
                  {analysis.recommendations.ingredients.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                  {analysis.recommendations.ingredients.length === 0 && (
                    <p className="text-sm text-gray-500">No ingredient recommendations</p>
                  )}
                </div>
              </div>

              {/* Baking */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Badge variant="outline">Baking</Badge>
                </h4>
                <div className="space-y-2">
                  {analysis.recommendations.baking.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                  {analysis.recommendations.baking.length === 0 && (
                    <p className="text-sm text-gray-500">No baking recommendations</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <button
            onClick={() => toggleSection('nextSteps')}
            className="w-full flex items-center justify-between text-left"
          >
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Next Steps
            </CardTitle>
            {expandedSections.has('nextSteps') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </CardHeader>
        {expandedSections.has('nextSteps') && (
          <CardContent>
            <div className="space-y-3">
              {analysis.nextSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-center w-6 h-6 bg-green-600 text-white rounded-full text-sm font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <p className="text-sm text-green-900">{step}</p>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
