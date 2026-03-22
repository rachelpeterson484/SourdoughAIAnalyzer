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
  private readonly API_URL = "https://api-inference.huggingface.co/models";
  private readonly HF_API_KEY = (import.meta as any).env?.VITE_HUGGINGFACE_API_KEY || "";

  /**
   * Convert image data URL to base64 for API
   */
  private imageDataUrlToBase64(dataUrl: string): string {
    // Remove the data:image/jpeg;base64, prefix
    const base64 = dataUrl.split(',')[1];
    return base64;
  }

  /**
   * Analyze loaf using Hugging Face Vision Language Model
   */
  async analyzeLoaf(
    loaf: Loaf, 
    recipe: Recipe, 
    crumbImageUrl: string
  ): Promise<AIAnalysisResult> {
    // If no API key, use fallback analysis immediately
    if (!this.HF_API_KEY || this.HF_API_KEY === "") {
      console.log("No Hugging Face API key found, using fallback analysis");
      return this.getFallbackAnalysis(loaf, recipe);
    }

    try {
      // Use a free vision-language model
      const modelId = "HuggingFaceM4/idefics2-8b-chatty";
      const apiUrl = `${this.API_URL}/${modelId}`;

      // Prepare the analysis prompt
      const prompt = this.buildAnalysisPrompt(loaf, recipe);
      const imageBase64 = this.imageDataUrlToBase64(crumbImageUrl);

      // Call Hugging Face API
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: {
            image: `data:image/jpeg;base64,${imageBase64}`,
            question: prompt
          },
          parameters: {
            max_new_tokens: 500,
            temperature: 0.7,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const result = await response.json();
      
      // Parse the AI response into structured data
      return this.parseAIResponse(result[0]?.generated_text || "");

    } catch (error) {
      console.error("AI analysis failed:", error);
      // Return fallback analysis
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

    return `As an expert sourdough baker, analyze this crumb structure and provide detailed feedback.

Context:
- Recipe: ${recipe.name} (${hydration}% hydration)
- Flour mix: ${recipe.flours.map(f => `${f.type} (${f.amount}g)`).join(', ')}
- Total fermentation: ${fermentationTime} hours (${loaf.bulk_time}h bulk + ${loaf.proof_time}h proof)
- Temperature: ${temperature}°F
- Proof type: ${loaf.proof_type || 'room_temp'}
- User rating: ${rating}/5 stars
- Autolyse: ${loaf.autolyse_time} minutes
- Baker's notes: ${loaf.notes || 'No notes provided'}
- Inclusions: ${loaf.inclusions && loaf.inclusions.length > 0 ? loaf.inclusions.map(i => `${i.type} (${i.amount}g)`).join(', ') : 'No inclusions'}

Please analyze the crumb structure and provide:
1. Overall score (1-10)
2. Crumb structure analysis (hole distribution, openness, moisture)
3. Specific recommendations for improvement in these categories:
   - Fermentation adjustments
   - Technique improvements
   - Ingredient modifications
   - Baking process
4. 3 key insights the baker should know
5. Next steps for their next bake

Pay special attention to:
- The baker's own notes and observations
- Any inclusions (seeds, nuts, grains, etc.) and how they affect the crumb
- How the actual results compare to the baker's rating
- Specific techniques or ingredients mentioned in notes

Respond in a structured, actionable format that helps the baker improve their sourdough.`;
  }

  /**
   * Parse AI response into structured format
   */
  private parseAIResponse(response: string): AIAnalysisResult {
    // This is a simplified parser - in production you'd want more sophisticated parsing
    
    // Extract score (look for patterns like "Score: 7/10" or "Overall: 8")
    let overallScore = 5; // default
    const scoreMatch = response.match(/(\d+)\/10|overall[:\s]*(\d+)/i);
    if (scoreMatch) {
      overallScore = parseInt(scoreMatch[1] || scoreMatch[2]);
    }

    // Extract recommendations by category
    const recommendations = {
      fermentation: this.extractRecommendations(response, ['ferment', 'proof', 'bulk']),
      technique: this.extractRecommendations(response, ['technique', 'handle', 'shape', 'score']),
      ingredients: this.extractRecommendations(response, ['flour', 'water', 'salt', 'starter', 'ingredient']),
      baking: this.extractRecommendations(response, ['bake', 'oven', 'steam', 'temp'])
    };

    // Extract key insights
    const insights = this.extractInsights(response);

    return {
      overallScore,
      crumbAnalysis: {
        structure: this.extractCrumbAnalysis(response, 'structure'),
        holeDistribution: this.extractCrumbAnalysis(response, 'hole'),
        moisture: this.extractCrumbAnalysis(response, 'moisture'),
        score: overallScore
      },
      recommendations,
      nextSteps: this.extractNextSteps(response),
      keyInsights: insights
    };
  }

  /**
   * Extract recommendations for specific categories
   */
  private extractRecommendations(text: string, keywords: string[]): string[] {
    const lines = text.split('\n');
    const recommendations: string[] = [];
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (keywords.some(keyword => lowerLine.includes(keyword))) {
        const cleaned = line.replace(/^[-•*]\s*/, '').trim();
        if (cleaned.length > 10) {
          recommendations.push(cleaned);
        }
      }
    }
    
    return recommendations.slice(0, 3); // Limit to 3 per category
  }

  /**
   * Extract key insights from the response
   */
  private extractInsights(text: string): string[] {
    const insightPatterns = [
      /key insight[s]?:?\s*(.+)/i,
      /important:? ?(.+)/i,
      /note:? ?(.+)/i
    ];

    const insights: string[] = [];
    
    for (const pattern of insightPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        insights.push(matches[1].trim());
      }
    }

    // If no structured insights found, extract meaningful sentences
    if (insights.length === 0) {
      const sentences = text.split('.').filter(s => s.trim().length > 20);
      insights.push(...sentences.slice(0, 3));
    }

    return insights.slice(0, 3);
  }

  /**
   * Extract crumb analysis for specific aspects
   */
  private extractCrumbAnalysis(text: string, aspect: string): string {
    const patterns = [
      new RegExp(`${aspect}[:\\s]*(.+)`, 'i'),
      new RegExp(`${aspect}.*?[:\\s]*(.+)`, 'i')
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim().split('.')[0]; // Take first sentence
      }
    }

    // Default descriptions based on aspect
    const defaults = {
      structure: "Open and irregular crumb structure",
      hole: "Good distribution of various sized holes",
      moisture: "Appears moist but not gummy"
    };

    return defaults[aspect as keyof typeof defaults] || "Good crumb development";
  }

  /**
   * Extract next steps from the response
   */
  private extractNextSteps(text: string): string[] {
    const nextStepPatterns = [
      /next step[s]?:?\s*(.+)/i,
      /try:? ?(.+)/i,
      /for next bake:? ?(.+)/i
    ];

    const steps: string[] = [];
    
    for (const pattern of nextStepPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        steps.push(match[1].trim());
        pattern.lastIndex = 0; // Reset regex lastIndex
      }
    }

    return steps.slice(0, 3);
  }

  /**
   * Fallback analysis when AI fails
   */
  private getFallbackAnalysis(loaf: Loaf, recipe: Recipe): AIAnalysisResult {
    const hydration = recipe.hydration;
    const rating = loaf.rating || 0;

    // Basic rule-based analysis
    let overallScore = rating * 2; // Convert 5-star to 10-point scale
    
    // Adjust score based on hydration and fermentation
    if (hydration > 80) overallScore = Math.min(10, overallScore + 1);
    if (hydration < 65) overallScore = Math.max(1, overallScore - 1);
    
    const totalFerment = loaf.bulk_time + loaf.proof_time;
    if (totalFerment > 8) overallScore = Math.max(1, overallScore - 1);
    if (totalFerment < 4) overallScore = Math.max(1, overallScore - 1);

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
    
    if (totalFerment < 4) {
      recs.push("Consider longer bulk fermentation for better flavor");
    } else if (totalFerment > 8) {
      recs.push("Watch for over-fermentation, reduce time slightly");
    }
    
    if (hydration > 80) {
      recs.push("High hydration doughs need gentler handling");
    }
    
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
