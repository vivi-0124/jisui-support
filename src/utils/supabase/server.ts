/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies() as any;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // サーバーコンポーネントでCookieを設定できない場合のハンドリング
            console.warn('Cookie設定エラー (サーバーコンポーネント):', error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // サーバーコンポーネントでCookieを削除できない場合のハンドリング
            console.warn('Cookie削除エラー (サーバーコンポーネント):', error);
          }
        },
      },
    }
  );
}

// ユーザー認証を確認するヘルパー関数
export async function getUser() {
  const supabase = createClient();
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error('ユーザー取得エラー:', error);
      return null;
    }

    return user;
  } catch (error) {
    console.error('予期しないユーザー取得エラー:', error);
    return null;
  }
}

// セッションを確認するヘルパー関数
export async function getSession() {
  const supabase = createClient();
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error('セッション取得エラー:', error);
      return null;
    }

    return session;
  } catch (error) {
    console.error('予期しないセッション取得エラー:', error);
    return null;
  }
}
