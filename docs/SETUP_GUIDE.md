# セットアップガイド

自炊サポートアプリケーションのセットアップと環境設定について説明します。

## 📋 前提条件

- Node.js 18.0以上
- npm または yarn
- Supabaseアカウント

## 🚀 セットアップ手順

### 1. プロジェクトのクローンと依存関係のインストール

```bash
git clone https://github.com/your-username/recipe-v3.git
cd recipe-v3
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルをプロジェクトルートに作成し、以下の設定を行ってください：

```bash
# ============================================================================
# 自炊サポートアプリ 環境変数設定
# ============================================================================

# ----------------------------------------------------------------------------
# Supabase 設定 (必須)
# ----------------------------------------------------------------------------
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# ----------------------------------------------------------------------------
# YouTube API設定 (レシピ検索機能用)
# ----------------------------------------------------------------------------
YOUTUBE_API_KEY=your-youtube-api-key-here

# ----------------------------------------------------------------------------
# Gemini AI設定 (レシピ抽出機能用)
# ----------------------------------------------------------------------------
GEMINI_API_KEY=your-gemini-api-key-here

# ----------------------------------------------------------------------------
# セキュリティ設定
# ----------------------------------------------------------------------------
NEXTAUTH_SECRET=your-super-secure-secret-key-here-32-chars-minimum
NEXTAUTH_URL=http://localhost:3000
```

### 3. Supabaseプロジェクトのセットアップ

#### 3.1 Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセス
2. 新しいプロジェクトを作成
3. データベースパスワードを設定

#### 3.2 データベーステーブルの作成

Supabaseダッシュボードの SQL Editor で以下のテーブルを作成：

```sql
-- 材料テーブル
CREATE TABLE public.ingredients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity NUMERIC NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    expiry_date DATE,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 買い物リストテーブル
CREATE TABLE public.shopping_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity NUMERIC NOT NULL DEFAULT 1,
    unit TEXT NOT NULL,
    is_purchased BOOLEAN DEFAULT FALSE,
    notes TEXT,
    added_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- プレイリストテーブル
CREATE TABLE public.playlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 動画テーブル
CREATE TABLE public.videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    thumbnail TEXT NOT NULL,
    duration TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 抽出済みレシピテーブル
CREATE TABLE public.extracted_recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    title TEXT NOT NULL,
    ingredients TEXT[],
    steps TEXT[],
    servings TEXT,
    cooking_time TEXT,
    description TEXT,
    extraction_method TEXT NOT NULL,
    video_url TEXT NOT NULL,
    video_title TEXT NOT NULL,
    video_thumbnail TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 調理セッションテーブル
CREATE TABLE public.cooking_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dish_name TEXT NOT NULL,
    servings INTEGER NOT NULL DEFAULT 1,
    used_ingredients JSONB,
    cooking_time INTEGER NOT NULL,
    notes TEXT,
    recipe_video_url TEXT,
    video_id TEXT,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);
```

#### 3.3 セキュリティポリシーの設定

`sql/setup_security.sql` ファイルを実行してRLSとセキュリティポリシーを設定：

```bash
# SQLファイルをSupabaseで実行
cat sql/setup_security.sql
```

### 4. 外部APIの設定

#### 4.1 YouTube Data API v3の設定

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成または既存のプロジェクトを選択
3. YouTube Data API v3を有効化
4. 認証情報でAPIキーを作成
5. APIキーを `.env.local` の `YOUTUBE_API_KEY` に設定

#### 4.2 Gemini AI APIの設定

1. [Google AI Studio](https://aistudio.google.com/)にアクセス
2. APIキーを作成
3. APIキーを `.env.local` の `GEMINI_API_KEY` に設定

### 5. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションが `http://localhost:3000` で起動します。

## 🔧 カスタマイズ設定

### テーマとスタイルの変更

テーマバリアントは `src/lib/theme-variants.ts` で管理されています：

```typescript
// テーマカラーの変更例
export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      theme: {
        ingredients: "bg-green-600 text-white hover:bg-green-700",
        shopping: "bg-purple-600 text-white hover:bg-purple-700",
        recipes: "bg-orange-600 text-white hover:bg-orange-700",
        cooking: "bg-red-600 text-white hover:bg-red-700",
      },
    },
  }
);
```

