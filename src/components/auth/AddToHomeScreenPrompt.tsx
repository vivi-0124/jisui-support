'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AddToHomeScreen } from '@/components/ui/add-to-home-screen';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AddToHomeScreenPrompt() {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showHintIcon, setShowHintIcon] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Check if the app is already running in standalone (PWA) mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (!isStandalone) {
      setShowHintIcon(true);
      const hasShownPrompt = localStorage.getItem('hasShownAddToHomeScreen');
      if (!hasShownPrompt) {
        setDialogOpen(true);
        localStorage.setItem('hasShownAddToHomeScreen', 'true');
      }
    }
  }, [user]);

  return (
    <>
      {showHintIcon && (
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className={cn(
            'fixed bottom-4 right-4 z-50 rounded-full bg-primary p-3 text-primary-foreground shadow-lg transition hover:opacity-90',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
          )}
          aria-label="ホーム画面に追加する方法を表示"
        >
          <HelpCircle className="h-6 w-6" />
        </button>
      )}

      <AddToHomeScreen open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
} 