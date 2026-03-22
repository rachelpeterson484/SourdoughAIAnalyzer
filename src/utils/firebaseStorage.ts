import { Recipe, Loaf } from '../types';
import { 
  initializeApp, 
  getApps, 
  getApp 
} from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy
} from 'firebase/firestore';
import { 
  getAuth, 
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User
} from 'firebase/auth';

// Helper function to compress image with aggressive sizing for Firebase limits
export const compressImage = (file: File, targetSizeKB: number = 500): Promise<string> => {
  return new Promise((resolve, reject) => {
    // First, try to validate the file more thoroughly
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      try {
        // Check if image loaded properly
        if (img.naturalWidth === 0 || img.naturalHeight === 0) {
          reject(new Error('Image has invalid dimensions'));
          return;
        }

        // Start with aggressive compression for crumb photos (AI analysis needs less resolution)
        const maxWidth = targetSizeKB <= 500 ? 600 : 800;
        const maxHeight = targetSizeKB <= 500 ? 450 : 600;
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Clear canvas before drawing
        ctx.clearRect(0, 0, width, height);
        
        // Try to draw the image
        try {
          ctx.drawImage(img, 0, 0, width, height);
        } catch (drawError) {
          reject(new Error('Failed to draw image on canvas'));
          return;
        }
        
        // Simple compression - try quality 0.6 first
        canvas.toBlob((blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              const sizeInBytes = result.length;
              const sizeInKB = Math.round(sizeInBytes / 1024);
              
              console.log(`Image compressed: ${sizeInKB}KB (target: ${targetSizeKB}KB, original: ${Math.round(file.size / 1024)}KB)`);
              
              // If still too large and we can reduce quality more, try again
              if (sizeInKB > targetSizeKB && targetSizeKB <= 500) {
                // For crumb photos, try more aggressive compression
                canvas.toBlob((blob2) => {
                  if (blob2) {
                    const reader2 = new FileReader();
                    reader2.onload = () => {
                      const result2 = reader2.result as string;
                      const sizeInKB2 = Math.round(result2.length / 1024);
                      console.log(`Second attempt: ${sizeInKB2}KB`);
                      resolve(result2);
                    };
                    reader2.onerror = () => {
                      reject(new Error('FileReader failed on second attempt'));
                    };
                    reader2.readAsDataURL(blob2);
                  } else {
                    reject(new Error('Second compression failed'));
                  }
                }, 'image/jpeg', 0.4);
              } else {
                resolve(result);
              }
            };
            reader.onerror = () => {
              reject(new Error('FileReader failed on first attempt'));
            };
            reader.readAsDataURL(blob);
          } else {
            reject(new Error('Canvas toBlob failed'));
          }
        }, 'image/jpeg', targetSizeKB <= 500 ? 0.6 : 0.7);
      } catch (error) {
        console.error('Image compression error:', error);
        reject(error);
      }
    };
    
    img.onerror = (event) => {
      console.error('Image load error:', event);
      reject(new Error('Failed to load image - may be corrupted or unsupported format. Try saving as a JPEG or using a different image.'));
    };
    
    // Try multiple methods to load the image
    try {
      // Method 1: Create object URL (most reliable)
      img.crossOrigin = 'anonymous';
      img.src = URL.createObjectURL(file);
      
      // Fallback timeout - if image doesn't load within 10 seconds, reject
      setTimeout(() => {
        if (!img.complete) {
          reject(new Error('Image loading timed out - try a smaller or different image'));
        }
      }, 10000);
    } catch (error) {
      reject(new Error('Failed to create image URL'));
    }
  });
};

