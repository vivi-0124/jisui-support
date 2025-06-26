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
  BookOpen,
  Clock,
  Users,
  Trash2,
  Edit,
  Heart,
  Filter,
} from "lucide-react";
import { buttonVariants, iconColorVariants, textColorVariants, cardVariants } from "@/lib/theme-variants";

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
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

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
    
    const matchesDifficulty =
      selectedDifficulty === "all" || recipe.difficulty === selectedDifficulty;
    
    const matchesFavorites = !showOnlyFavorites || recipe.isFavorite;
    
    return matchesCategory && matchesDifficulty && matchesFavorites;
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
    if (confirm("このレシピを削除しますか？")) {
      setRecipes(recipes.filter((recipe) => recipe.id !== id));
    }
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

  // フィルターをクリア
  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedDifficulty("all");
    setShowOnlyFavorites(false);
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
        {filteredRecipes.length !== recipes.length && (
          <div className="flex items-center gap-1">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>絞り込み結果 {filteredRecipes.length}品</span>
          </div>
        )}
      </div>

      {/* レシピ追加とフィルター */}
      <div className="flex flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-semibold">レシピ一覧</h2>
        {recipes.length > 0 && (
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
      </div>

      {/* フィルター */}
      {recipes.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-10 bg-gray-50 hover:bg-gray-100 border-gray-200 transition-colors">
                <SelectValue placeholder="カテゴリを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのカテゴリ</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="h-10 bg-gray-50 hover:bg-gray-100 border-gray-200 transition-colors">
                <SelectValue placeholder="難易度を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての難易度</SelectItem>
                {difficultyOptions.map((difficulty) => (
                  <SelectItem key={difficulty} value={difficulty}>
                    {difficulty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={showOnlyFavorites ? "default" : "outline"}
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              className="h-10 transition-all duration-200 hover:scale-105"
            >
              <Heart className={`w-4 h-4 mr-2 ${showOnlyFavorites ? "fill-current" : ""}`} />
              お気に入り
            </Button>

            {(selectedCategory !== "all" || selectedDifficulty !== "all" || showOnlyFavorites) && (
              <Button 
                variant="ghost" 
                onClick={clearFilters} 
                className="h-10 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                リセット
              </Button>
            )}
          </div>
        </div>
      )}

      {/* レシピリスト */}
      <div className="space-y-6">
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
          <>
            {/* お気に入りレシピ */}
            {filteredRecipes.filter(recipe => recipe.isFavorite).length > 0 && (
              <div className="space-y-3">
                <h3 className={`text-lg font-semibold flex items-center gap-2 ${textColorVariants({ theme: "recipes" })}`}>
                  <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                  お気に入りレシピ ({filteredRecipes.filter(recipe => recipe.isFavorite).length}品)
                </h3>
                <div className="grid gap-3">
                  {filteredRecipes.filter(recipe => recipe.isFavorite).map((recipe) => (
                    <Card key={recipe.id} className={cardVariants({ theme: "recipes" })}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-lg">{recipe.name}</h4>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleFavorite(recipe.id)}
                                className="p-1 h-auto"
                              >
                                <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                              </Button>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <Badge variant="secondary">{recipe.category}</Badge>
                              <Badge variant="outline">{recipe.difficulty}</Badge>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Clock className="w-3 h-3" />
                                <span>{recipe.cookingTime}分</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Users className="w-3 h-3" />
                                <span>{recipe.servings}人分</span>
                              </div>
                            </div>
                            <div className="space-y-2 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">材料: </span>
                                <span>
                                  {recipe.ingredients.slice(0, 3).join(", ")}
                                  {recipe.ingredients.length > 3 && `など${recipe.ingredients.length}種類`}
                                </span>
                              </div>
                              {recipe.instructions.length > 0 && (
                                <div>
                                  <span className="font-medium">手順: </span>
                                  <span>
                                    {recipe.instructions[0]}
                                    {recipe.instructions.length > 1 && `など${recipe.instructions.length}ステップ`}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
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
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* その他のレシピ */}
            {filteredRecipes.filter(recipe => !recipe.isFavorite).length > 0 && (
              <div className="space-y-3">
                <h3 className={`text-lg font-semibold ${textColorVariants({ theme: "recipes" })}`}>
                  その他のレシピ ({filteredRecipes.filter(recipe => !recipe.isFavorite).length}品)
                </h3>
                <div className="grid gap-3">
                  {filteredRecipes.filter(recipe => !recipe.isFavorite).map((recipe) => (
                    <Card key={recipe.id} className={cardVariants({ theme: "recipes" })}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-lg">{recipe.name}</h4>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleFavorite(recipe.id)}
                                className="p-1 h-auto"
                              >
                                <Heart className="w-4 h-4 text-gray-400" />
                              </Button>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <Badge variant="secondary">{recipe.category}</Badge>
                              <Badge variant="outline">{recipe.difficulty}</Badge>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Clock className="w-3 h-3" />
                                <span>{recipe.cookingTime}分</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Users className="w-3 h-3" />
                                <span>{recipe.servings}人分</span>
                              </div>
                            </div>
                            <div className="space-y-2 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">材料: </span>
                                <span>
                                  {recipe.ingredients.slice(0, 3).join(", ")}
                                  {recipe.ingredients.length > 3 && `など${recipe.ingredients.length}種類`}
                                </span>
                              </div>
                              {recipe.instructions.length > 0 && (
                                <div>
                                  <span className="font-medium">手順: </span>
                                  <span>
                                    {recipe.instructions[0]}
                                    {recipe.instructions.length > 1 && `など${recipe.instructions.length}ステップ`}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
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
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
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