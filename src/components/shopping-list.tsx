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
  ShoppingCart,
  Circle,
  CheckCircle,
  Trash2,
  Edit,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import {
  buttonVariants,
  iconColorVariants,
  cardVariants,
  textColorVariants,
} from '@/lib/theme-variants';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  detectAllergens, 
  hasUserAllergens,
  ALLERGEN_SEVERITY_COLORS
} from '@/lib/allergens';
import { useUserAllergies } from '@/hooks/useUserAllergies';

interface ShoppingListProps {
  shoppingItems: ShoppingItem[];
  setShoppingItems: React.Dispatch<React.SetStateAction<ShoppingItem[]>>;
  onAddItemsToIngredients: (items: ShoppingItem[]) => void;
}

export interface ShoppingItem {
  id: string;
  user_id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  is_purchased: boolean;
  notes: string | null;
  allergens: string[] | null;
  added_date: string;
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

interface AddShoppingItemButtonProps {
  onSave: (item: Omit<ShoppingItem, 'id' | 'user_id' | 'added_date'>) => void;
  editingItem?: ShoppingItem | null;
  onEditComplete?: () => void;
  children: React.ReactNode;
}

function AddShoppingItemButton({
  onSave,
  editingItem,
  onEditComplete,
  children,
}: AddShoppingItemButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState<
    Omit<ShoppingItem, 'id' | 'user_id' | 'added_date'>
  >({
    name: '',
    category: '',
    quantity: 1,
    unit: '',
    is_purchased: false,
    notes: null,
  });

  useEffect(() => {
    if (editingItem) {
      setNewItem({
        name: editingItem.name,
        category: editingItem.category,
        quantity: editingItem.quantity,
        unit: editingItem.unit,
        is_purchased: editingItem.is_purchased,
        notes: editingItem.notes || null,
      });
      setIsDialogOpen(true);
    }
  }, [editingItem]);

  const handleSaveItem = () => {
    if (!newItem.name || !newItem.category || !newItem.unit) {
      alert('必須項目を入力してください');
      return;
    }

    onSave(newItem);
    handleCloseDialog();
    if (editingItem && onEditComplete) {
      onEditComplete();
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setNewItem({
      name: '',
      category: '',
      quantity: 1,
      unit: '',
      is_purchased: false,
      notes: null,
    });
    if (editingItem && onEditComplete) {
      onEditComplete();
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? 'アイテムを編集' : '新しいアイテムを追加'}
          </DialogTitle>
          <DialogDescription>
            買い物リストに追加するアイテムの詳細を入力してください。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="name">商品名 *</Label>
            <Input
              id="name"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              placeholder="例: 牛乳"
            />
          </div>
          <div>
            <Label htmlFor="category">カテゴリ *</Label>
            <Select
              value={newItem.category}
              onValueChange={(value) =>
                setNewItem({ ...newItem, category: value })
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
                value={newItem.quantity}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    quantity: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="unit">単位 *</Label>
              <Select
                value={newItem.unit}
                onValueChange={(value) =>
                  setNewItem({ ...newItem, unit: value })
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
            <Label htmlFor="notes">メモ</Label>
            <Input
              id="notes"
              value={newItem.notes || ''}
              onChange={(e) =>
                setNewItem({ ...newItem, notes: e.target.value || null })
              }
              placeholder="例: 低脂肪"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCloseDialog}>
            キャンセル
          </Button>
          <Button
            onClick={handleSaveItem}
            className={buttonVariants({ theme: 'shopping' })}
          >
            {editingItem ? '更新' : '追加'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ShoppingList({
  shoppingItems,
  setShoppingItems,
  onAddItemsToIngredients,
}: ShoppingListProps) {
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);

  const { user, loading } = useAuth();
  const { allergies: userAllergies } = useUserAllergies();

  const unpurchasedItems = shoppingItems.filter((item) => !item.is_purchased);
  const purchasedItems = shoppingItems.filter((item) => item.is_purchased);

  // Check for allergen conflicts
  const getItemAllergenWarning = (item: ShoppingItem) => {
    const allergens = item.allergens || detectAllergens(item.name);
    if (!allergens || allergens.length === 0) return null;
    
    const conflict = hasUserAllergens(allergens, userAllergies);
    return conflict.hasAllergens ? conflict : null;
  };

  const allergenWarningItems = shoppingItems.filter(
    item => getItemAllergenWarning(item)
  );

  const handleSaveItem = async (
    itemData: Omit<ShoppingItem, 'id' | 'user_id' | 'added_date'>
  ) => {
    if (user) {
      if (editingItem) {
        const { data, error } = await supabase
          .from('shopping_items')
          .update({ ...itemData })
          .eq('id', editingItem.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating shopping item:', error);
        } else if (data) {
          setShoppingItems(
            shoppingItems.map((item) => (item.id === data.id ? data : item))
          );
        }
      } else {
        const { data, error } = await supabase
          .from('shopping_items')
          .insert([{ ...itemData, user_id: user.id }])
          .select()
          .single();

        if (error) {
          console.error('Error creating shopping item:', error);
        } else if (data) {
          setShoppingItems([...shoppingItems, data]);
        }
      }
    } else {
      if (editingItem) {
        const updatedItems = shoppingItems.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                ...itemData,
                id: item.id,
                user_id: item.user_id,
                added_date: item.added_date,
              }
            : item
        );
        setShoppingItems(updatedItems);
      } else {
        const newItem: ShoppingItem = {
          ...itemData,
          id: crypto.randomUUID(),
          user_id: 'local',
          added_date: new Date().toISOString(),
        };
        setShoppingItems([...shoppingItems, newItem]);
      }
    }
    setEditingItem(null);
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('このアイテムを削除しますか？')) {
      if (user) {
        const { error } = await supabase
          .from('shopping_items')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting shopping item:', error);
        } else {
          setShoppingItems(shoppingItems.filter((item) => item.id !== id));
        }
      } else {
        setShoppingItems(shoppingItems.filter((item) => item.id !== id));
      }
    }
  };

  const handleEditItem = (item: ShoppingItem) => {
    setEditingItem(item);
  };

  const handleEditComplete = () => {
    setEditingItem(null);
  };

  const togglePurchaseStatus = async (id: string) => {
    const itemToUpdate = shoppingItems.find((item) => item.id === id);
    if (!itemToUpdate) return;

    const newPurchaseStatus = !itemToUpdate.is_purchased;

    if (user) {
      const { data, error } = await supabase
        .from('shopping_items')
        .update({ is_purchased: newPurchaseStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating purchase status:', error);
      } else if (data) {
        setShoppingItems(
          shoppingItems.map((item) => (item.id === id ? data : item))
        );
      }
    } else {
      setShoppingItems(
        shoppingItems.map((item) =>
          item.id === id ? { ...item, is_purchased: newPurchaseStatus } : item
        )
      );
    }
  };

  const addPurchasedItemsToIngredients = () => {
    if (confirm('購入済みのアイテムを材料管理に追加しますか？')) {
      onAddItemsToIngredients(purchasedItems);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600"></div>
          <p className="mt-2 text-gray-600">買い物リストを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Circle className={iconColorVariants({ theme: 'shopping' })} />
          <span>未購入 {unpurchasedItems.length}品</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="h-4 w-4 text-gray-600" />
          <span>購入済み {purchasedItems.length}品</span>
        </div>
        <div className="flex items-center gap-1">
          <ShoppingCart className={iconColorVariants({ theme: 'shopping' })} />
          <span>合計 {shoppingItems.length}品</span>
        </div>
        {userAllergies.length > 0 && (
          <div className="flex items-center gap-1">
            <Shield className="h-4 w-4 text-red-600" />
            <span>アレルギー警告 {allergenWarningItems.length}品</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">買い物リスト</h2>
        {shoppingItems.length > 0 && (
          <div className="flex gap-2">
            {purchasedItems.length > 0 && (
              <Button
                variant="outline"
                onClick={addPurchasedItemsToIngredients}
                className={buttonVariants({
                  theme: 'shopping',
                  variant: 'outline',
                  size: 'sm',
                })}
              >
                材料管理に追加
              </Button>
            )}
            <AddShoppingItemButton
              onSave={handleSaveItem}
              editingItem={editingItem}
              onEditComplete={handleEditComplete}
            >
              <Button className={buttonVariants({ theme: 'shopping' })}>
                <Plus className="mr-2 h-4 w-4" />
                アイテムを追加
              </Button>
            </AddShoppingItemButton>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {shoppingItems.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ShoppingCart className="mx-auto mb-4 h-16 w-16 text-purple-300" />
              <h3 className="mb-2 text-lg font-semibold">
                買い物リストが空です
              </h3>
              <p className="mb-4 text-gray-600">
                最初のアイテムを追加して買い物を始めましょう
              </p>
              <AddShoppingItemButton
                onSave={handleSaveItem}
                editingItem={editingItem}
                onEditComplete={handleEditComplete}
              >
                <Button className={buttonVariants({ theme: 'shopping' })}>
                  <Plus className="mr-2 h-4 w-4" />
                  アイテムを追加
                </Button>
              </AddShoppingItemButton>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 未購入アイテム */}
            {unpurchasedItems.length > 0 && (
              <div className="space-y-2">
                <h3
                  className={`text-lg font-semibold ${textColorVariants({ theme: 'shopping' })}`}
                >
                  未購入 ({unpurchasedItems.length}品)
                </h3>
                {unpurchasedItems.map((item) => {
                  const allergenWarning = getItemAllergenWarning(item);
                  return (
                    <Card
                      key={item.id}
                      className={cardVariants({ theme: 'shopping' })}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => togglePurchaseStatus(item.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Circle className="h-4 w-4" />
                          </Button>
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <h4 className="font-semibold">{item.name}</h4>
                              <Badge variant="secondary">{item.category}</Badge>
                              {allergenWarning && (
                                <Badge 
                                  variant="destructive" 
                                  className={`${ALLERGEN_SEVERITY_COLORS[allergenWarning.maxSeverity!]} flex items-center gap-1`}
                                >
                                  <Shield className="h-3 w-3" />
                                  アレルギー警告
                                </Badge>
                              )}
                            </div>

                            {/* Allergen warning details */}
                            {allergenWarning && (
                              <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                                <div className="flex items-center gap-1 font-medium text-red-800">
                                  <AlertTriangle className="h-3 w-3" />
                                  アレルゲンが含まれています
                                </div>
                                <div className="text-red-700 mt-1">
                                  {allergenWarning.conflictingAllergens.join('、')}
                                </div>
                              </div>
                            )}

                            <div className="text-sm text-gray-600">
                              数量: {item.quantity}
                              {item.unit}
                              {item.notes && ` | ${item.notes}`}
                              {(item.allergens || detectAllergens(item.name)).length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap mt-1">
                                  <span>含有アレルゲン:</span>
                                  {(item.allergens || detectAllergens(item.name)).map(allergen => (
                                    <Badge 
                                      key={allergen} 
                                      variant="outline" 
                                      className={`text-xs ${
                                        userAllergies.some(ua => ua.allergen === allergen) 
                                          ? 'border-red-300 text-red-700 bg-red-50'
                                          : 'border-gray-300'
                                      }`}
                                    >
                                      {allergen}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditItem(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* 購入済みアイテム */}
            {purchasedItems.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-600">
                  購入済み ({purchasedItems.length}品)
                </h3>
                {purchasedItems.map((item) => (
                  <Card
                    key={item.id}
                    className="border-gray-200 bg-gray-50 opacity-75"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => togglePurchaseStatus(item.id)}
                          className="h-8 w-8 bg-gray-100 p-0"
                        >
                          <CheckCircle className="h-4 w-4 text-gray-600" />
                        </Button>
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <h4 className="font-semibold text-gray-500 line-through">
                              {item.name}
                            </h4>
                            <Badge variant="secondary">{item.category}</Badge>
                          </div>
                          <div className="text-sm text-gray-500 line-through">
                            数量: {item.quantity}
                            {item.unit}
                            {item.notes && ` | ${item.notes}`}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <AddShoppingItemButton
        onSave={handleSaveItem}
        editingItem={editingItem}
        onEditComplete={handleEditComplete}
      >
        <div style={{ display: 'none' }} />
      </AddShoppingItemButton>
    </div>
  );
}
