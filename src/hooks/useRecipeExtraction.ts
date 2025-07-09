import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { extractVideoId } from '@/utils/helpers';
import { ERROR_MESSAGES } from '@/constants';
import type { ExtractedRecipe, Video } from '@/types';

export const useRecipeExtraction = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // レシピ抽出を実行
  const extractRecipe = useCallback(async (video: Video): Promise<ExtractedRecipe | null> => {
    const videoId = extractVideoId(video.url);
    if (!videoId) {
      setError(ERROR_MESSAGES.invalidUrl);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // まず既存の抽出済みレシピをチェック
      if (user) {
        const { data: existingRecipe, error: checkError } = await supabase
          .from('extracted_recipes')
          .select('*')
          .eq('user_id', user.id)
          .eq('video_id', videoId)
          .single();

        if (!checkError && existingRecipe) {
          // 既存のレシピが見つかった場合
          return {
            title: existingRecipe.title,
            ingredients: existingRecipe.ingredients || [],
            steps: existingRecipe.steps || [],
            servings: existingRecipe.servings,
            cookingTime: existingRecipe.cooking_time,
            description: existingRecipe.description || '',
            extractionMethod: existingRecipe.extraction_method as ExtractedRecipe['extractionMethod'],
            videoId,
          };
        }
      }

      // 新しいレシピ抽出をAPI経由で実行
      const response = await fetch(`/api/youtube/extract-recipe?videoId=${videoId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'レシピの抽出に失敗しました');
      }

      const extractedRecipe: ExtractedRecipe = {
        ...data.recipe,
        videoId,
      };

      // データベースに保存（ログイン時のみ）
      if (user) {
        try {
          await supabase.from('extracted_recipes').upsert({
            user_id: user.id,
            video_id: videoId,
            title: extractedRecipe.title,
            ingredients: extractedRecipe.ingredients,
            steps: extractedRecipe.steps,
            servings: extractedRecipe.servings,
            cooking_time: extractedRecipe.cookingTime,
            description: extractedRecipe.description,
            extraction_method: extractedRecipe.extractionMethod,
            video_url: video.url,
            video_title: video.title,
            video_thumbnail: video.thumbnail,
          });
        } catch (saveError) {
          console.log('レシピ抽出結果の保存をスキップしました:', saveError);
        }
      }

      return extractedRecipe;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.networkError;
      setError(errorMessage);
      console.error('レシピ抽出エラー:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 既存の抽出済みレシピを取得
  const getExtractedRecipe = useCallback(async (videoId: string): Promise<ExtractedRecipe | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('extracted_recipes')
        .select('*')
        .eq('user_id', user.id)
        .eq('video_id', videoId)
        .single();

      if (error || !data) return null;

      return {
        title: data.title,
        ingredients: data.ingredients || [],
        steps: data.steps || [],
        servings: data.servings,
        cookingTime: data.cooking_time,
        description: data.description || '',
        extractionMethod: data.extraction_method as ExtractedRecipe['extractionMethod'],
        videoId,
      };
    } catch (err) {
      console.error('Error fetching extracted recipe:', err);
      return null;
    }
  }, [user]);

  // すべての抽出済みレシピを取得
  const getAllExtractedRecipes = useCallback(async (): Promise<ExtractedRecipe[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('extracted_recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(recipe => ({
        title: recipe.title,
        ingredients: recipe.ingredients || [],
        steps: recipe.steps || [],
        servings: recipe.servings,
        cookingTime: recipe.cooking_time,
        description: recipe.description || '',
        extractionMethod: recipe.extraction_method as ExtractedRecipe['extractionMethod'],
        videoId: recipe.video_id,
      }));
    } catch (err) {
      console.error('Error fetching all extracted recipes:', err);
      return [];
    }
  }, [user]);

  // 抽出済みレシピを削除
  const deleteExtractedRecipe = useCallback(async (videoId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('extracted_recipes')
        .delete()
        .eq('user_id', user.id)
        .eq('video_id', videoId);

      if (error) throw error;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.saveError);
      console.error('Error deleting extracted recipe:', err);
      return false;
    }
  }, [user]);

  // エラーをクリア
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    extractRecipe,
    getExtractedRecipe,
    getAllExtractedRecipes,
    deleteExtractedRecipe,
    clearError,
  };
}; 