"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  BookOpen,
  Clock,
  Users,
  Trash2,
  Edit,
  Heart,
} from "lucide-react";
import { buttonVariants, iconColorVariants, textColorVariants } from "@/lib/theme-variants";

interface Recipe {
  id: string;
  name: string;
  category: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: number;
  servings: number;
  difficulty: "簡単" | "普通" | "難しい";
  isFavorite: boolean;
  createdDate: string;
}

const categories = [
  "和食",
  "洋食",
  "中華",
  "イタリアン",
  "スープ",
  "サラダ",
  "デザート",
  "おつまみ",
  "その他",
];

const difficultyOptions = ["簡単", "普通", "難しい"] as const;

interface AddRecipeButtonProps {
  onSave: (recipe: Omit<Recipe, "id" | "createdDate">) => void;
  editingRecipe?: Recipe | null;
  onEditComplete?: () => void;
  children: React.ReactNode;
}

function AddRecipeButton({ 
  onSave, 
  editingRecipe, 
  onEditComplete, 
  children 
}: AddRecipeButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRecipe, setNewRecipe] = useState<Omit<Recipe, "id" | "createdDate">>({
    name: "",
    category: "",
    ingredients: [""],
    instructions: [""],
    cookingTime: 30,
    servings: 2,
    difficulty: "普通",
    isFavorite: false,
  });

  // 編集モードの時に初期値をセット
  useEffect(() => {
    if (editingRecipe) {
      setNewRecipe({
        name: editingRecipe.name,
        category: editingRecipe.category,
        ingredients: editingRecipe.ingredients,
        instructions: editingRecipe.instructions,
        cookingTime: editingRecipe.cookingTime,
        servings: editingRecipe.servings,
        difficulty: editingRecipe.difficulty,
        isFavorite: editingRecipe.isFavorite,
      });
      setIsDialogOpen(true);
    }
  }, [editingRecipe]);

  const handleSaveRecipe = () => {
    if (!newRecipe.name || !newRecipe.category) {
      alert("必須項目を入力してください");
      return;
    }

    // 空の材料と手順を除外
    const filteredIngredients = newRecipe.ingredients.filter(
      (ingredient) => ingredient.trim() !== ""
    );
    const filteredInstructions = newRecipe.instructions.filter(
      (instruction) => instruction.trim() !== ""
    );

    if (filteredIngredients.length === 0) {
      alert("材料を最低1つ入力してください");
      return;
    }

    const recipeData = {
      ...newRecipe,
      ingredients: filteredIngredients,
      instructions: filteredInstructions,
    };

    onSave(recipeData);
    handleCloseDialog();
    if (editingRecipe && onEditComplete) {
      onEditComplete();
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
    if (editingRecipe && onEditComplete) {
      onEditComplete();
    }
  };

  const resetForm = () => {
    setNewRecipe({
      name: "",
      category: "",
      ingredients: [""],
      instructions: [""],
      cookingTime: 30,
      servings: 2,
      difficulty: "普通",
      isFavorite: false,
    });
  };

  const addIngredient = () => {
    setNewRecipe({
      ...newRecipe,
      ingredients: [...newRecipe.ingredients, ""],
    });
  };

  const removeIngredient = (index: number) => {
    if (newRecipe.ingredients.length > 1) {
      const newIngredients = newRecipe.ingredients.filter((_, i) => i !== index);
      setNewRecipe({ ...newRecipe, ingredients: newIngredients });
    }
  };

  const addInstruction = () => {
    setNewRecipe({
      ...newRecipe,
      instructions: [...newRecipe.instructions, ""],
    });
  };

  const removeInstruction = (index: number) => {
    if (newRecipe.instructions.length > 1) {
      const newInstructions = newRecipe.instructions.filter((_, i) => i !== index);
      setNewRecipe({ ...newRecipe, instructions: newInstructions });
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingRecipe ? "レシピを編集" : "新しいレシピを追加"}
          </DialogTitle>
          <DialogDescription>
            レシピの詳細情報を入力してください。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* 基本情報 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">レシピ名 *</Label>
              <Input
                id="name"
                value={newRecipe.name}
                onChange={(e) =>
                  setNewRecipe({ ...newRecipe, name: e.target.value })
                }
                placeholder="例: 親子丼"
              />
            </div>
            <div>
              <Label htmlFor="category">カテゴリ *</Label>
              <Select
                value={newRecipe.category}
                onValueChange={(value) =>
                  setNewRecipe({ ...newRecipe, category: value })
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
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="cookingTime">調理時間（分）</Label>
              <Input
                id="cookingTime"
                type="number"
                value={newRecipe.cookingTime}
                onChange={(e) =>
                  setNewRecipe({
                    ...newRecipe,
                    cookingTime: parseInt(e.target.value) || 30,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="servings">人数</Label>
              <Input
                id="servings"
                type="number"
                value={newRecipe.servings}
                onChange={(e) =>
                  setNewRecipe({
                    ...newRecipe,
                    servings: parseInt(e.target.value) || 2,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="difficulty">難易度</Label>
              <Select
                value={newRecipe.difficulty}
                onValueChange={(value: typeof newRecipe.difficulty) =>
                  setNewRecipe({ ...newRecipe, difficulty: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {difficultyOptions.map((difficulty) => (
                    <SelectItem key={difficulty} value={difficulty}>
                      {difficulty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 材料 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>材料 *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
                <Plus className="w-3 h-3 mr-1" />
                追加
              </Button>
            </div>
            {newRecipe.ingredients.map((ingredient, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  value={ingredient}
                  onChange={(e) => {
                    const newIngredients = [...newRecipe.ingredients];
                    newIngredients[index] = e.target.value;
                    setNewRecipe({ ...newRecipe, ingredients: newIngredients });
                  }}
                  placeholder="例: 鶏もも肉 200g"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeIngredient(index)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>

          {/* 手順 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>調理手順</Label>
              <Button type="button" variant="outline" size="sm" onClick={addInstruction}>
                <Plus className="w-3 h-3 mr-1" />
                追加
              </Button>
            </div>
            {newRecipe.instructions.map((instruction, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <div className="text-sm text-gray-500 mt-2 w-6">{index + 1}.</div>
                <Input
                  value={instruction}
                  onChange={(e) => {
                    const newInstructions = [...newRecipe.instructions];
                    newInstructions[index] = e.target.value;
                    setNewRecipe({ ...newRecipe, instructions: newInstructions });
                  }}
                  placeholder="調理手順を入力"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeInstruction(index)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCloseDialog}>
            キャンセル
          </Button>
          <Button onClick={handleSaveRecipe} className={buttonVariants({ theme: "recipes" })}>
            {editingRecipe ? "更新" : "追加"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function RecipeManagement() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  const [selectedCategory, setSelectedCategory] = useState("all");

  // ローカルストレージからレシピデータを読み込み
  useEffect(() => {
    const savedRecipes = localStorage.getItem("recipes");
    if (savedRecipes) {
      setRecipes(JSON.parse(savedRecipes));
    }
  }, []);

  // レシピデータをローカルストレージに保存
  useEffect(() => {
    localStorage.setItem("recipes", JSON.stringify(recipes));
  }, [recipes]);

  // フィルタリングされたレシピ
  const filteredRecipes = recipes.filter((recipe) => {
    const matchesCategory =
      selectedCategory === "all" || recipe.category === selectedCategory;
    return matchesCategory;
  });

  const favoriteRecipes = recipes.filter((recipe) => recipe.isFavorite);

  // レシピを追加/編集
  const handleSaveRecipe = (recipeData: Omit<Recipe, "id" | "createdDate">) => {
    if (editingRecipe) {
      // 編集モード
      setRecipes(
        recipes.map((recipe) =>
          recipe.id === editingRecipe.id
            ? { ...recipeData, id: editingRecipe.id, createdDate: editingRecipe.createdDate }
            : recipe
        )
      );
    } else {
      // 新規追加モード
      const recipe: Recipe = {
        ...recipeData,
        id: Date.now().toString(),
        createdDate: new Date().toISOString(),
      };
      setRecipes([...recipes, recipe]);
    }
  };

  // レシピを削除
  const handleDeleteRecipe = (id: string) => {
    setRecipes(recipes.filter((recipe) => recipe.id !== id));
  };

  // レシピを編集
  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
  };

  // 編集完了
  const handleEditComplete = () => {
    setEditingRecipe(null);
  };

  // お気に入りを切り替え
  const toggleFavorite = (id: string) => {
    setRecipes(
      recipes.map((recipe) =>
        recipe.id === id ? { ...recipe, isFavorite: !recipe.isFavorite } : recipe
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* 統計 */}
      <div className="flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <BookOpen className={iconColorVariants({ theme: "recipes" })} />
          <span>登録レシピ {recipes.length}品</span>
        </div>
        <div className="flex items-center gap-1">
          <Heart className="w-4 h-4 text-red-600" />
          <span>お気に入り {favoriteRecipes.length}品</span>
        </div>
        <div className="flex items-center gap-1">
          <BookOpen className={iconColorVariants({ theme: "recipes" })} />
          <span>カテゴリ {categories.length}種</span>
        </div>
      </div>

      {/* カテゴリ選択とレシピ追加 */}
      <div className="space-y-4">
        {/* カテゴリフィルター */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">カテゴリで絞り込み</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className={buttonVariants({ 
                theme: "recipes", 
                variant: selectedCategory === "all" ? "solid" : "outline",
                size: "sm" 
              })}
            >
              すべて
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={buttonVariants({ 
                  theme: "recipes", 
                  variant: selectedCategory === category ? "solid" : "outline",
                  size: "sm" 
                })}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
        
        {/* レシピ追加ボタン */}
        {recipes.length > 0 && (
          <div className="flex justify-end">
            <AddRecipeButton 
              onSave={handleSaveRecipe}
              editingRecipe={editingRecipe}
              onEditComplete={handleEditComplete}
            >
              <Button className={buttonVariants({ theme: "recipes" })}>
                <Plus className="w-4 h-4 mr-2" />
                レシピを追加
              </Button>
            </AddRecipeButton>
          </div>
        )}
      </div>

      {/* レシピリスト */}
      <div className="grid gap-4">
        {filteredRecipes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className={`w-16 h-16 mx-auto mb-4 ${textColorVariants({ theme: "recipes" })}`} />
              <h3 className="text-lg font-semibold mb-2">
                {selectedCategory !== "all" 
                  ? "選択されたカテゴリにレシピがありません" 
                  : "レシピがありません"}
              </h3>
              <p className="text-gray-600 mb-4">
                {selectedCategory !== "all"
                  ? "他のカテゴリを選択してみてください"
                  : "最初のレシピを追加して料理を始めましょう"}
              </p>
              {selectedCategory === "all" && (
                <AddRecipeButton 
                  onSave={handleSaveRecipe}
                  editingRecipe={editingRecipe}
                  onEditComplete={handleEditComplete}
                >
                  <Button className={buttonVariants({ theme: "recipes" })}>
                    <Plus className="w-4 h-4 mr-2" />
                    レシピを追加
                  </Button>
                </AddRecipeButton>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredRecipes.map((recipe) => (
            <Card key={recipe.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {recipe.name}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleFavorite(recipe.id)}
                        className="p-1 h-auto"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            recipe.isFavorite
                              ? "fill-red-500 text-red-500"
                              : "text-gray-400"
                          }`}
                        />
                      </Button>
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">{recipe.category}</Badge>
                      <Badge variant="outline">{recipe.difficulty}</Badge>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="w-3 h-3" />
                        {recipe.cookingTime}分
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Users className="w-3 h-3" />
                        {recipe.servings}人分
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditRecipe(recipe)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteRecipe(recipe.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">材料:</h4>
                    <div className="text-sm text-gray-600">
                      {recipe.ingredients.slice(0, 3).join(", ")}
                      {recipe.ingredients.length > 3 && "..."}
                    </div>
                  </div>
                  {recipe.instructions.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">手順:</h4>
                      <div className="text-sm text-gray-600">
                        1. {recipe.instructions[0]}
                        {recipe.instructions.length > 1 && "..."}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 編集用のAddRecipeButton（非表示） */}
      <AddRecipeButton 
        onSave={handleSaveRecipe}
        editingRecipe={editingRecipe}
        onEditComplete={handleEditComplete}
      >
        <div style={{ display: 'none' }} />
      </AddRecipeButton>
    </div>
  );
} 