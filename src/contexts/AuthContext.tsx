import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { firebaseStorage } from '../utils/firebaseStorage';

interface AuthContextType {
  user: User | null;
  demoMode: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<User>;
  signOut: () => Promise<void>;
  enterDemoMode: () => Promise<void>;
  exitDemoMode: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [demoMode, setDemoMode] = useState(() => {
    return localStorage.getItem('demoMode') === 'true';
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await firebaseStorage.init();
        
        // Listen for auth state changes
        const unsubscribe = firebaseStorage.onAuthStateChanged((user) => {
          setUser(user);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setLoading(false);
      }
    };

    const unsubscribe = initializeAuth();
    
    return () => {
      unsubscribe.then(unsub => unsub?.());
    };
  }, []);

  const signInWithGoogle = async (): Promise<User> => {
    try {
      // Sign out demo user first to prevent account linking
      const currentUser = firebaseStorage.getCurrentUser();
      if (currentUser?.email === 'demo@sourdoughtracker.com') {
        await firebaseStorage.signOut();
      }
      
      const user = await firebaseStorage.signInWithGoogle();
      setUser(user);
      setDemoMode(false);
      localStorage.removeItem('demoMode');
      return user;
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await firebaseStorage.signOut();
      setUser(null);
      setDemoMode(false);
      localStorage.removeItem('demoMode');
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  };

  const enterDemoMode = async () => {
    try {
      await firebaseStorage.signInDemo();
      // Wait a moment for auth state to propagate
      await new Promise(resolve => setTimeout(resolve, 100));
      setDemoMode(true);
      localStorage.setItem('demoMode', 'true');
    } catch (error) {
      console.error('Failed to enter demo mode:', error);
      // Fallback to local demo mode without Firebase
      setDemoMode(true);
      localStorage.setItem('demoMode', 'true');
    }
  };

  const exitDemoMode = async () => {
    try {
      await firebaseStorage.signOut();
    } catch (error) {
      console.error('Failed to sign out from demo mode:', error);
    }
    setDemoMode(false);
    localStorage.removeItem('demoMode');
  };

  const value: AuthContextType = {
    user,
    demoMode,
    loading,
    signInWithGoogle,
    signOut,
    enterDemoMode,
    exitDemoMode,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
