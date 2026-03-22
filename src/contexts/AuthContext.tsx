import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { firebaseStorage } from '../utils/firebaseStorage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<User>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
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
      const user = await firebaseStorage.signInWithGoogle();
      setUser(user);
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
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signInWithGoogle,
    signOut,
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