// Helper function to validate image size
export const validateImageSize = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 20 * 1024 * 1024; // 20MB limit - allow larger files since we compress aggressively
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Image size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds limit of 20MB. Please select a smaller image or compress it first.`
    };
  }
  
  return { valid: true };
};
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};


export class FirebaseStorage {
  private initialized = false;
  private userId: string | null = null;
  private app: any;
  private db: any;
  private auth: any;
  private currentUser: User | null = null;

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize Firebase app
      this.app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      this.db = getFirestore(this.app);
      this.auth = getAuth(this.app);

      // Listen for auth state changes
      onAuthStateChanged(this.auth, (user) => {
        this.currentUser = user;
        if (user) {
          this.userId = user.uid;
        } else {
          this.userId = null;
        }
      });

      this.initialized = true;
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      throw error;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }

  // Google Sign-In
  async signInWithGoogle(): Promise<User> {
    await this.ensureInitialized();
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      this.currentUser = result.user;
      this.userId = result.user.uid;
      return result.user;
    } catch (error) {
      console.error('Google sign-in failed:', error);
      throw error;
    }
  }

  // Sign Out
  async signOut(): Promise<void> {
    await this.ensureInitialized();
    
    try {
      await signOut(this.auth);
      this.currentUser = null;
      this.userId = null;
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Get auth state
  onAuthStateChanged(callback: (user: User | null) => void) {
    if (this.auth) {
      return onAuthStateChanged(this.auth, callback);
    }
    return () => {};
  }

  private getUserRecipesCollection() {
    if (!this.userId) throw new Error('User not authenticated');
    return collection(this.db, 'users', this.userId, 'recipes');
  }

  private getUserLoavesCollection() {
    if (!this.userId) throw new Error('User not authenticated');
    return collection(this.db, 'users', this.userId, 'loaves');
  }

  async getRecipes(): Promise<Recipe[]> {
    await this.ensureInitialized();
    
    try {
      const q = query(
        this.getUserRecipesCollection(),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          flours: data.flours || [],
          water: data.water || 0,
          starter: data.starter || 0,
          salt: data.salt || 0,
          hydration: data.hydration || 0,
          bake_length: data.bake_length || 0,
          notes: data.notes || '',
          createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
        } as Recipe;
      });
    } catch (error) {
      console.error('Failed to get recipes:', error);
      return [];
    }
  }

  async saveRecipe(recipe: Omit<Recipe, 'id' | 'createdAt'>): Promise<Recipe> {
    await this.ensureInitialized();
    
    const newRecipe: Recipe = {
      ...recipe,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      hydration: Math.round((recipe.water / recipe.flours.reduce((sum, f) => sum + f.amount, 0)) * 100)
    };

    try {
      const docRef = await addDoc(this.getUserRecipesCollection(), newRecipe);
      return { ...newRecipe, id: docRef.id };
    } catch (error) {
      console.error('Failed to save recipe:', error);
      throw error;
    }
  }

  async updateRecipe(id: string, updates: Partial<Recipe>): Promise<Recipe | null> {
    await this.ensureInitialized();
    
    try {
      const recipeRef = doc(this.getUserRecipesCollection(), id);
      const recipeDoc = await getDoc(recipeRef);
      
      if (!recipeDoc.exists()) {
        return null;
      }

      // Filter out undefined values to prevent Firebase errors
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([key, value]) => value !== undefined)
      );

      await updateDoc(recipeRef, cleanUpdates);
      const updatedDoc = await getDoc(recipeRef);
      
      const data = updatedDoc.data();
      if (!data) return null;
      
      return {
        id: updatedDoc.id,
        name: data.name || '',
        flours: data.flours || [],
        water: data.water || 0,
        starter: data.starter || 0,
        salt: data.salt || 0,
        hydration: data.hydration || 0,
        bake_length: data.bake_length || 0,
        notes: data.notes || '',
        createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date()
      } as Recipe;
    } catch (error) {
      console.error('Failed to update recipe:', error);
      return null;
    }
  }

  async deleteRecipe(id: string): Promise<boolean> {
    await this.ensureInitialized();
    
    try {
      const recipeRef = doc(this.getUserRecipesCollection(), id);
      const recipeDoc = await getDoc(recipeRef);
      
      if (!recipeDoc.exists()) {
        return false;
      }

      await deleteDoc(recipeRef);
      return true;
    } catch (error) {
      console.error('Failed to delete recipe:', error);
      return false;
    }
  }

  async getLoaves(): Promise<Loaf[]> {
    await this.ensureInitialized();
    
    try {
      const q = query(
        this.getUserLoavesCollection(),
        orderBy('bakeDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          recipeId: data.recipeId || '',
          bakeDate: data.bakeDate?.toDate?.() || data.bakeDate || new Date(),
          rating: data.rating,
          notes: data.notes || '',
          exteriorImageUrl: data.exteriorImageUrl || '',
          crumbImageUrl: data.crumbImageUrl || '',
          inclusions: data.inclusions || [],
          autolyse_time: data.autolyse_time || 0,
          bulk_time: data.bulk_time || 0,
          proof_time: data.proof_time || 0,
          proof_type: data.proof_type || '',
          bulk_temp: data.bulk_temp || 0,
          createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
        } as Loaf;
      });
    } catch (error) {
      console.error('Failed to get loaves:', error);
      return [];
    }
  }

  async saveLoaf(loaf: Omit<Loaf, 'id' | 'createdAt'>): Promise<Loaf> {
    await this.ensureInitialized();
    
    // Validate and compress images if provided
    let processedExteriorImageUrl = loaf.exteriorImageUrl;
    let processedCrumbImageUrl = loaf.crumbImageUrl;
    
    if (loaf.exteriorImageUrl && loaf.exteriorImageUrl.startsWith('data:image')) {
      // This is already a data URL (from preview), no need to process
      processedExteriorImageUrl = loaf.exteriorImageUrl;
    }
    
    if (loaf.crumbImageUrl && loaf.crumbImageUrl.startsWith('data:image')) {
      // This is already a data URL (from preview), no need to process
      processedCrumbImageUrl = loaf.crumbImageUrl;
    }
    
    const newLoaf: Loaf = {
      ...loaf,
      exteriorImageUrl: processedExteriorImageUrl,
      crumbImageUrl: processedCrumbImageUrl,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };

    // Filter out undefined values to prevent Firebase errors
    const cleanLoaf = Object.fromEntries(
      Object.entries(newLoaf).filter(([key, value]) => value !== undefined)
    );

    try {
      const docRef = await addDoc(this.getUserLoavesCollection(), cleanLoaf);
      return { ...newLoaf, id: docRef.id };
    } catch (error) {
      console.error('Failed to save loaf:', error);
      throw error;
    }
  }

  async updateLoaf(id: string, updates: Partial<Loaf>): Promise<Loaf | null> {
    await this.ensureInitialized();
    
    try {
      const loafRef = doc(this.getUserLoavesCollection(), id);
      const loafDoc = await getDoc(loafRef);
      
      if (!loafDoc.exists()) {
        return null;
      }

      // Filter out undefined values to prevent Firebase errors
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([key, value]) => value !== undefined)
      );

      await updateDoc(loafRef, cleanUpdates);
      const updatedDoc = await getDoc(loafRef);
      
      const data = updatedDoc.data();
      if (!data) return null;
      
      // Filter out undefined values to prevent Firebase errors
      const cleanData = Object.fromEntries(
        Object.entries(data || {}).filter(([key, value]) => value !== undefined)
      );
      
      return {
        id: updatedDoc.id,
        recipeId: cleanData.recipeId || '',
        bakeDate: cleanData.bakeDate?.toDate?.() || cleanData.bakeDate || new Date(),
        rating: cleanData.rating,
        notes: cleanData.notes || '',
        exteriorImageUrl: cleanData.exteriorImageUrl || '',
        crumbImageUrl: cleanData.crumbImageUrl || '',
        inclusions: cleanData.inclusions || [],
        autolyse_time: cleanData.autolyse_time || 0,
        bulk_time: cleanData.bulk_time || 0,
        proof_time: cleanData.proof_time || 0,
        proof_type: cleanData.proof_type || '',
        bulk_temp: cleanData.bulk_temp || 0,
        createdAt: cleanData.createdAt?.toDate?.() || cleanData.createdAt || new Date()
      } as Loaf;
    } catch (error) {
      console.error('Failed to update loaf:', error);
      return null;
    }
  }

  async deleteLoaf(id: string): Promise<boolean> {
    await this.ensureInitialized();
    
    try {
      const loafRef = doc(this.getUserLoavesCollection(), id);
      const loafDoc = await getDoc(loafRef);
      
      if (!loafDoc.exists()) {
        return false;
      }

      await deleteDoc(loafRef);
      return true;
    } catch (error) {
      console.error('Failed to delete loaf:', error);
      return false;
    }
  }

  // Sync data between Firebase and localStorage
  async syncFromFirebase(): Promise<void> {
    await this.ensureInitialized();
    
    try {
      const [recipes, loaves] = await Promise.all([
        this.getRecipes(),
        this.getLoaves()
      ]);

      // Update localStorage
      localStorage.setItem('sourdough_recipes', JSON.stringify(recipes));
      localStorage.setItem('sourdough_loaves', JSON.stringify(loaves));

      // Trigger UI refresh
      window.dispatchEvent(new CustomEvent('dataSynced'));
    } catch (error) {
      console.error('Failed to sync from Firebase:', error);
    }
  }

  async syncToFirebase(): Promise<void> {
    await this.ensureInitialized();
    
    try {
      const localRecipes = JSON.parse(localStorage.getItem('sourdough_recipes') || '[]');
      const localLoaves = JSON.parse(localStorage.getItem('sourdough_loaves') || '[]');

      // Upload to Firebase
      for (const recipe of localRecipes) {
        await this.saveRecipe(recipe);
      }

      for (const loaf of localLoaves) {
        await this.saveLoaf(loaf);
      }

      console.log('Data synced to Firebase successfully');
    } catch (error) {
      console.error('Failed to sync to Firebase:', error);
    }
  }
}

export const firebaseStorage = new FirebaseStorage();
