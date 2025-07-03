'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Mail, Lock, Chrome, UserPlus } from 'lucide-react';

interface SignUpFormProps {
  onToggleMode: () => void;
  onAuthSuccess: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({
  onToggleMode,
  onAuthSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { supabase, user } = useAuth();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleAnonymousSignUp = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) {
        setError(error.message);
      } else {
        setSuccess('匿名アカウントを作成しました');
        onAuthSuccess();
      }
    } catch {
      setError('匿名アカウントの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      setLoading(false);
      return;
    }

    try {
      let result;
      if (user?.id) {
        // 既存の匿名ユーザーの場合、アカウントをリンク
        result = await supabase.auth.updateUser({
          email,
          password,
        });
      } else {
        // 新規ユーザー登録
        result = await supabase.auth.signUp({
          email,
          password,
        });
      }

      if (result.error) {
        setError(result.error.message);
      } else {
        setSuccess('確認メールを送信しました。メールをご確認ください。');
        onAuthSuccess();
      }
    } catch {
      setError('アカウント作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md border-none shadow-none">
      <CardHeader className="space-y-3 pb-6 text-center">
        <CardTitle className="bg-gradient-to-r from-green-500 via-purple-500 to-blue-500 bg-clip-text text-2xl font-bold text-transparent">
          アカウント作成
        </CardTitle>
        <CardDescription className="text-gray-500">
          {user?.id
            ? 'メールアドレスとパスワードを設定してアカウントを完成させましょう'
            : 'アカウントを作成して機能を最大限に活用しましょう'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              メールアドレス
            </Label>
            <div className="relative">
              <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-xl border-gray-200 bg-gray-50 pl-10 transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              パスワード
            </Label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 rounded-xl border-gray-200 bg-gray-50 pl-10 transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-gray-700"
            >
              パスワード（確認）
            </Label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-11 rounded-xl border-gray-200 bg-gray-50 pl-10 transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="h-11 w-full rounded-xl bg-gradient-to-r from-green-500 via-purple-500 to-blue-500 font-semibold text-white shadow-md transition-all duration-200 hover:from-green-600 hover:via-purple-600 hover:to-blue-600 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                {user?.id ? 'アカウントを完成させる' : 'メールアドレスで登録'}
              </>
            )}
          </Button>
        </form>

        {!user?.id && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">または</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="h-11 w-full rounded-xl border-2 border-gray-200 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Chrome className="mr-2 h-4 w-4" />
                )}
                Googleでログイン
              </Button>

              <Button
                variant="outline"
                className="h-11 w-full rounded-xl border-2 border-gray-200 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50"
                onClick={handleAnonymousSignUp}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                匿名で始める
              </Button>
            </div>
          </>
        )}

        <div className="text-center">
          <Button
            variant="link"
            onClick={onToggleMode}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            すでにアカウントをお持ちの方はこちら
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
