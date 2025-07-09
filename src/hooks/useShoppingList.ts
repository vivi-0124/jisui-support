import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { generateId } from '@/utils/helpers';
import { ERROR_MESSAGES } from '@/constants';
import type { ShoppingItem, ShoppingItemFormData, IngredientToAdd } from '@/types';

export const useShoppingList = () => {
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // データを読み込み
  const loadShoppingItems = useCallback(async () => {
    if (!user) {
      // 未ログイン時はローカルストレージから読み込み
      const localItems = JSON.parse(
        localStorage.getItem('shopping_list_data') || '[]'
      );
      setShoppingItems(localItems);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('user_id', user.id)
        .order('added_date', { ascending: false });

      if (error) throw error;
      setShoppingItems(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.loadError);
      console.error('Error loading shopping items:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // データを保存（ローカルストレージ）
  const saveToLocalStorage = useCallback((data: ShoppingItem[]) => {
    if (!user) {
      localStorage.setItem('shopping_list_data', JSON.stringify(data));
    }
  }, [user]);

  // アイテムを追加/更新
  const saveShoppingItem = useCallback(async (
    itemData: ShoppingItemFormData,
    editingId?: string
  ): Promise<boolean> => {
    try {
      if (user) {
        // ログイン時：Supabaseに保存
        if (editingId) {
          // 更新
          const { data, error } = await supabase
            .from('shopping_items')
            .update(itemData)
            .eq('id', editingId)
            .select()
            .single();

          if (error) throw error;
          setShoppingItems(prev => prev.map(item => item.id === data.id ? data : item));
        } else {
          // 新規作成
          const { data, error } = await supabase
            .from('shopping_items')
            .insert([{ ...itemData, user_id: user.id }])
            .select()
            .single();

          if (error) throw error;
          setShoppingItems(prev => [...prev, data]);
        }
      } else {
        // 未ログイン時：ローカルストレージに保存
        if (editingId) {
          // 更新
          const updatedItems = shoppingItems.map(item =>
            item.id === editingId
              ? { ...item, ...itemData }
              : item
          );
          setShoppingItems(updatedItems);
          saveToLocalStorage(updatedItems);
        } else {
          // 新規作成
          const newItem: ShoppingItem = {
            ...itemData,
            id: generateId(),
            user_id: 'local',
            added_date: new Date().toISOString(),
          };
          const updated = [...shoppingItems, newItem];
          setShoppingItems(updated);
          saveToLocalStorage(updated);
        }
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.saveError);
      console.error('Error saving shopping item:', err);
      return false;
    }
  }, [user, shoppingItems, saveToLocalStorage]);

  // アイテムを削除
  const deleteShoppingItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      if (user) {
        const { error } = await supabase
          .from('shopping_items')
          .delete()
          .eq('id', id);

        if (error) throw error;
      }

      const updated = shoppingItems.filter(item => item.id !== id);
      setShoppingItems(updated);
      saveToLocalStorage(updated);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.saveError);
      console.error('Error deleting shopping item:', err);
      return false;
    }
  }, [user, shoppingItems, saveToLocalStorage]);

  // 購入状態を切り替え
  const togglePurchaseStatus = useCallback(async (id: string): Promise<boolean> => {
    const itemToUpdate = shoppingItems.find(item => item.id === id);
    if (!itemToUpdate) return false;

    const newPurchaseStatus = !itemToUpdate.is_purchased;

    try {
      if (user) {
        const { data, error } = await supabase
          .from('shopping_items')
          .update({ is_purchased: newPurchaseStatus })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        setShoppingItems(prev => prev.map(item => item.id === id ? data : item));
      } else {
        const updated = shoppingItems.map(item =>
          item.id === id ? { ...item, is_purchased: newPurchaseStatus } : item
        );
        setShoppingItems(updated);
        saveToLocalStorage(updated);
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.saveError);
      console.error('Error updating purchase status:', err);
      return false;
    }
  }, [user, shoppingItems, saveToLocalStorage]);

  // 複数の材料を買い物リストに追加
  const addIngredientsToShoppingList = useCallback(async (
    ingredients: IngredientToAdd[]
  ): Promise<boolean> => {
    try {
      if (user) {
        const itemsToInsert = ingredients.map(ingredient => ({
          user_id: user.id,
          name: ingredient.name,
          category: ingredient.category,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          is_purchased: false,
          notes: ingredient.notes || null,
        }));

        const { data, error } = await supabase
          .from('shopping_items')
          .insert(itemsToInsert)
          .select();

        if (error) throw error;
        setShoppingItems(prev => [...prev, ...data]);
      } else {
        const newItems = ingredients.map(ingredient => ({
          id: generateId(),
          user_id: 'local',
          name: ingredient.name,
          category: ingredient.category,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          is_purchased: false,
          notes: ingredient.notes || null,
          added_date: new Date().toISOString(),
        }));
        const updated = [...shoppingItems, ...newItems];
        setShoppingItems(updated);
        saveToLocalStorage(updated);
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.saveError);
      console.error('Error adding ingredients to shopping list:', err);
      return false;
    }
  }, [user, shoppingItems, saveToLocalStorage]);

  // 購入済みアイテムを材料管理に移動（削除）
  const movePurchasedItemsToIngredients = useCallback(async (): Promise<ShoppingItem[]> => {
    const purchasedItems = shoppingItems.filter(item => item.is_purchased);
    
    try {
      if (user) {
        const itemIdsToRemove = purchasedItems.map(item => item.id);
        const { error } = await supabase
          .from('shopping_items')
          .delete()
          .in('id', itemIdsToRemove);

        if (error) throw error;
      }

      const remaining = shoppingItems.filter(item => !item.is_purchased);
      setShoppingItems(remaining);
      saveToLocalStorage(remaining);
      
      return purchasedItems;
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.saveError);
      console.error('Error moving purchased items:', err);
      return [];
    }
  }, [user, shoppingItems, saveToLocalStorage]);

  // 統計情報を計算
  const getStats = useCallback(() => {
    const totalItems = shoppingItems.length;
    const purchased = shoppingItems.filter(item => item.is_purchased).length;
    const unpurchased = totalItems - purchased;
    const byCategory = shoppingItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalItems,
      purchased,
      unpurchased,
      byCategory,
    };
  }, [shoppingItems]);

  // フィルター済みアイテムを取得
  const getPurchasedItems = useCallback(() => {
    return shoppingItems.filter(item => item.is_purchased);
  }, [shoppingItems]);

  const getUnpurchasedItems = useCallback(() => {
    return shoppingItems.filter(item => !item.is_purchased);
  }, [shoppingItems]);

  // データ読み込み
  useEffect(() => {
    loadShoppingItems();
  }, [loadShoppingItems]);

  // エラーをクリア
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    shoppingItems,
    loading,
    error,
    saveShoppingItem,
    deleteShoppingItem,
    togglePurchaseStatus,
    addIngredientsToShoppingList,
    movePurchasedItemsToIngredients,
    getPurchasedItems,
    getUnpurchasedItems,
    getStats,
    loadShoppingItems,
    clearError,
  };
}; 