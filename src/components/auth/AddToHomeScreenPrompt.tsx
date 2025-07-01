'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AddToHomeScreen } from '@/components/ui/add-to-home-screen';

export function AddToHomeScreenPrompt() {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // ユーザーがログインしている場合のみ表示
    if (user) {
      // すでにホーム画面に追加済みでない場合のみ表示
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      
      if (!isStandalone) {
        // ローカルストレージをチェックして、以前に表示したかどうかを確認
        const hasShownPrompt = localStorage.getItem('hasShownAddToHomeScreen');
        if (!hasShownPrompt) {
          setShowPrompt(true);
          localStorage.setItem('hasShownAddToHomeScreen', 'true');
        }
      }
    }
  }, [user]);

  return (
    <AddToHomeScreen
      open={showPrompt}
      onOpenChange={setShowPrompt}
    />
  );
} 