### カテゴリと単位の変更

カテゴリと単位は `src/constants/index.ts` で管理されています：

```typescript
// カテゴリの追加例
export const CATEGORIES = [
  '野菜',
  '肉類',
  '魚介類',
  '乳製品',
  '調味料',
  '冷凍食品',
  'スパイス',  // 新しいカテゴリを追加
  'その他',
] as const;
```

### 機能の有効/無効化

アプリケーション設定は `src/constants/index.ts` の `APP_CONFIG` で管理：

```typescript
export const APP_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  defaultServings: 2,
  defaultCookingTime: 30,
  searchDebounceMs: 300,
  maxSearchResults: 50,
  // 機能フラグ
  enableYouTubeSearch: true,
  enableRecipeExtraction: true,
  enableCookingMode: true,
} as const;
```

## 🚀 本番環境へのデプロイ

### Vercelでのデプロイ

1. プロジェクトをGitHubにプッシュ
2. [Vercel](https://vercel.com)でプロジェクトをインポート
3. 環境変数を設定：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `YOUTUBE_API_KEY`
   - `GEMINI_API_KEY`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (本番ドメインに変更)

### その他のプラットフォーム

- **Netlify**: 同様に環境変数を設定
- **Railway**: Dockerでのデプロイも可能
- **自前サーバー**: PM2やDockerを使用

## 🔍 トラブルシューティング

### よくある問題

#### 1. Supabase接続エラー

```
Error: Invalid API URL or key
```

**解決方法**:
- `.env.local` の `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を確認
- Supabaseプロジェクトの設定画面でURLとキーを再確認

#### 2. RLSポリシーエラー

```
Error: Row Level Security policy violation
```

**解決方法**:
- `sql/setup_security.sql` が正しく実行されているか確認
- ユーザーがログインしているか確認

#### 3. YouTube API エラー

```
Error: YouTube API quota exceeded
```

**解決方法**:
- Google Cloud Consoleで API使用量を確認
- 必要に応じてクォータを増量申請

#### 4. 環境変数が読み込まれない

**解決方法**:
- ファイル名が `.env.local` であることを確認
- サーバーを再起動
- `NEXT_PUBLIC_` プレフィックスがクライアントサイド用変数に付いているか確認

## 📚 開発ガイド

### ディレクトリ構造

```
src/
├── app/                 # Next.js App Router
├── components/          # Reactコンポーネント
│   ├── ui/             # 基本UIコンポーネント
│   └── youtube/        # YouTube関連コンポーネント
├── contexts/           # Reactコンテキスト
├── hooks/              # カスタムフック
├── lib/                # ライブラリ設定
├── types/              # TypeScript型定義
├── utils/              # ユーティリティ関数
└── constants/          # 定数定義
```

### コーディング規約

1. **TypeScript**: 厳密な型定義を使用
2. **ESLint**: 設定済みのルールに従う
3. **Prettier**: コードフォーマットを統一
4. **コンポーネント**: 単一責任の原則に従う
5. **ファイル名**: kebab-case を使用

### Git ワークフロー

1. `main` ブランチから新しいブランチを作成
2. 機能を実装
3. プルリクエストを作成
4. レビュー後にマージ

## 🔒 セキュリティ設定

詳細なセキュリティガイドは `docs/SECURITY_GUIDE.md` を参照してください。

### 基本的なセキュリティチェック

- [ ] RLS が有効化されている
- [ ] 環境変数が適切に設定されている
- [ ] Service Role Key がクライアントサイドで使用されていない
- [ ] HTTPS を使用している（本番環境）
- [ ] セキュリティヘッダーが設定されている

## 📞 サポート

問題が発生した場合：

1. このガイドのトラブルシューティングセクションを確認
2. プロジェクトのIssuesで既知の問題を検索
3. 新しいIssueを作成して質問

---

**注意**: このアプリケーションは個人情報を扱うため、セキュリティ設定は特に重要です。本番環境への展開前に、セキュリティガイドを必ず確認してください。 