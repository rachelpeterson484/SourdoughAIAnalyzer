export interface Flour {
  type: string; // e.g., "Bread Flour", "Whole Wheat", "Rye", "Spelt"
  amount: number; // in grams
  percentage?: number; // optional percentage of total flour
}

export interface Recipe {
  id: string;
  name: string;
  flours: Flour[];
  water: number;
  starter: number;
  salt: number;
  hydration: number;
  bake_length: number;
  notes: string;
  createdAt: Date;
}

export interface Inclusion {
  type: string; // e.g., "Olives", "Nuts", "Seeds", "Cheese", "Herbs"
  amount: number; // in grams
}

export interface Loaf {
  id: string;
  recipeId: string;
  exteriorImageUrl?: string; // Optional exterior photo
  crumbImageUrl?: string; // Required crumb photo for AI analysis
  bakeDate: Date;
  rating?: number;
  notes?: string;
  inclusions?: Inclusion[]; // Optional inclusions added to the dough
  autolyse_time: number;
  bulk_time: number;
  proof_time: number;
  proof_type: string;
  bulk_temp: number;
  createdAt: Date;
}
