'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Package,
  Calendar,
  AlertTriangle,
  Trash2,
  Edit,
} from 'lucide-react';
import { buttonVariants, iconColorVariants } from '@/lib/theme-variants';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface IngredientsManagementProps {
  ingredients: Ingredient[];
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
}

export interface Ingredient {
  id: string; // uuid
  user_id: string; // 追加
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiry_date: string | null; // expiryDateをexpiry_dateに変更し、null許容
  location: string | null; // null許容
  created_at: string; // 追加
}

const categories = [
  '野菜',
  '肉類',
  '魚介類',
  '乳製品',
  '調味料',
  '冷凍食品',
  'その他',
];

const units = ['個', 'g', 'kg', 'ml', 'L', '本', '枚', '袋', 'パック'];

const locations = ['冷蔵庫', '冷凍庫', '常温', '野菜室'];

interface AddIngredientButtonProps {
  onSave: (
    ingredient: Omit<Ingredient, 'id' | 'user_id' | 'created_at'>
  ) => void; // 型定義を更新
  editingIngredient?: Ingredient | null;
  onEditComplete?: () => void;
  children: React.ReactNode;
}

function AddIngredientButton({
  onSave,
  editingIngredient,
  onEditComplete,
  children,
}: AddIngredientButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newIngredient, setNewIngredient] = useState<
    Omit<Ingredient, 'id' | 'user_id' | 'created_at'>
  >({
    name: '',
    category: '',
    quantity: 1,
    unit: '',
    expiry_date: null,
    location: null,
  });

  useEffect(() => {
    if (editingIngredient) {
      setNewIngredient({
        name: editingIngredient.name,
        category: editingIngredient.category,
        quantity: editingIngredient.quantity,
        unit: editingIngredient.unit,
        expiry_date: editingIngredient.expiry_date,
        location: editingIngredient.location,
      });
      setIsDialogOpen(true);
    }
  }, [editingIngredient]);

  const handleSaveIngredient = () => {
    if (!newIngredient.name || !newIngredient.category || !newIngredient.unit) {
      alert('必須項目を入力してください');
      return;
    }

    onSave(newIngredient);
    handleCloseDialog();
    if (editingIngredient && onEditComplete) {
      onEditComplete();
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setNewIngredient({
      name: '',
      category: '',
      quantity: 1,
      unit: '',
      expiry_date: null,
      location: null,
    });
    if (editingIngredient && onEditComplete) {
      onEditComplete();
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingIngredient ? '材料を編集' : '新しい材料を追加'}
          </DialogTitle>
          <DialogDescription>
            材料の詳細情報を入力してください。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="name">材料名 *</Label>
            <Input
              id="name"
              value={newIngredient.name}
              onChange={(e) =>
                setNewIngredient({ ...newIngredient, name: e.target.value })
              }
              placeholder="例: にんじん"
            />
          </div>
          <div>
            <Label htmlFor="category">カテゴリ *</Label>
            <Select
              value={newIngredient.category}
              onValueChange={(value) =>
                setNewIngredient({ ...newIngredient, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="カテゴリを選択" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="quantity">数量</Label>
              <Input
                id="quantity"
                type="number"
                value={newIngredient.quantity}
                onChange={(e) =>
                  setNewIngredient({
                    ...newIngredient,
                    quantity: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="unit">単位 *</Label>
              <Select
                value={newIngredient.unit}
                onValueChange={(value) =>
                  setNewIngredient({ ...newIngredient, unit: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="単位" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="expiry">消費期限</Label>
            <Input
              id="expiry"
              type="date"
              value={newIngredient.expiry_date || ''}
              onChange={(e) =>
                setNewIngredient({
                  ...newIngredient,
                  expiry_date: e.target.value || null,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="location">保存場所</Label>
            <Select
              value={newIngredient.location || ''}
              onValueChange={(value) =>
                setNewIngredient({ ...newIngredient, location: value || null })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="保存場所を選択" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCloseDialog}>
            キャンセル
          </Button>
          <Button
            onClick={handleSaveIngredient}
            className={buttonVariants({ theme: 'ingredients' })}
          >
            {editingIngredient ? '更新' : '追加'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function IngredientsManagement({
  ingredients,
  setIngredients,
}: IngredientsManagementProps) {
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(
    null
  );
  const { user, loading } = useAuth();

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return 'fresh';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'expired';
    if (diffDays <= 3) return 'expiring';
    return 'fresh';
  };

  const expiringIngredients = ingredients.filter(
    (ingredient) => getExpiryStatus(ingredient.expiry_date) === 'expiring'
  );

  const expiredIngredients = ingredients.filter(
    (ingredient) => getExpiryStatus(ingredient.expiry_date) === 'expired'
  );

  const handleSaveIngredient = async (
    ingredientData: Omit<Ingredient, 'id' | 'user_id' | 'created_at'>
  ) => {
    if (!ingredientData.name.trim()) return;

    if (user) {
      // ログイン時：Supabaseに保存
      if (editingIngredient) {
        // 更新
        const { data, error } = await supabase
          .from('ingredients')
          .update({ ...ingredientData })
          .eq('id', editingIngredient.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating ingredient:', error);
        } else if (data) {
          // 更新後、数量が0以下なら削除、そうでなければ更新
          if (data.quantity <= 0) {
            await handleDeleteIngredient(data.id);
          } else {
            setIngredients(ingredients.map((i) => (i.id === data.id ? data : i)));
          }
        }
      } else {
        // 新規作成時、同じ名前と単位の材料が既存かチェック
        const existingIngredient = ingredients.find(
          (i) => i.name === ingredientData.name && i.unit === ingredientData.unit
        );

        if (existingIngredient) {
          // 既存なら数量を更新
          const newQuantity = existingIngredient.quantity + ingredientData.quantity;
          if (newQuantity <= 0) {
            await handleDeleteIngredient(existingIngredient.id);
          } else {
            const { data: updatedData, error: updateError } = await supabase
              .from('ingredients')
              .update({
                quantity: newQuantity,
                category: ingredientData.category,
                expiry_date: ingredientData.expiry_date,
                location: ingredientData.location,
              })
              .eq('id', existingIngredient.id)
              .select()
              .single();

            if (updateError) {
              console.error('Error updating existing ingredient quantity (Supabase):', updateError);
            } else if (updatedData) {
              setIngredients(ingredients.map((i) => (i.id === updatedData.id ? updatedData : i)));
            }
          }
        } else {
          // 新規作成
          const { data, error } = await supabase
            .from('ingredients')
            .insert([{ ...ingredientData, user_id: user.id }])
            .select() // select()を追加して、挿入されたデータを取得
            .single();

          if (error) {
            console.error('Error creating ingredient:', error);
          } else if (data && data.quantity > 0) {
            setIngredients([...ingredients, data]);
          }
          // quantityが0以下の場合は追加しない
        }
      }
    } else {
      // 未ログイン時：ローカルストレージに保存
      if (editingIngredient) {
        // 更新
        const updatedIngredients = ingredients.map((i) =>
          i.id === editingIngredient.id
            ? {
                ...i,
                ...ingredientData,
                id: i.id,
                user_id: i.user_id,
                created_at: i.created_at,
              }
            : i
        ).filter((i) => i.quantity > 0); // 数量が0以下の場合は除外
        setIngredients(updatedIngredients);
      } else {
        // 新規作成時、同じ名前と単位の材料が既存かチェック
        const existingIngredient = ingredients.find(
          (i) => i.name === ingredientData.name && i.unit === ingredientData.unit
        );

        if (existingIngredient) {
          // 既存なら数量を更新
          const newQuantity = existingIngredient.quantity + ingredientData.quantity;
          if (newQuantity <= 0) {
            setIngredients(ingredients.filter((i) => i.id !== existingIngredient.id));
          } else {
            const updatedIngredients = ingredients.map((i) =>
              i.id === existingIngredient.id
                ? {
                    ...i,
                    quantity: newQuantity,
                    category: ingredientData.category,
                    expiry_date: ingredientData.expiry_date,
                    location: ingredientData.location,
                  }
                : i
            );
            setIngredients(updatedIngredients);
          }
        } else {
          // 新規作成
          const newIngredientWithId: Ingredient = {
            ...ingredientData,
            id: crypto.randomUUID(),
            user_id: 'local', // 仮のID
            created_at: new Date().toISOString(),
          };
          if (newIngredientWithId.quantity > 0) {
            setIngredients([...ingredients, newIngredientWithId]);
          }
          // quantityが0以下の場合は追加しない
        }
      }
    }
    setEditingIngredient(null);
  };

  const handleDeleteIngredient = async (id: string) => {
    if (confirm('この材料を削除しますか？')) {
      if (user) {
        // ログイン時：Supabaseから削除
        const { error } = await supabase
          .from('ingredients')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting ingredient:', error);
        } else {
          setIngredients(ingredients.filter((i) => i.id !== id));
        }
      } else {
        // 未ログイン時：ローカルストレージから削除
        setIngredients(ingredients.filter((i) => i.id !== id));
      }
    }
  };

  const handleEditIngredient = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
  };

  const handleEditComplete = () => {
    setEditingIngredient(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-green-600"></div>
          <p className="mt-2 text-gray-600">材料データを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Package className={iconColorVariants({ theme: 'ingredients' })} />
          <span>保有食材 {ingredients.length}品</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <span>期限間近 {expiringIngredients.length}品</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4 text-red-600" />
          <span>期限切れ {expiredIngredients.length}品</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">材料一覧</h2>
        {ingredients.length > 0 && (
          <AddIngredientButton
            onSave={handleSaveIngredient}
            editingIngredient={editingIngredient}
            onEditComplete={handleEditComplete}
          >
            <Button className={buttonVariants({ theme: 'ingredients' })}>
              <Plus className="mr-2 h-4 w-4" />
              材料を追加
            </Button>
          </AddIngredientButton>
        )}
      </div>

      <div className="grid gap-4">
        {ingredients.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="mx-auto mb-4 h-16 w-16 text-green-300" />
              <h3 className="mb-2 text-lg font-semibold">材料がありません</h3>
              <p className="mb-4 text-gray-600">
                最初の材料を追加して管理を始めましょう
              </p>
              <AddIngredientButton
                onSave={handleSaveIngredient}
                editingIngredient={editingIngredient}
                onEditComplete={handleEditComplete}
              >
                <Button className={buttonVariants({ theme: 'ingredients' })}>
                  <Plus className="mr-2 h-4 w-4" />
                  材料を追加
                </Button>
              </AddIngredientButton>
            </CardContent>
          </Card>
        ) : (
          ingredients.map((ingredient) => {
            const expiryStatus = getExpiryStatus(ingredient.expiry_date);
            return (
              <Card key={ingredient.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <h3 className="font-semibold">{ingredient.name}</h3>
                        <Badge variant="secondary">{ingredient.category}</Badge>
                        {expiryStatus === 'expired' && (
                          <Badge variant="destructive">期限切れ</Badge>
                        )}
                        {expiryStatus === 'expiring' && (
                          <Badge variant="outline" className="text-orange-600">
                            期限間近
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>
                          数量: {ingredient.quantity}
                          {ingredient.unit}
                        </div>
                        {ingredient.expiry_date && (
                          <div>消費期限: {ingredient.expiry_date}</div>
                        )}
                        {ingredient.location && (
                          <div>保存場所: {ingredient.location}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditIngredient(ingredient)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteIngredient(ingredient.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
