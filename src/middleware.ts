import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // 認証状態を確認
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const isAuthPage = url.pathname.startsWith('/auth');
  const isApiRoute = url.pathname.startsWith('/api');
  const isPublicPage = ['/'].includes(url.pathname);

  // APIルートやパブリックページは認証チェックをスキップ
  if (isApiRoute || isPublicPage) {
    return response;
  }

  // エラーが発生した場合の処理
  if (error) {
    console.error('ミドルウェア認証エラー:', error);
    // 認証エラーの場合、ログインページにリダイレクト
    if (!isAuthPage) {
      url.pathname = '/auth/login';
      url.searchParams.set('redirectTo', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  // 認証が必要なページの保護
  const protectedPaths = ['/dashboard', '/profile', '/settings'];
  const isProtectedPath = protectedPaths.some(path => 
    url.pathname.startsWith(path)
  );

  if (isProtectedPath && !user) {
    // 未認証ユーザーをログインページにリダイレクト
    url.pathname = '/auth/login';
    url.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // 認証済みユーザーが認証ページにアクセスした場合
  if (user && isAuthPage) {
    // リダイレクト先が指定されている場合はそこに、そうでなければホームページに
    const redirectTo = url.searchParams.get('redirectTo') || '/';
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  // セッションの自動更新
  if (user) {
    try {
      await supabase.auth.refreshSession();
    } catch (refreshError) {
      console.warn('セッション更新エラー:', refreshError);
      // セッション更新に失敗した場合はログインページにリダイレクト
      if (isProtectedPath) {
        url.pathname = '/auth/login';
        url.searchParams.set('redirectTo', request.nextUrl.pathname);
        return NextResponse.redirect(url);
      }
    }
  }

  // レスポンスヘッダーにセキュリティ関連の情報を追加
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    /*
     * 以下で始まるリクエストパス以外のすべてにマッチ:
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化ファイル)
     * - favicon.ico (ファビコン)
     * - robots.txt (ロボットファイル)
     * - sitemap.xml (サイトマップ)
     * - manifest.json (PWAマニフェスト)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
