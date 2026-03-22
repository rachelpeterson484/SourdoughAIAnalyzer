# Database Architecture for Sourdough Tracker

## Current Implementation: Browser Local Storage

### Why Local Storage?
- **Zero setup required** - works immediately in browser
- **No server needed** - perfect for single-user app
- **Persistent data** - survives browser restarts
- **Easy to migrate** - can export/import later

### Data Structure

#### Recipes Table (localStorage: 'sourdough_recipes')
```typescript
{
  id: string,           // UUID v4
  name: string,         // Recipe name
  flour: number,        // Grams of flour
  water: number,        // Grams of water
  starter: number,      // Grams of starter
  salt: number,         // Grams of salt
  hydration: number,    // Auto-calculated percentage
  bulk_time: number,    // Bulk fermentation time in hours
  autolyse_time: number, // Autolyse time in minutes
  proof_time: number,   // Proofing time in hours
  bake_length: number,  // Bake length in minutes
  notes: string,        // Baking instructions
  createdAt: Date       // When recipe was created
}
```

#### Loaves Table (localStorage: 'sourdough_loaves')
```typescript
{
  id: string,           // UUID v4
  recipeId: string,    // Foreign key to recipes
  imageUrl?: string,    // Base64 encoded image
  bakeDate: Date,       // When loaf was baked
  rating?: number,      // 1-5 star rating
  notes?: string,       // Baking notes for this loaf
  createdAt: Date       // Record creation time
}
```

### Storage Manager API

#### Recipe Operations
- `getRecipes()` - Retrieve all recipes
- `saveRecipe(recipe)` - Create new recipe
- `updateRecipe(id, updates)` - Modify existing recipe
- `deleteRecipe(id)` - Remove recipe
- `getRecipeById(id)` - Get single recipe

#### Loaf Operations
- `getLoaves()` - Retrieve all loaves
- `saveLoaf(loaf)` - Create new loaf record
- `updateLoaf(id, updates)` - Modify existing loaf
- `deleteLoaf(id)` - Remove loaf
- `getLoavesByRecipeId(recipeId)` - Get loaves for specific recipe

### React Hooks Integration

#### useRecipes()
```typescript
const {
  recipes,           // Array of recipes
  loading,           // Loading state
  addRecipe,         // Create recipe
  updateRecipe,      // Update recipe
  deleteRecipe,      // Delete recipe
  refresh            // Refresh data
} = useRecipes();
```

#### useLoaves()
```typescript
const {
  loaves,            // Array of loaves
  loading,           // Loading state
  addLoaf,           // Create loaf
  updateLoaf,        // Update loaf
  deleteLoaf,        // Delete loaf
  refresh            // Refresh data
} = useLoaves();
```

## Future Migration Options

### Option 1: SQLite (Browser)
- **Pros**: More powerful queries, better performance
- **Cons**: Requires additional setup, larger bundle size
- **Implementation**: wa-sqlite library

### Option 2: IndexedDB
- **Pros**: Native browser API, better for large datasets
- **Cons**: More complex API, requires wrapper libraries
- **Implementation**: Dexie.js or idb library

### Option 3: Backend Database (PostgreSQL/MySQL)
- **Pros**: Multi-user support, real data safety
- **Cons**: Requires server, hosting costs
- **Implementation**: Node.js + Express + Prisma/TypeORM

### Option 4: Cloud Storage (Firebase/Supabase)
- **Pros**: Real-time sync, multi-device access
- **Cons**: Internet required, potential costs
- **Implementation**: Firebase SDK or Supabase client

## Migration Strategy

When you're ready to upgrade:
1. **Export current data** from localStorage
2. **Set up new database** with same schema
3. **Import data** to new system
4. **Update storage layer** to use new DB
5. **Test thoroughly** before deploying

The current local storage approach gives you a fully functional app today while keeping migration options open for the future.
