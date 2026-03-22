import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Chrome } from 'lucide-react';

export function LoginForm() {
  const { signInWithGoogle, loading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Failed to sign in with Google:', error);
      // You could show a toast notification here
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Sourdough Tracker
            </CardTitle>
            <CardDescription className="text-gray-600">
              Sign in to track your sourdough baking journey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <Button
                onClick={handleGoogleSignIn}
                disabled={isSigningIn || loading}
                className="w-full max-w-sm mx-auto"
                size="lg"
              >
                {isSigningIn || loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Chrome className="w-4 h-4 mr-2" />
                    Continue with Google
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center text-xs text-gray-500">
          <p>Your data is securely stored and synced across devices.</p>
        </div>
      </div>
    </div>
  );
}
