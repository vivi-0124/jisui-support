# Supabase セキュリティベストプラクティスガイド

このガイドでは、自炊サポートアプリケーションにおけるSupabaseの認証とデータベースのセキュリティベストプラクティスについて説明します。

## 📋 目次

- [環境変数の設定](#環境変数の設定)
- [認証の実装](#認証の実装)
- [Row Level Security (RLS)](#row-level-security-rls)
- [セキュリティチェックリスト](#セキュリティチェックリスト)
- [トラブルシューティング](#トラブルシューティング)

## 🔐 環境変数の設定

### 必要な環境変数

`.env.local` ファイルに以下の環境変数を設定してください：

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# セキュリティ設定（本番環境用）
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # サーバーサイドのみ
NEXTAUTH_SECRET=your-secret-key  # JWT署名用（ランダムな32文字以上）
NEXTAUTH_URL=https://yourdomain.com  # 本番環境のURL
```

### 環境変数のセキュリティ注意点

1. **SUPABASE_SERVICE_ROLE_KEY**
   - 絶対にクライアントサイドで使用しない
   - サーバーサイドAPIでのみ使用
   - `.env.local` ファイルをgitにコミットしない

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - クライアントサイドで安全に使用可能
   - RLSが有効な場合のみ安全

## 🔑 認証の実装

### 1. 認証コンテキストの使用

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, loading, error, signOut } = useAuth();
  
  if (loading) return <div>読み込み中...</div>;
  if (error) return <div>エラー: {error.message}</div>;
  if (!user) return <div>ログインが必要です</div>;
  
  return (
    <div>
      <p>ようこそ、{user.email}さん</p>
      <button onClick={signOut}>ログアウト</button>
    </div>
  );
}
```

### 2. サーバーサイドでの認証確認

```typescript
import { getUser } from '@/utils/supabase/server';

export async function GET() {
  const user = await getUser();
  
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }
  
  // 認証済みユーザーのみの処理
  return NextResponse.json({ message: '成功' });
}
```

### 3. 保護されたページの実装

```typescript
import { useRequireAuth } from '@/contexts/AuthContext';

function ProtectedPage() {
  const { user, loading, isAuthenticated } = useRequireAuth();
  
  if (!isAuthenticated) {
    return <div>このページを表示するにはログインが必要です</div>;
  }
  
  return <div>保護されたコンテンツ</div>;
}
```

## 🛡️ Row Level Security (RLS)

### RLSの有効化

データベースの各テーブルでRLSを有効にしてください：

```sql
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
```

### セキュリティポリシーの例

```sql
-- ユーザーは自分の材料のみアクセス可能
CREATE POLICY "Users can view own ingredients" ON public.ingredients
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ingredients" ON public.ingredients
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 複雑なポリシーの例（動画テーブル）

```sql
-- ユーザーは自分のプレイリストの動画のみアクセス可能
CREATE POLICY "Users can view videos in own playlists" ON public.videos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.playlists 
            WHERE playlists.id = videos.playlist_id 
            AND playlists.user_id = auth.uid()
        )
    );
```

## ✅ セキュリティチェックリスト

### データベースセキュリティ

- [ ] すべてのテーブルでRLSが有効化されている
- [ ] 適切なセキュリティポリシーが設定されている
- [ ] 外部キー制約が設定されている
- [ ] 必要なインデックスが作成されている
- [ ] service_role keyがクライアントサイドで使用されていない

### 認証セキュリティ

- [ ] 認証状態の適切な管理
- [ ] セッションの自動更新
- [ ] エラーハンドリングの実装
- [ ] 保護されたルートの実装
- [ ] ミドルウェアでの認証チェック

### アプリケーションセキュリティ

- [ ] 環境変数の適切な管理
- [ ] HTTPS の使用（本番環境）
- [ ] セキュリティヘッダーの設定
- [ ] CSRFプロテクションの実装
- [ ] 入力値の検証とサニタイゼーション

### API セキュリティ

- [ ] APIエンドポイントでの認証確認
- [ ] レート制限の実装
- [ ] 適切なHTTPステータスコードの返却
- [ ] 機密情報の適切な処理
- [ ] ログの設定と監視

## 🔍 セキュリティテスト

### 1. RLS ポリシーのテスト

```sql
-- 別のユーザーのデータにアクセスできないことを確認
SELECT * FROM ingredients WHERE user_id != auth.uid();
-- 結果: 0件（自分のデータのみ表示される）
```

### 2. 認証テスト

```typescript
// 未認証でのAPIアクセステスト
const response = await fetch('/api/protected-endpoint');
console.log(response.status); // 401 Unauthorized であることを確認
```

### 3. 権限テスト

```typescript
// 他のユーザーのデータを操作しようとするテスト
const { error } = await supabase
  .from('ingredients')
  .update({ name: 'ハック' })
  .eq('user_id', 'other-user-id');
console.log(error); // RLSによって拒否されることを確認
```

## 🚨 トラブルシューティング

### よくある問題と解決方法

#### 1. 「Row Level Security policy violation」エラー

**原因**: RLSポリシーが正しく設定されていない、またはuser_idが一致しない

**解決方法**:
```sql
-- ポリシーの確認
SELECT * FROM pg_policies WHERE tablename = 'ingredients';

-- ユーザーIDの確認
SELECT auth.uid();
```

#### 2. 認証状態が正しく更新されない

**原因**: セッションの同期問題

**解決方法**:
```typescript
// 手動でセッションを更新
const { refreshSession } = useAuth();
await refreshSession();
```

#### 3. ミドルウェアで無限リダイレクト

**原因**: リダイレクトループが発生している

**解決方法**:
```typescript
// config.matcher の調整
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|auth).*)',
  ],
};
```

#### 4. 環境変数が読み込まれない

**原因**: ファイル名や設定の間違い

**解決方法**:
- `.env.local` ファイルがプロジェクトルートにあることを確認
- `NEXT_PUBLIC_` プレフィックスがクライアントサイド用変数に付いていることを確認
- サーバーを再起動

## 📚 参考資料

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Next.js Middleware](https://nextjs.org/docs/advanced-features/middleware)
- [OWASP Security Guidelines](https://owasp.org/www-project-web-security-testing-guide/)

## 🔄 定期的なセキュリティレビュー

### 月次チェック
- [ ] 使用していない権限の棚卸し
- [ ] ログの確認と異常なアクセスパターンの検出
- [ ] Supabaseのセキュリティアップデートの確認

### 四半期チェック
- [ ] セキュリティポリシーの見直し
- [ ] 依存関係のセキュリティ脆弱性チェック
- [ ] アクセス権限の見直し

### 年次チェック
- [ ] 包括的なセキュリティ監査
- [ ] 災害復旧計画の見直し
- [ ] セキュリティ教育の実施

---

**重要**: セキュリティは継続的なプロセスです。定期的な見直しと更新を行い、最新のベストプラクティスに従うことが重要です。 