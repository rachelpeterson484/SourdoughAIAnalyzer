import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Eye } from 'lucide-react';

export function UserProfile() {
  const { user, demoMode, signOut, exitDemoMode } = useAuth();

  if (!user && !demoMode) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const handleExitDemo = async () => {
    try {
      await exitDemoMode();
    } catch (error) {
      console.error('Failed to exit demo mode:', error);
    }
  };

  // Show demo mode UI for demo user or when demoMode is true
  const isDemoUser = user?.email === 'demo@sourdoughtracker.com';
  if ((demoMode && !user) || isDemoUser) {
    return (
      <Card className="w-full max-w-sm border-bakery-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-bakery-900">
            <Eye className="w-4 h-4" />
            Demo Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-bakery-600">
            <p>You're viewing shared demo data.</p>
            <p className="mt-1">Sign in to save your own loaves and recipes.</p>
          </div>
          
          <Button
            onClick={handleExitDemo}
            variant="outline"
            size="sm"
            className="w-full border-bakery-300 text-bakery-700 hover:bg-bakery-100"
          >
            Exit Demo Mode
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm border-bakery-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-bakery-900">
          <User className="w-4 h-4" />
          Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <img
            src={user?.photoURL || ''}
            alt={user?.displayName || 'User'}
            className="w-10 h-10 rounded-full"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-bakery-900 truncate">
              {user?.displayName || 'Anonymous User'}
            </p>
            <p className="text-xs text-bakery-600 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        
        <Button
          onClick={handleSignOut}
          variant="outline"
          size="sm"
          className="w-full border-bakery-300 text-bakery-700 hover:bg-bakery-100"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </CardContent>
    </Card>
  );
}
