/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        /**
         * Next.js の推奨に従い、`cookies()` は同期的に呼び出して
         * その場で値を取得します。これにより「`cookies()` should be awaited …」
         * の警告を抑制できます。
         */
        get(name: string) {
          return (cookies() as any).get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            (cookies() as any).set({ name, value, ...options });
          } catch {
            /* ignore */
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            (cookies() as any).set({ name, value: '', ...options });
          } catch {
            /* ignore */
          }
        },
      },
    }
  );
}
