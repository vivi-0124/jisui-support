'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  ChefHat,
  Minus,
  Check,
  Clock,
  Users,
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
import { Ingredient } from '@/components/ingredients-management';

interface CookingManagementProps {
  ingredients: Ingredient[];
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
}

interface CookingSession {
  id: string;
  dishName: string;
  servings: number;
  usedIngredients: UsedIngredient[];
  cookingTime: number;
  notes: string;
  createdAt: string;
}

interface UsedIngredient {
  ingredientId: string;
  ingredientName: string;
  quantityUsed: number;
  unit: string;
  originalQuantity: number;
}

interface StartCookingButtonProps {
  onSave: (session: Omit<CookingSession, 'id' | 'createdAt'>) => void;
  children: React.ReactNode;
}

function StartCookingButton({ onSave, children }: StartCookingButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dishName, setDishName] = useState('');
  const [servings, setServings] = useState(1);
  const [cookingTime, setCookingTime] = useState(30);
  const [notes, setNotes] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [ingredientQuantities, setIngredientQuantities] = useState<
    Record<string, number>
  >({});

  const { user } = useAuth();

  const handleIngredientToggle = (ingredientId: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(ingredientId)
        ? prev.filter((id) => id !== ingredientId)
        : [...prev, ingredientId]
    );
  };

  const handleQuantityChange = (ingredientId: string, quantity: number) => {
    setIngredientQuantities((prev) => ({
      ...prev,
      [ingredientId]: Math.max(0, quantity),
    }));
  };

  const handleStartCooking = () => {
    if (!dishName.trim()) {
      alert('料理名を入力してください');
      return;
    }

    if (selectedIngredients.length === 0) {
      alert('使用する材料を選択してください');
      return;
    }

    const usedIngredients: UsedIngredient[] = selectedIngredients.map((id) => {
      const ingredient = ingredients.find((ing) => ing.id === id)!;
      const quantityUsed = ingredientQuantities[id] || 1;
      return {
        ingredientId: id,
        ingredientName: ingredient.name,
        quantityUsed,
        unit: ingredient.unit,
        originalQuantity: ingredient.quantity,
      };
    });

    const session: Omit<CookingSession, 'id' | 'createdAt'> = {
      dishName,
      servings,
      usedIngredients,
      cookingTime,
      notes,
    };

    onSave(session);
    handleCloseDialog();
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setDishName('');
    setServings(1);
    setCookingTime(30);
    setNotes('');
    setSelectedIngredients([]);
    setIngredientQuantities({});
  };

  const availableIngredients = ingredients.filter((ing) => ing.quantity > 0);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-orange-600" />
            料理を開始
          </DialogTitle>
          <DialogDescription>
            作る料理の詳細と使用する材料を選択してください。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* 料理の基本情報 */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="dishName">料理名 *</Label>
              <Input
                id="dishName"
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                placeholder="例: カレーライス"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="servings">人数</Label>
                <Input
                  id="servings"
                  type="number"
                  min="1"
                  value={servings}
                  onChange={(e) => setServings(parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label htmlFor="cookingTime">調理時間（分）</Label>
                <Input
                  id="cookingTime"
                  type="number"
                  min="1"
                  value={cookingTime}
                  onChange={(e) =>
                    setCookingTime(parseInt(e.target.value) || 30)
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">メモ</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="調理のメモや特記事項"
                rows={2}
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[60px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          {/* 材料選択 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">使用する材料</Label>
              <Badge variant="secondary">
                {selectedIngredients.length}個選択中
              </Badge>
            </div>

            {availableIngredients.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
                <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                <p className="text-gray-500">使用可能な材料がありません</p>
                <p className="text-sm text-gray-400">
                  材料管理で材料を追加してください
                </p>
              </div>
            ) : (
              <div className="max-h-60 space-y-2 overflow-y-auto rounded-lg border p-4">
                {availableIngredients.map((ingredient) => {
                  const isSelected = selectedIngredients.includes(
                    ingredient.id
                  );
                  const quantityUsed = ingredientQuantities[ingredient.id] || 1;
                  const maxQuantity = ingredient.quantity;

                  return (
                    <div
                      key={ingredient.id}
                      className={`rounded-lg border p-3 transition-all ${
                        isSelected
                          ? 'border-orange-300 bg-orange-50'
                          : 'border-gray-200 bg-white hover:border-orange-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() =>
                            handleIngredientToggle(ingredient.id)
                          }
                          className="data-[state=checked]:border-orange-500 data-[state=checked]:bg-orange-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {ingredient.name}
                            </span>
                            <Badge variant="outline">
                              {ingredient.category}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            在庫: {ingredient.quantity}
                            {ingredient.unit}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleQuantityChange(
                                  ingredient.id,
                                  quantityUsed - 1
                                )
                              }
                              disabled={quantityUsed <= 1}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-12 text-center text-sm">
                              {quantityUsed}
                              {ingredient.unit}
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleQuantityChange(
                                  ingredient.id,
                                  quantityUsed + 1
                                )
                              }
                              disabled={quantityUsed >= maxQuantity}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCloseDialog}>
            キャンセル
          </Button>
          <Button
            onClick={handleStartCooking}
            disabled={availableIngredients.length === 0}
            className={buttonVariants({ theme: 'search' })}
          >
            <ChefHat className="mr-2 h-4 w-4" />
            料理開始
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CookingManagement({
  ingredients,
  setIngredients,
}: CookingManagementProps) {
  const [cookingSessions, setCookingSessions] = useState<CookingSession[]>([]);
  const { user, loading } = useAuth();

  const availableIngredients = ingredients.filter((ing) => ing.quantity > 0);
  const lowStockIngredients = ingredients.filter(
    (ing) => ing.quantity > 0 && ing.quantity <= 2
  );

  const handleStartCooking = async (
    sessionData: Omit<CookingSession, 'id' | 'createdAt'>
  ) => {
    // 材料の消費処理
    const updatedIngredients = [...ingredients];

    for (const usedIngredient of sessionData.usedIngredients) {
      const ingredientIndex = updatedIngredients.findIndex(
        (ing) => ing.id === usedIngredient.ingredientId
      );

      if (ingredientIndex !== -1) {
        const currentQuantity = updatedIngredients[ingredientIndex].quantity;
        const newQuantity = Math.max(
          0,
          currentQuantity - usedIngredient.quantityUsed
        );
        updatedIngredients[ingredientIndex] = {
          ...updatedIngredients[ingredientIndex],
          quantity: newQuantity,
        };

        // Supabaseまたはローカルストレージで材料の数量を更新
        if (user) {
          await supabase
            .from('ingredients')
            .update({ quantity: newQuantity })
            .eq('id', usedIngredient.ingredientId);
        }
      }
    }

    setIngredients(updatedIngredients);

    // 料理セッションを記録
    const newSession: CookingSession = {
      ...sessionData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    setCookingSessions((prev) => [newSession, ...prev]);

    // 成功メッセージ
    alert(
      `${sessionData.dishName}の調理を開始しました！材料が消費されました。`
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-orange-600"></div>
          <p className="mt-2 text-gray-600">料理データを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <ChefHat className={iconColorVariants({ theme: 'search' })} />
          <span>利用可能材料 {availableIngredients.length}品</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span>在庫少 {lowStockIngredients.length}品</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4 text-orange-600" />
          <span>調理履歴 {cookingSessions.length}回</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">料理する</h2>
        <StartCookingButton onSave={handleStartCooking}>
          <Button className={buttonVariants({ theme: 'search' })}>
            <ChefHat className="mr-2 h-4 w-4" />
            料理を開始
          </Button>
        </StartCookingButton>
      </div>

      {/* 利用可能な材料一覧 */}
      <div className="space-y-4">
        <h3
          className={`text-lg font-semibold ${textColorVariants({ theme: 'search' })}`}
        >
          利用可能な材料
        </h3>

        {availableIngredients.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ChefHat className="mx-auto mb-4 h-16 w-16 text-orange-300" />
              <h3 className="mb-2 text-lg font-semibold">
                利用可能な材料がありません
              </h3>
              <p className="mb-4 text-gray-600">
                材料管理で材料を追加してから料理を始めましょう
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableIngredients.map((ingredient) => {
              const isLowStock = ingredient.quantity <= 2;
              return (
                <Card
                  key={ingredient.id}
                  className={cardVariants({ theme: 'search' })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <h4 className="font-semibold">{ingredient.name}</h4>
                          <Badge variant="secondary">
                            {ingredient.category}
                          </Badge>
                          {isLowStock && (
                            <Badge variant="outline" className="text-yellow-600">
                              在庫少
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          在庫: {ingredient.quantity}
                          {ingredient.unit}
                        </div>
                        {ingredient.expiry_date && (
                          <div className="text-sm text-gray-500">
                            期限: {ingredient.expiry_date}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 調理履歴 */}
      {cookingSessions.length > 0 && (
        <div className="space-y-4">
          <h3
            className={`text-lg font-semibold ${textColorVariants({ theme: 'search' })}`}
          >
            最近の調理履歴
          </h3>
          <div className="space-y-3">
            {cookingSessions.slice(0, 5).map((session) => (
              <Card key={session.id} className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <h4 className="font-semibold">{session.dishName}</h4>
                        <Badge variant="secondary">
                          <Users className="mr-1 h-3 w-3" />
                          {session.servings}人分
                        </Badge>
                        <Badge variant="outline">
                          <Clock className="mr-1 h-3 w-3" />
                          {session.cookingTime}分
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        使用材料:{' '}
                        {session.usedIngredients
                          .map(
                            (ing) =>
                              `${ing.ingredientName} ${ing.quantityUsed}${ing.unit}`
                          )
                          .join(', ')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(session.createdAt).toLocaleString('ja-JP')}
                      </div>
                    </div>
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}