import { createBrowserClient } from '@supabase/ssr';

// App Router クライアントコンポーネント用 Supabase クライアント
// createBrowserClient を使用することで、認証トークンが Cookie に保管され
// サーバーサイド（Middleware や Route Handlers）の createServerClient からも
// 同一セッションを参照できるようになります。

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
