"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Package,
  Calendar,
  AlertTriangle,
  Trash2,
  Edit,
} from "lucide-react";
import { buttonVariants, iconColorVariants } from "@/lib/theme-variants";

interface Ingredient {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  location: string;
}

const categories = [
  "野菜",
  "肉類",
  "魚介類",
  "乳製品",
  "調味料",
  "冷凍食品",
  "その他",
];

const units = ["個", "g", "kg", "ml", "L", "本", "枚", "袋", "パック"];

const locations = ["冷蔵庫", "冷凍庫", "常温", "野菜室"];

interface AddIngredientButtonProps {
  onSave: (ingredient: Omit<Ingredient, "id">) => void;
  editingIngredient?: Ingredient | null;
  onEditComplete?: () => void;
  children: React.ReactNode;
}

function AddIngredientButton({ 
  onSave, 
  editingIngredient, 
  onEditComplete, 
  children 
}: AddIngredientButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newIngredient, setNewIngredient] = useState<Omit<Ingredient, "id">>({
    name: "",
    category: "",
    quantity: 1,
    unit: "",
    expiryDate: "",
    location: "",
  });

  // 編集モードの時に初期値をセット
  useEffect(() => {
    if (editingIngredient) {
      setNewIngredient({
        name: editingIngredient.name,
        category: editingIngredient.category,
        quantity: editingIngredient.quantity,
        unit: editingIngredient.unit,
        expiryDate: editingIngredient.expiryDate,
        location: editingIngredient.location,
      });
      setIsDialogOpen(true);
    }
  }, [editingIngredient]);

  const handleSaveIngredient = () => {
    if (!newIngredient.name || !newIngredient.category || !newIngredient.unit) {
      alert("必須項目を入力してください");
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
      name: "",
      category: "",
      quantity: 1,
      unit: "",
      expiryDate: "",
      location: "",
    });
    if (editingIngredient && onEditComplete) {
      onEditComplete();
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingIngredient ? "材料を編集" : "新しい材料を追加"}
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
              value={newIngredient.expiryDate}
              onChange={(e) =>
                setNewIngredient({
                  ...newIngredient,
                  expiryDate: e.target.value,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="location">保存場所</Label>
            <Select
              value={newIngredient.location}
              onValueChange={(value) =>
                setNewIngredient({ ...newIngredient, location: value })
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
          <Button onClick={handleSaveIngredient} className={buttonVariants({ theme: "ingredients" })}>
            {editingIngredient ? "更新" : "追加"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function IngredientsManagement() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);

  // ローカルストレージから材料データを読み込み
  useEffect(() => {
    const savedIngredients = localStorage.getItem("ingredients");
    if (savedIngredients) {
      setIngredients(JSON.parse(savedIngredients));
    }
  }, []);

  // 材料データをローカルストレージに保存
  useEffect(() => {
    localStorage.setItem("ingredients", JSON.stringify(ingredients));
  }, [ingredients]);

  // 期限切れと期限間近の材料を計算
  const getExpiryStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "expired";
    if (diffDays <= 3) return "expiring";
    return "fresh";
  };

  const expiringIngredients = ingredients.filter(
    (ingredient) => getExpiryStatus(ingredient.expiryDate) === "expiring"
  );

  const expiredIngredients = ingredients.filter(
    (ingredient) => getExpiryStatus(ingredient.expiryDate) === "expired"
  );

  // 材料を追加/編集
  const handleSaveIngredient = (ingredientData: Omit<Ingredient, "id">) => {
    if (editingIngredient) {
      // 編集モード
      setIngredients(
        ingredients.map((ingredient) =>
          ingredient.id === editingIngredient.id
            ? { ...ingredientData, id: editingIngredient.id }
            : ingredient
        )
      );
    } else {
      // 新規追加モード
      const ingredient: Ingredient = {
        ...ingredientData,
        id: Date.now().toString(),
      };
      setIngredients([...ingredients, ingredient]);
    }
  };

  // 材料を削除
  const handleDeleteIngredient = (id: string) => {
    setIngredients(ingredients.filter((ingredient) => ingredient.id !== id));
  };

  // 材料を編集
  const handleEditIngredient = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
  };

  // 編集完了
  const handleEditComplete = () => {
    setEditingIngredient(null);
  };

  return (
    <div className="space-y-6">
      {/* 統計 */}
      <div className="flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Package className={iconColorVariants({ theme: "ingredients" })} />
          <span>保有食材 {ingredients.length}品</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertTriangle className="w-4 h-4 text-orange-600" />
          <span>期限間近 {expiringIngredients.length}品</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4 text-red-600" />
          <span>期限切れ {expiredIngredients.length}品</span>
        </div>
      </div>

      {/* 材料追加ボタン */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">材料一覧</h2>
        {ingredients.length > 0 && (
          <AddIngredientButton 
            onSave={handleSaveIngredient}
            editingIngredient={editingIngredient}
            onEditComplete={handleEditComplete}
          >
            <Button className={buttonVariants({ theme: "ingredients" })}>
              <Plus className="w-4 h-4 mr-2" />
              材料を追加
            </Button>
          </AddIngredientButton>
        )}
      </div>

      {/* 材料リスト */}
      <div className="grid gap-4">
        {ingredients.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-green-300" />
              <h3 className="text-lg font-semibold mb-2">材料がありません</h3>
              <p className="text-gray-600 mb-4">
                最初の材料を追加して管理を始めましょう
              </p>
              <AddIngredientButton 
                onSave={handleSaveIngredient}
                editingIngredient={editingIngredient}
                onEditComplete={handleEditComplete}
              >
                <Button className={buttonVariants({ theme: "ingredients" })}>
                  <Plus className="w-4 h-4 mr-2" />
                  材料を追加
                </Button>
              </AddIngredientButton>
            </CardContent>
          </Card>
        ) : (
          ingredients.map((ingredient) => {
            const expiryStatus = getExpiryStatus(ingredient.expiryDate);
            return (
              <Card key={ingredient.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{ingredient.name}</h3>
                        <Badge variant="secondary">{ingredient.category}</Badge>
                        {expiryStatus === "expired" && (
                          <Badge variant="destructive">期限切れ</Badge>
                        )}
                        {expiryStatus === "expiring" && (
                          <Badge variant="outline" className="text-orange-600">
                            期限間近
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          数量: {ingredient.quantity}
                          {ingredient.unit}
                        </div>
                        {ingredient.expiryDate && (
                          <div>
                            消費期限: {ingredient.expiryDate}
                          </div>
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
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteIngredient(ingredient.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* 編集用のAddIngredientButton（非表示） */}
      <AddIngredientButton 
        onSave={handleSaveIngredient}
        editingIngredient={editingIngredient}
        onEditComplete={handleEditComplete}
      >
        <div style={{ display: 'none' }} />
      </AddIngredientButton>
    </div>
  );
} 