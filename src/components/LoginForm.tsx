import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Chrome, Eye } from 'lucide-react';

export function LoginForm() {
  const { signInWithGoogle, enterDemoMode, loading } = useAuth();
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

  const handleDemoMode = async () => {
    setIsSigningIn(true);
    try {
      await enterDemoMode();
    } catch (error) {
      console.error('Failed to enter demo mode:', error);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bakery-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="border-bakery-200 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-bakery-900 font-serif">
              Sourdough Tracker
            </CardTitle>
            <CardDescription className="text-bakery-600">
              Track your sourdough baking journey with AI-powered insights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Button
                onClick={handleGoogleSignIn}
                disabled={isSigningIn || loading}
                className="w-full bg-bakery-600 hover:bg-bakery-700 text-white"
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
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-bakery-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-bakery-50 text-bakery-500">or</span>
                </div>
              </div>
              
              <Button
                onClick={handleDemoMode}
                variant="outline"
                className="w-full border-bakery-300 text-bakery-700 hover:bg-bakery-100"
                size="lg"
              >
                <Eye className="w-4 h-4 mr-2" />
                Try Demo Mode
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center text-xs text-bakery-500 space-y-1">
          <p>Demo mode uses shared sample data. Sign in to save your own loaves.</p>
          <p>Your data is securely stored and synced across devices.</p>
        </div>
      </div>
    </div>
  );
}
