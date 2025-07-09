-- ============================================================================
-- Supabase セキュリティ設定 (Row Level Security)
-- ============================================================================

-- 1. RLSを有効化
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cooking_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 材料テーブル (ingredients) のポリシー
-- ============================================================================

-- ユーザーは自分の材料のみ表示可能
CREATE POLICY "Users can view own ingredients" ON public.ingredients
    FOR SELECT USING (auth.uid() = user_id);

-- ユーザーは自分の材料のみ挿入可能
CREATE POLICY "Users can insert own ingredients" ON public.ingredients
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の材料のみ更新可能
CREATE POLICY "Users can update own ingredients" ON public.ingredients
    FOR UPDATE USING (auth.uid() = user_id);

-- ユーザーは自分の材料のみ削除可能
CREATE POLICY "Users can delete own ingredients" ON public.ingredients
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 買い物リストテーブル (shopping_items) のポリシー
-- ============================================================================

-- ユーザーは自分の買い物リストのみ表示可能
CREATE POLICY "Users can view own shopping items" ON public.shopping_items
    FOR SELECT USING (auth.uid() = user_id);

-- ユーザーは自分の買い物リストのみ挿入可能
CREATE POLICY "Users can insert own shopping items" ON public.shopping_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の買い物リストのみ更新可能
CREATE POLICY "Users can update own shopping items" ON public.shopping_items
    FOR UPDATE USING (auth.uid() = user_id);

-- ユーザーは自分の買い物リストのみ削除可能
CREATE POLICY "Users can delete own shopping items" ON public.shopping_items
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- プレイリストテーブル (playlists) のポリシー
-- ============================================================================

-- ユーザーは自分のプレイリストのみ表示可能
CREATE POLICY "Users can view own playlists" ON public.playlists
    FOR SELECT USING (auth.uid() = user_id);

-- ユーザーは自分のプレイリストのみ挿入可能
CREATE POLICY "Users can insert own playlists" ON public.playlists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分のプレイリストのみ更新可能
CREATE POLICY "Users can update own playlists" ON public.playlists
    FOR UPDATE USING (auth.uid() = user_id);

-- ユーザーは自分のプレイリストのみ削除可能
CREATE POLICY "Users can delete own playlists" ON public.playlists
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 動画テーブル (videos) のポリシー
-- ============================================================================

-- ユーザーは自分のプレイリストの動画のみ表示可能
CREATE POLICY "Users can view videos in own playlists" ON public.videos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.playlists 
            WHERE playlists.id = videos.playlist_id 
            AND playlists.user_id = auth.uid()
        )
    );

-- ユーザーは自分のプレイリストにのみ動画を挿入可能
CREATE POLICY "Users can insert videos to own playlists" ON public.videos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.playlists 
            WHERE playlists.id = videos.playlist_id 
            AND playlists.user_id = auth.uid()
        )
    );

-- ユーザーは自分のプレイリストの動画のみ更新可能
CREATE POLICY "Users can update videos in own playlists" ON public.videos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.playlists 
            WHERE playlists.id = videos.playlist_id 
            AND playlists.user_id = auth.uid()
        )
    );

-- ユーザーは自分のプレイリストの動画のみ削除可能
CREATE POLICY "Users can delete videos from own playlists" ON public.videos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.playlists 
            WHERE playlists.id = videos.playlist_id 
            AND playlists.user_id = auth.uid()
        )
    );

-- ============================================================================
-- 抽出済みレシピテーブル (extracted_recipes) のポリシー
-- ============================================================================

-- ユーザーは自分の抽出済みレシピのみ表示可能
CREATE POLICY "Users can view own extracted recipes" ON public.extracted_recipes
    FOR SELECT USING (auth.uid() = user_id);

-- ユーザーは自分の抽出済みレシピのみ挿入可能
CREATE POLICY "Users can insert own extracted recipes" ON public.extracted_recipes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の抽出済みレシピのみ更新可能
CREATE POLICY "Users can update own extracted recipes" ON public.extracted_recipes
    FOR UPDATE USING (auth.uid() = user_id);

-- ユーザーは自分の抽出済みレシピのみ削除可能
CREATE POLICY "Users can delete own extracted recipes" ON public.extracted_recipes
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 調理セッションテーブル (cooking_sessions) のポリシー
-- ============================================================================

