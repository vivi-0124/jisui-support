'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LoginForm } from './LoginForm';
import { SignUpForm } from './SignUpForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
  };

  // 認証成功時にモーダルを閉じるためのハンドラー
  const handleAuthSuccess = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-none bg-white p-0 shadow-2xl sm:max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>
            {mode === 'login' ? 'ログイン' : 'アカウント作成'}
          </DialogTitle>
        </DialogHeader>
        {mode === 'login' ? (
          <LoginForm
            onToggleMode={toggleMode}
            onAuthSuccess={handleAuthSuccess}
          />
        ) : (
          <SignUpForm
            onToggleMode={toggleMode}
            onAuthSuccess={handleAuthSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
