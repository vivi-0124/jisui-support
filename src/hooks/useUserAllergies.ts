import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { UserAllergy } from '@/lib/allergens';

interface UseUserAllergiesReturn {
  allergies: UserAllergy[];
  loading: boolean;
  error: string | null;
  addAllergy: (allergen: string, severity: 'mild' | 'moderate' | 'severe', notes?: string) => Promise<boolean>;
  updateAllergy: (id: string, updates: Partial<Pick<UserAllergy, 'severity' | 'notes'>>) => Promise<boolean>;
  removeAllergy: (id: string) => Promise<boolean>;
  refreshAllergies: () => Promise<void>;
}

export function useUserAllergies(): UseUserAllergiesReturn {
  const [allergies, setAllergies] = useState<UserAllergy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const refreshAllergies = useCallback(async () => {
    if (!user) {
      setAllergies([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('user_allergies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      setAllergies(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アレルギー情報の取得に失敗しました');
      console.error('Error fetching user allergies:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshAllergies();
  }, [refreshAllergies]);

  const addAllergy = useCallback(async (
    allergen: string, 
    severity: 'mild' | 'moderate' | 'severe', 
    notes?: string
  ): Promise<boolean> => {
    if (!user) {
      setError('ログインが必要です');
      return false;
    }

    try {
      setError(null);
      const { data, error: insertError } = await supabase
        .from('user_allergies')
        .insert({
          user_id: user.id,
          allergen,
          severity,
          notes: notes || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      
      setAllergies(prev => [...prev, data]);
      return true;
    } catch (err) {
      if (err instanceof Error && err.message.includes('duplicate key')) {
        setError('このアレルギーは既に登録されています');
      } else {
        setError(err instanceof Error ? err.message : 'アレルギーの追加に失敗しました');
      }
      console.error('Error adding allergy:', err);
      return false;
    }
  }, [user]);

  const updateAllergy = useCallback(async (
    id: string, 
    updates: Partial<Pick<UserAllergy, 'severity' | 'notes'>>
  ): Promise<boolean> => {
    if (!user) {
      setError('ログインが必要です');
      return false;
    }

    try {
      setError(null);
      const { data, error: updateError } = await supabase
        .from('user_allergies')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      
      setAllergies(prev => prev.map(allergy => 
        allergy.id === id ? { ...allergy, ...data } : allergy
      ));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アレルギー情報の更新に失敗しました');
      console.error('Error updating allergy:', err);
      return false;
    }
  }, [user]);

  const removeAllergy = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      setError('ログインが必要です');
      return false;
    }

    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from('user_allergies')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;
      
      setAllergies(prev => prev.filter(allergy => allergy.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アレルギーの削除に失敗しました');
      console.error('Error removing allergy:', err);
      return false;
    }
  }, [user]);

  return {
    allergies,
    loading,
    error,
    addAllergy,
    updateAllergy,
    removeAllergy,
    refreshAllergies,
  };
}