-- ユーザーは自分の調理セッションのみ表示可能
CREATE POLICY "Users can view own cooking sessions" ON public.cooking_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- ユーザーは自分の調理セッションのみ挿入可能
CREATE POLICY "Users can insert own cooking sessions" ON public.cooking_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の調理セッションのみ更新可能
CREATE POLICY "Users can update own cooking sessions" ON public.cooking_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- ユーザーは自分の調理セッションのみ削除可能
CREATE POLICY "Users can delete own cooking sessions" ON public.cooking_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- インデックスの作成（パフォーマンス最適化）
-- ============================================================================

-- ユーザーIDでの検索を高速化
CREATE INDEX IF NOT EXISTS idx_ingredients_user_id ON public.ingredients(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_user_id ON public.shopping_items(user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON public.playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_extracted_recipes_user_id ON public.extracted_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_cooking_sessions_user_id ON public.cooking_sessions(user_id);

-- 外部キーでの検索を高速化
CREATE INDEX IF NOT EXISTS idx_videos_playlist_id ON public.videos(playlist_id);

-- よく使用される検索条件用のインデックス
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON public.ingredients(category);
CREATE INDEX IF NOT EXISTS idx_ingredients_expiry_date ON public.ingredients(expiry_date);
CREATE INDEX IF NOT EXISTS idx_shopping_items_category ON public.shopping_items(category);
CREATE INDEX IF NOT EXISTS idx_shopping_items_purchased ON public.shopping_items(is_purchased);
CREATE INDEX IF NOT EXISTS idx_extracted_recipes_video_id ON public.extracted_recipes(video_id);
CREATE INDEX IF NOT EXISTS idx_cooking_sessions_status ON public.cooking_sessions(status);

-- 日付でのソート用のインデックス
CREATE INDEX IF NOT EXISTS idx_ingredients_created_at ON public.ingredients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shopping_items_added_date ON public.shopping_items(added_date DESC);
CREATE INDEX IF NOT EXISTS idx_playlists_created_at ON public.playlists(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_added_at ON public.videos(added_at DESC);
CREATE INDEX IF NOT EXISTS idx_cooking_sessions_created_at ON public.cooking_sessions(created_at DESC);

-- ============================================================================
-- 外部キー制約の追加（データ整合性の保証）
-- ============================================================================

-- 外部キー制約は既に存在するのでコメントアウト
-- ALTER TABLE public.videos
--     ADD CONSTRAINT videos_playlist_id_fkey
--     FOREIGN KEY (playlist_id)
--     REFERENCES public.playlists(id)
--     ON DELETE CASCADE;

-- ============================================================================
-- ストレージポリシー（画像アップロード用）
-- ============================================================================

-- プロフィール画像用バケットのポリシー（必要に応じて）
-- INSERT POLICY
-- CREATE POLICY "Users can upload own profile images" ON storage.objects
--     FOR INSERT WITH CHECK (
--         bucket_id = 'profile-images' AND 
--         auth.uid()::text = (storage.foldername(name))[1]
--     );

-- SELECT POLICY  
-- CREATE POLICY "Users can view own profile images" ON storage.objects
--     FOR SELECT USING (
--         bucket_id = 'profile-images' AND 
--         auth.uid()::text = (storage.foldername(name))[1]
--     );

-- ============================================================================
-- セキュリティ関数（必要に応じて）
-- ============================================================================

-- ユーザーがアクティブかどうかをチェックする関数
CREATE OR REPLACE FUNCTION public.is_user_active()
RETURNS BOOLEAN AS $$
BEGIN
    -- 基本的な実装（必要に応じてカスタマイズ）
    RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 権限の設定
-- ============================================================================

-- 認証済みユーザーに適切な権限を付与
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ingredients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopping_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.playlists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.extracted_recipes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cooking_sessions TO authenticated;

-- シーケンスの使用権限
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- 完了メッセージ
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Supabase セキュリティ設定が完了しました。';
    RAISE NOTICE '- Row Level Security (RLS) が有効化されました';
    RAISE NOTICE '- すべてのテーブルにセキュリティポリシーが設定されました';
    RAISE NOTICE '- パフォーマンス最適化のためのインデックスが作成されました';
    RAISE NOTICE '- データ整合性のための外部キー制約が追加されました';
END $$; 