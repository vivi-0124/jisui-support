# クイックスタートガイド（開発者向け）

このドキュメントは、Mealog（ミーログ）の開発・セットアップを行う開発者向けのガイドです。

## 🚀 セットアップ手順

### 1. プロジェクトのクローンと依存関係のインストール

```bash
git clone https://github.com/vivi-0124/jisui-support.git
cd jisui-support
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルを作成し、以下の環境変数を設定してください：

```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# YouTube Data API
YOUTUBE_API_KEY=your_youtube_api_key

# Gemini AI API
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Supabaseプロジェクトのセットアップ

#### 3.1 Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセス
2. 新しいプロジェクトを作成
3. データベースパスワードを設定

#### 3.2 データベーススキーマの作成

以下のSQLを実行してテーブルを作成：

```sql
-- ユーザーの材料管理テーブル
CREATE TABLE ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT NOT NULL,
  expiry_date DATE,
  notes TEXT,
  added_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 買い物リストテーブル
CREATE TABLE shopping_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT NOT NULL,
  is_purchased BOOLEAN DEFAULT FALSE,
  notes TEXT,
  added_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- プレイリストテーブル
CREATE TABLE playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 動画テーブル
CREATE TABLE videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail TEXT,
  duration TEXT,
  ingredients TEXT[] DEFAULT '{}',
  steps TEXT[] DEFAULT '{}',
  servings TEXT,
  cooking_time TEXT,
  description TEXT,
  extraction_method TEXT,
  added_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3.3 Row Level Security (RLS) の設定

```sql
-- RLSを有効化
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- RLSポリシーの作成
CREATE POLICY "Users can manage their own ingredients" ON ingredients
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own shopping items" ON shopping_items
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own playlists" ON playlists
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own videos" ON videos
  FOR ALL USING (auth.uid() = user_id);
```

### 4. 外部APIの設定

#### 4.1 YouTube Data API

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成
3. YouTube Data API v3 を有効化
4. APIキーを生成して環境変数に設定

#### 4.2 Gemini AI API

1. [Google AI Studio](https://ai.google.dev/)にアクセス
2. APIキーを生成
3. 環境変数に設定

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスして動作を確認してください。

## 📁 プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   └── youtube/       # YouTube関連API
│   ├── globals.css        # グローバルスタイル
│   ├── layout.tsx         # ルートレイアウト
│   └── page.tsx          # メインページ
├── components/            # Reactコンポーネント
│   ├── auth/             # 認証関連
│   ├── ui/               # UI共通コンポーネント
│   ├── youtube/          # YouTube関連
│   ├── cooking-management.tsx
│   ├── ingredients-management.tsx
│   ├── recipe-management.tsx
│   └── shopping-list.tsx
├── contexts/             # React Context
│   └── AuthContext.tsx  # 認証コンテキスト
├── lib/                  # ユーティリティ
│   ├── supabase.ts      # Supabase設定
│   └── theme-variants.ts # テーマバリアント
├── utils/               # ヘルパー関数
└── middleware.ts        # Next.js Middleware
```

## 🛠️ 開発ガイド

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

### テスト

```bash
npm run lint    # ESLint実行
npm run build   # ビルドテスト
```

## 🚀 本番環境へのデプロイ

### Vercelでのデプロイ

1. [Vercel](https://vercel.com/)にアカウント作成
2. GitHubリポジトリと連携
3. 環境変数を設定
4. 自動デプロイの設定

### 環境変数の設定（本番環境）

Vercelのダッシュボードで以下の環境変数を設定：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `YOUTUBE_API_KEY`
- `GEMINI_API_KEY`

### その他のプラットフォーム

- **Netlify**: 同様に環境変数を設定
- **Railway**: Dockerでのデプロイも可能
- **自前サーバー**: PM2やDockerを使用

## 🔧 トラブルシューティング

### よくある問題

1. **Supabase接続エラー**
   - 環境変数の確認
   - RLSポリシーの設定確認
   
2. **YouTube API制限**
   - API使用量の確認
   - レート制限の確認
   
3. **Gemini AI API エラー**
   - APIキーの有効性確認
   - リクエスト形式の確認

### デバッグ情報

開発環境では以下でデバッグ情報を確認できます：

```bash
# ログ出力の確認
npm run dev

# ビルドエラーの詳細確認
npm run build
```

## 📚 参考資料

- [Next.js ドキュメント](https://nextjs.org/docs)
- [Supabase ドキュメント](https://supabase.com/docs)
- [YouTube Data API](https://developers.google.com/youtube/v3)
- [Gemini AI API](https://ai.google.dev/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn/ui](https://ui.shadcn.com/)

---

## 🤝 コントリビューション

プロジェクトへの貢献を歓迎します：

1. Issueの報告
2. 機能提案
3. プルリクエスト
4. ドキュメントの改善

詳細は [CONTRIBUTING.md](CONTRIBUTING.md) をご確認ください。

---

*最終更新: 2024年7月*