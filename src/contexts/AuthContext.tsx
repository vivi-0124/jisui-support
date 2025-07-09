'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useMemo,
  useCallback,
} from 'react';
import { SupabaseClient, User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type { User };

interface AuthContextType {
  supabase: SupabaseClient;
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  // セッションを更新
  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('セッション更新エラー:', error);
        setError(error);
        return;
      }
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setError(null);
    } catch (err) {
      console.error('セッション更新中の予期しないエラー:', err);
      setError(err as AuthError);
    }
  }, []);

  // サインアウト
  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('サインアウトエラー:', error);
        setError(error);
        return;
      }
      setUser(null);
      setSession(null);
      setError(null);
    } catch (err) {
      console.error('サインアウト中の予期しないエラー:', err);
      setError(err as AuthError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.error('初期セッション取得エラー:', error);
          setError(error);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        console.error('初期セッション取得中の予期しないエラー:', err);
        setError(err as AuthError);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('認証状態変更:', { event, session });

        // セッションの有効性をチェック
        if (session && session.expires_at) {
          const expiresAt = new Date(session.expires_at * 1000);
          const now = new Date();
          
          // セッションが期限切れ間近の場合は更新
          if (expiresAt.getTime() - now.getTime() < 60000) { // 1分以内
            await refreshSession();
            return;
          }
        }

        setSession(session);
        setUser(session?.user ?? null);
        setError(null);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [refreshSession]);

  // セッションの自動更新（30分ごと）
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(async () => {
      if (session && session.expires_at) {
        const expiresAt = new Date(session.expires_at * 1000);
        const now = new Date();
        
        // セッション期限切れの30分前に更新
        if (expiresAt.getTime() - now.getTime() < 30 * 60 * 1000) {
          await refreshSession();
        }
      }
    }, 30 * 60 * 1000); // 30分ごと

    return () => clearInterval(interval);
  }, [session, refreshSession]);

  const value = useMemo(
    () => ({
      supabase,
      user,
      session,
      loading,
      error,
      signOut,
      refreshSession,
    }),
    [user, session, loading, error, signOut, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 認証が必要なページで使用するカスタムフック
export const useRequireAuth = () => {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && !user) {
      // リダイレクト処理は各コンポーネントで実装
      console.warn('認証が必要なページにアクセスしようとしています');
    }
  }, [user, loading]);

  return { user, loading, isAuthenticated: !!user };
};
