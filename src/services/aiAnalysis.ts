import { Recipe, Loaf } from '../types';

export interface AIAnalysisResult {
  overallScore: number;
  crumbAnalysis: {
    structure: string;
    holeDistribution: string;
    moisture: string;
    score: number;
  };
  recommendations: {
    fermentation: string[];
    technique: string[];
    ingredients: string[];
    baking: string[];
  };
  nextSteps: string[];
  keyInsights: string[];
}

export class AIAnalysisService {
  private readonly API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
  private readonly GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || "";
  private readonly MODEL_ID = "gemini-3.8-flash";

  private imageDataUrlToBase64(dataUrl: string): string {
    return dataUrl.split(',')[1];
  }

  async analyzeLoaf(
    loaf: Loaf, 
    recipe: Recipe, 
    crumbImageUrl: string
  ): Promise<AIAnalysisResult> {
    if (!this.GEMINI_API_KEY) {
      return this.getFallbackAnalysis(loaf, recipe);
    }

    try {
      const apiUrl = `${this.API_URL}/${this.MODEL_ID}:generateContent?key=${this.GEMINI_API_KEY}`;
      const analysisPrompt = this.buildAnalysisPrompt(loaf, recipe);
      const imageBase64 = this.imageDataUrlToBase64(crumbImageUrl);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: analysisPrompt },
              { inline_data: { mime_type: "image/jpeg", data: imageBase64 } }
            ]
          }],
          generationConfig: {
            maxOutputTokens: 4000,
            temperature: 0.7,
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
      return this.parseAIResponse(generatedText);

    } catch (error) {
      console.error("AI analysis failed:", error);
      return this.getFallbackAnalysis(loaf, recipe);
    }
  }

  /**
   * Build a comprehensive prompt for sourdough analysis
   */
  private buildAnalysisPrompt(loaf: Loaf, recipe: Recipe): string {
    const hydration = recipe.hydration;
    const fermentationTime = loaf.bulk_time + loaf.proof_time;
    const temperature = loaf.bulk_temp;
    const rating = loaf.rating || 0;

    return `Analyze this sourdough crumb photo and provide feedback in this format:

Score: [1-10]

Crumb: [structure description]
Holes: [distribution description]
Moisture: [moisture description]

Fermentation: [advice]
Technique: [advice]
Ingredients: [advice]
Baking: [advice]

Insights:
1. [insight]
2. [insight]
3. [insight]

Next:
1. [action]
2. [action]
3. [action]

Context: ${recipe.name}, ${hydration}% hydration, ${fermentationTime}h ferment, ${temperature}°F, ${rating}/5 rating, notes: ${loaf.notes || 'none'}`;
  }

  /**
   * Parse AI response into structured format
   */
  private parseAIResponse(response: string): AIAnalysisResult {
    // Extract score
    let overallScore = 5; // default
    const scoreMatch = response.match(/score[:\s]*(\d+(?:\.\d+)?)/i);
    if (scoreMatch) {
      overallScore = Math.round(parseFloat(scoreMatch[1]));
    }

    // Extract crumb analysis
    const crumbMatch = response.match(/crumb[:\s]*(.+)/i);
    const holesMatch = response.match(/holes[:\s]*(.+)/i);
    const moistureMatch = response.match(/moisture[:\s]*(.+)/i);

    // Extract recommendations
    const fermentationMatch = response.match(/fermentation[:\s]*(.+)/i);
    const techniqueMatch = response.match(/technique[:\s]*(.+)/i);
    const ingredientsMatch = response.match(/ingredients[:\s]*(.+)/i);
    const bakingMatch = response.match(/baking[:\s]*(.+)/i);

    // Extract insights and next steps
    const insights = this.extractListItems(response, 'insights');
    const nextSteps = this.extractListItems(response, 'next');

    return {
      overallScore,
      crumbAnalysis: {
        structure: crumbMatch ? crumbMatch[1].trim() : "Good crumb structure",
        holeDistribution: holesMatch ? holesMatch[1].trim() : "Good hole distribution",
        moisture: moistureMatch ? moistureMatch[1].trim() : "Good moisture",
        score: overallScore
      },
      recommendations: {
        fermentation: fermentationMatch ? [fermentationMatch[1].trim()] : [],
        technique: techniqueMatch ? [techniqueMatch[1].trim()] : [],
        ingredients: ingredientsMatch ? [ingredientsMatch[1].trim()] : [],
        baking: bakingMatch ? [bakingMatch[1].trim()] : []
      },
      nextSteps,
      keyInsights: insights
    };
  }

  private extractListItems(text: string, sectionName: string): string[] {
    const items: string[] = [];
    const lines = text.split('\n');
    let inSection = false;
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase().trim();
      
      if (lowerLine.includes(sectionName.toLowerCase())) {
        inSection = true;
        continue;
      }
      
      if (inSection && (lowerLine.includes('next:') || lowerLine.includes('insights') || lowerLine.includes('conclusion'))) {
        inSection = false;
      }
      
      if (inSection && items.length < 3) {
        const cleaned = line.replace(/^\d+\.\s*/, '').replace(/^[-•*]\s*/, '').trim();
        if (cleaned.length > 10) {
          items.push(cleaned);
        }
      }
    }
    
    if (items.length === 0) {
      const numberedItems = text.match(/^\d+\.\s+(.+)$/gm);
      if (numberedItems) {
        items.push(...numberedItems.slice(0, 3).map(item => item.replace(/^\d+\.\s+/, '').trim()));
      }
    }
    
    return items.slice(0, 3);
  }

  private getFallbackAnalysis(loaf: Loaf, recipe: Recipe): AIAnalysisResult {
    const hydration = recipe.hydration;
    const rating = loaf.rating || 0;
    const totalFerment = loaf.bulk_time + loaf.proof_time;

    let overallScore = rating * 2;
    if (hydration > 80) overallScore = Math.min(10, overallScore + 1);
    if (hydration < 65) overallScore = Math.max(1, overallScore - 1);
    if (totalFerment > 8 || totalFerment < 4) overallScore = Math.max(1, overallScore - 1);

    return {
      overallScore,
      crumbAnalysis: {
        structure: hydration > 75 ? "Open and airy structure" : "Denser crumb structure",
        holeDistribution: "Moderate hole distribution",
        moisture: totalFerment > 6 ? "Good moisture retention" : "Could be more moist",
        score: overallScore
      },
      recommendations: {
        fermentation: this.getFermentationRecommendations(hydration, totalFerment),
        technique: ["Practice consistent scoring", "Focus on proper shaping"],
        ingredients: this.getIngredientRecommendations(hydration),
        baking: ["Ensure proper oven spring", "Consider steam techniques"]
      },
      nextSteps: [
        "Adjust fermentation time based on room temperature",
        "Monitor dough consistency during bulk fermentation",
        "Document your process for consistency"
      ],
      keyInsights: [
        `Hydration of ${hydration}% is ${hydration > 75 ? 'higher' : hydration < 70 ? 'lower' : 'moderate'} for sourdough`,
        `Total fermentation of ${totalFerment}h affects crumb development`,
        "Temperature control is key for consistent results"
      ]
    };
  }

  private getFermentationRecommendations(hydration: number, totalFerment: number): string[] {
    const recs: string[] = [];
    if (totalFerment < 4) recs.push("Consider longer bulk fermentation for better flavor");
    if (totalFerment > 8) recs.push("Watch for over-fermentation, reduce time slightly");
    if (hydration > 80) recs.push("High hydration doughs need gentler handling");
    return recs;
  }

  private getIngredientRecommendations(hydration: number): string[] {
    if (hydration > 80) {
      return ["Consider stronger flour for high hydration", "Use autolyse for better gluten development"];
    } else if (hydration < 65) {
      return ["Try increasing hydration for more open crumb", "Consider adding whole grains for structure"];
    }
    return ["Experiment with different flour combinations", "Consider starter activity adjustments"];
  }
}

export const aiAnalysisService = new AIAnalysisService();
