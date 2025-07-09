import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { generateId } from '@/utils/helpers';
import { ERROR_MESSAGES } from '@/constants';
import type { Ingredient, IngredientFormData } from '@/types';

export const useIngredients = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // データを読み込み
  const loadIngredients = useCallback(async () => {
    if (!user) {
      // 未ログイン時はローカルストレージから読み込み
      const localIngredients = JSON.parse(
        localStorage.getItem('ingredients_data') || '[]'
      );
      setIngredients(localIngredients);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIngredients(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.loadError);
      console.error('Error loading ingredients:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // データを保存（ローカルストレージ）
  const saveToLocalStorage = useCallback((data: Ingredient[]) => {
    if (!user) {
      localStorage.setItem('ingredients_data', JSON.stringify(data));
    }
  }, [user]);

  // 材料を追加/更新
  const saveIngredient = useCallback(async (
    ingredientData: IngredientFormData,
    editingId?: string
  ): Promise<boolean> => {
    try {
      if (user) {
        // ログイン時：Supabaseに保存
        if (editingId) {
          // 更新
          const { data, error } = await supabase
            .from('ingredients')
            .update(ingredientData)
            .eq('id', editingId)
            .select()
            .single();

          if (error) throw error;
          
          if (data.quantity <= 0) {
            await deleteIngredient(data.id);
          } else {
            setIngredients(prev => prev.map(i => i.id === data.id ? data : i));
          }
        } else {
          // 新規作成時、同じ名前と単位の材料が既存かチェック
          const existing = ingredients.find(
            i => i.name === ingredientData.name && i.unit === ingredientData.unit
          );

          if (existing) {
            // 既存なら数量を更新
            const newQuantity = existing.quantity + ingredientData.quantity;
            if (newQuantity <= 0) {
              await deleteIngredient(existing.id);
            } else {
              const { data, error } = await supabase
                .from('ingredients')
                .update({
                  quantity: newQuantity,
                  category: ingredientData.category,
                  expiry_date: ingredientData.expiry_date,
                  location: ingredientData.location,
                })
                .eq('id', existing.id)
                .select()
                .single();

              if (error) throw error;
              setIngredients(prev => prev.map(i => i.id === data.id ? data : i));
            }
          } else {
            // 新規作成
            const { data, error } = await supabase
              .from('ingredients')
              .insert([{ ...ingredientData, user_id: user.id }])
              .select()
              .single();

            if (error) throw error;
            if (data.quantity > 0) {
              setIngredients(prev => [...prev, data]);
            }
          }
        }
      } else {
        // 未ログイン時：ローカルストレージに保存
        if (editingId) {
          // 更新
          const updatedIngredients = ingredients
            .map(i => i.id === editingId ? { ...i, ...ingredientData } : i)
            .filter(i => i.quantity > 0);
          setIngredients(updatedIngredients);
          saveToLocalStorage(updatedIngredients);
        } else {
          // 新規作成時、同じ名前と単位の材料が既存かチェック
          const existingIndex = ingredients.findIndex(
            i => i.name === ingredientData.name && i.unit === ingredientData.unit
          );

          if (existingIndex >= 0) {
            // 既存なら数量を更新
            const newQuantity = ingredients[existingIndex].quantity + ingredientData.quantity;
            if (newQuantity <= 0) {
              const filtered = ingredients.filter((_, i) => i !== existingIndex);
              setIngredients(filtered);
              saveToLocalStorage(filtered);
            } else {
              const updated = ingredients.map((item, i) =>
                i === existingIndex
                  ? {
                      ...item,
                      quantity: newQuantity,
                      category: ingredientData.category,
                      expiry_date: ingredientData.expiry_date,
                      location: ingredientData.location,
                    }
                  : item
              );
              setIngredients(updated);
              saveToLocalStorage(updated);
            }
          } else {
            // 新規作成
            const newIngredient: Ingredient = {
              ...ingredientData,
              id: generateId(),
              user_id: 'local',
              created_at: new Date().toISOString(),
            };
            if (newIngredient.quantity > 0) {
              const updated = [...ingredients, newIngredient];
              setIngredients(updated);
              saveToLocalStorage(updated);
            }
          }
        }
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.saveError);
      console.error('Error saving ingredient:', err);
      return false;
    }
  }, [user, ingredients, saveToLocalStorage]);

  // 材料を削除
  const deleteIngredient = useCallback(async (id: string): Promise<boolean> => {
    try {
      if (user) {
        const { error } = await supabase
          .from('ingredients')
          .delete()
          .eq('id', id);

        if (error) throw error;
      }

      const updated = ingredients.filter(i => i.id !== id);
      setIngredients(updated);
      saveToLocalStorage(updated);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.saveError);
      console.error('Error deleting ingredient:', err);
      return false;
    }
  }, [user, ingredients, saveToLocalStorage]);

  // 複数の材料を一括追加（レシピからの追加時に使用）
  const addMultipleIngredients = useCallback(async (
    newIngredients: IngredientFormData[]
  ): Promise<boolean> => {
    try {
      if (user) {
        // Supabaseへの一括挿入
        const ingredientsToInsert = newIngredients.map(ingredient => ({
          ...ingredient,
          user_id: user.id,
        }));

        const { data, error } = await supabase
          .from('ingredients')
          .insert(ingredientsToInsert)
          .select();

        if (error) throw error;
        setIngredients(prev => [...prev, ...data]);
      } else {
        // ローカルストレージへの追加
        const ingredientsWithIds = newIngredients.map(ingredient => ({
          ...ingredient,
          id: generateId(),
          user_id: 'local',
          created_at: new Date().toISOString(),
        }));

        const updated = [...ingredients, ...ingredientsWithIds];
        setIngredients(updated);
        saveToLocalStorage(updated);
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.saveError);
      console.error('Error adding multiple ingredients:', err);
      return false;
    }
  }, [user, ingredients, saveToLocalStorage]);

  // 統計情報を計算
  const getStats = useCallback(() => {
    const totalItems = ingredients.length;
    const byCategory = ingredients.reduce((acc, ingredient) => {
      acc[ingredient.category] = (acc[ingredient.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalItems,
      byCategory,
    };
  }, [ingredients]);

  // データ読み込み
  useEffect(() => {
    loadIngredients();
  }, [loadIngredients]);

  // エラーをクリア
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    ingredients,
    loading,
    error,
    saveIngredient,
    deleteIngredient,
    addMultipleIngredients,
    loadIngredients,
    getStats,
    clearError,
  };
}; 