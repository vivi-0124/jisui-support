'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChefHat,
  Play,
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Youtube,
  ExternalLink,
  ArrowLeft,
  Package,
  Star,
  Timer,
  BookOpen,
} from 'lucide-react';
import { buttonVariants } from '@/lib/theme-variants';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Ingredient } from '@/components/ingredients-management';
import {
  Playlist as RecipePlaylist,
  Video as RecipeVideo,
} from '@/components/recipe-management';

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
  recipeVideoUrl?: string;
  videoId?: string;
  status: 'preparing' | 'cooking' | 'completed';
  createdAt: string;
  completedAt?: string;
}

interface UsedIngredient {
  ingredientId: string;
  ingredientName: string;
  quantityUsed: number;
  unit: string;
  originalQuantity: number;
}

interface ExtractedRecipe {
  title: string;
  ingredients: string[];
  steps: string[];
  servings?: string;
  cookingTime?: string;
  description: string;
  extractionMethod:
    | 'gemini_video_analysis'
    | 'gemini_text_analysis'
    | 'description';
  videoId: string;
}

interface CookableRecipe {
  video: RecipeVideo;
  extractedRecipe?: ExtractedRecipe;
  matchedIngredients: MatchedIngredient[];
  matchPercentage: number;
}

interface MatchedIngredient {
  ingredientId: string;
  ingredientName: string;
  extractedIngredient: string;
  available: boolean;
  availableQuantity: number;
  unit: string;
}

export default function CookingManagement({
  ingredients,
  setIngredients,
}: CookingManagementProps) {
  const [cookingSessions, setCookingSessions] = useState<CookingSession[]>([]);
  const [cookableRecipes, setCookableRecipes] = useState<CookableRecipe[]>([]);
  const [playlists, setPlaylists] = useState<RecipePlaylist[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<CookingSession | null>(
    null
  );
  const [activeTab, setActiveTab] = useState('recipes');

  const { user } = useAuth();

  const loadPlaylists = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('playlists')
      .select(
        `
        *,
        videos (*)
      `
      )
      .eq('user_id', user.id);

    if (error) {
      console.error('プレイリスト読み込みエラー:', error);
    } else {
      setPlaylists(
        (data || []).map(
          (
            p: Omit<RecipePlaylist, 'videos'> & { videos: RecipeVideo[] | null }
          ) => ({
            ...p,
            videos: p.videos || [],
          })
        )
      );
    }
  }, [user]);

  const loadCookingSessions = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cooking_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        if (
          error.message.includes('relation "cooking_sessions" does not exist')
        ) {
          console.log(
            '調理セッションテーブルが未作成です。空の履歴を表示します。'
          );
          setCookingSessions([]);
          return;
        }
        console.error('調理セッション読み込みエラー:', error);
      } else {
        setCookingSessions(data || []);
      }
    } catch (error) {
      console.error('調理セッション読み込みエラー:', error);
      setCookingSessions([]);
    }
  }, [user]);

  const extractVideoId = useCallback((url: string): string | null => {
    const regex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }, []);

  const matchIngredientsWithInventory = useCallback(
    (
      extractedIngredients: string[],
      inventory: Ingredient[]
    ): MatchedIngredient[] => {
      const matches: MatchedIngredient[] = [];

      extractedIngredients.forEach((extracted) => {
        const normalizedExtracted = extracted.toLowerCase();

        const matchedInventory = inventory.find((inv) => {
          const normalizedInv = inv.name.toLowerCase();
          return (
            normalizedExtracted.includes(normalizedInv) ||
            normalizedInv.includes(normalizedExtracted.split(' ')[0]) ||
            normalizedExtracted
              .split(' ')
              .some((word) => normalizedInv.includes(word))
          );
        });

        matches.push({
          ingredientId: matchedInventory?.id || '',
          ingredientName: matchedInventory?.name || '',
          extractedIngredient: extracted,
          available: !!matchedInventory && matchedInventory.quantity > 0,
          availableQuantity: matchedInventory?.quantity || 0,
          unit: matchedInventory?.unit || '',
        });
      });

      return matches;
    },
    []
  );

  const calculateMatchPercentage = useCallback(
    (matchedIngredients: MatchedIngredient[]): number => {
      if (matchedIngredients.length === 0) return 0;
      const availableCount = matchedIngredients.filter(
        (m) => m.available
      ).length;
      return Math.round((availableCount / matchedIngredients.length) * 100);
    },
    []
  );

  const loadCookableRecipes = useCallback(async () => {
    if (!user) return;

    try {
      const { data: extractedRecipes, error } = await supabase
        .from('extracted_recipes')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        if (
          error.message.includes('relation "extracted_recipes" does not exist')
        ) {
          console.log(
            '抽出レシピテーブルが未作成です。未分析レシピのみ表示します。'
          );
          const cookable: CookableRecipe[] = [];

          for (const playlist of playlists) {
            for (const video of playlist.videos) {
              cookable.push({
                video,
                matchedIngredients: [],
                matchPercentage: 0,
              });
            }
          }

          setCookableRecipes(cookable);
          return;
        }
        console.error('抽出済みレシピ読み込みエラー:', error);
        return;
      }

      const cookable: CookableRecipe[] = [];

      for (const playlist of playlists) {
        for (const video of playlist.videos) {
          const videoId = extractVideoId(video.url);
          if (!videoId) continue;

          const existingRecipe = extractedRecipes?.find(
            (r) => r.video_id === videoId
          );

          if (existingRecipe) {
            const matchedIngredients = matchIngredientsWithInventory(
              existingRecipe.ingredients || [],
              ingredients
            );
            const matchPercentage =
              calculateMatchPercentage(matchedIngredients);

            if (matchPercentage > 0) {
              cookable.push({
                video,
                extractedRecipe: {
                  title: existingRecipe.title,
                  ingredients: existingRecipe.ingredients || [],
                  steps: existingRecipe.steps || [],
                  servings: existingRecipe.servings,
                  cookingTime: existingRecipe.cooking_time,
                  description: existingRecipe.description || '',
                  extractionMethod: existingRecipe.extraction_method as
                    | 'gemini_video_analysis'
                    | 'gemini_text_analysis'
                    | 'description',
                  videoId,
                },
                matchedIngredients,
                matchPercentage,
              });
            }
          } else {
            cookable.push({
              video,
              matchedIngredients: [],
              matchPercentage: 0,
            });
          }
        }
      }

      cookable.sort((a, b) => b.matchPercentage - a.matchPercentage);
      setCookableRecipes(cookable);
    } catch (error) {
      console.error('調理可能レシピ計算エラー:', error);
      setCookableRecipes([]);
    }
  }, [
    user,
    ingredients,
    playlists,
    extractVideoId,
    matchIngredientsWithInventory,
    calculateMatchPercentage,
  ]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPlaylists(),
        loadCookingSessions(),
        loadCookableRecipes(),
      ]);
    } catch (error) {
      console.error('データの読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  }, [loadPlaylists, loadCookingSessions, loadCookableRecipes]);

  // データを読み込み
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const analyzeRecipe = async (
    video: RecipeVideo
  ): Promise<ExtractedRecipe | null> => {
    const videoId = extractVideoId(video.url);
    if (!videoId) return null;

    try {
      const response = await fetch(
        `/api/youtube/extract-recipe?videoId=${videoId}`
      );
      const data = await response.json();

      if (response.ok) {
        const extractedRecipe: ExtractedRecipe = {
          ...data.recipe,
          videoId,
        };

        // データベースに保存（テーブルが存在する場合のみ）
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
          } catch (error) {
            console.log(
              'レシピ分析結果の保存をスキップしました（テーブル未作成）:',
              error
            );
          }
        }

        return extractedRecipe;
      }
    } catch (error) {
      console.error('レシピ分析エラー:', error);
    }

    return null;
  };

  const startCooking = async (recipe: CookableRecipe) => {
    if (!recipe.extractedRecipe) {
      // レシピ分析が必要
      setLoading(true);
      const extractedRecipe = await analyzeRecipe(recipe.video);
      setLoading(false);

      if (!extractedRecipe) {
        alert('レシピの分析に失敗しました');
        return;
      }

      recipe.extractedRecipe = extractedRecipe;
      recipe.matchedIngredients = matchIngredientsWithInventory(
        extractedRecipe.ingredients,
        ingredients
      );
      recipe.matchPercentage = calculateMatchPercentage(
        recipe.matchedIngredients
      );
    }

    // 調理セッションを作成
    const session: CookingSession = {
      id: crypto.randomUUID(),
      dishName: recipe.extractedRecipe.title,
      servings: parseInt(recipe.extractedRecipe.servings || '1'),
      usedIngredients: recipe.matchedIngredients
        .filter((m) => m.available)
        .map((m) => ({
          ingredientId: m.ingredientId,
          ingredientName: m.ingredientName,
          quantityUsed: 1,
          unit: m.unit,
          originalQuantity: m.availableQuantity,
        })),
      cookingTime: parseInt(
        recipe.extractedRecipe.cookingTime?.replace(/\D/g, '') || '30'
      ),
      notes: '',
      recipeVideoUrl: recipe.video.url,
      videoId: recipe.extractedRecipe.videoId,
      status: 'preparing',
      createdAt: new Date().toISOString(),
    };

    setCurrentSession(session);
    setActiveTab('cooking');
  };

  const completeCooking = async (session: CookingSession, notes: string) => {
    // 材料を消費
    const updatedIngredients = [...ingredients];

    for (const usedIngredient of session.usedIngredients) {
      const ingredientIndex = updatedIngredients.findIndex(
        (ing) => ing.id === usedIngredient.ingredientId
      );

      if (ingredientIndex !== -1) {
        const newQuantity = Math.max(
          0,
          updatedIngredients[ingredientIndex].quantity -
            usedIngredient.quantityUsed
        );
        updatedIngredients[ingredientIndex] = {
          ...updatedIngredients[ingredientIndex],
          quantity: newQuantity,
        };

        if (user) {
          await supabase
            .from('ingredients')
            .update({ quantity: newQuantity })
            .eq('id', usedIngredient.ingredientId);
        }
      }
    }

    setIngredients(updatedIngredients);

    // 調理セッションを完了
    const completedSession: CookingSession = {
      ...session,
      status: 'completed',
      notes,
      completedAt: new Date().toISOString(),
    };

    // データベースに保存（テーブルが存在する場合のみ）
    if (user) {
      try {
        await supabase.from('cooking_sessions').insert({
          id: completedSession.id,
          user_id: user.id,
          dish_name: completedSession.dishName,
          servings: completedSession.servings,
          used_ingredients: completedSession.usedIngredients,
          cooking_time: completedSession.cookingTime,
          notes: completedSession.notes,
          recipe_video_url: completedSession.recipeVideoUrl,
          video_id: completedSession.videoId,
          status: completedSession.status,
          created_at: completedSession.createdAt,
          completed_at: completedSession.completedAt,
        });
      } catch (error) {
        console.log(
          '調理セッションの保存をスキップしました（テーブル未作成）:',
          error
        );
      }
    }

    setCookingSessions((prev) => [completedSession, ...prev]);
    setCurrentSession(null);
    setActiveTab('history');

    alert(`${completedSession.dishName}の調理が完了しました！`);
  };

  if (loading && cookableRecipes.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-600" />
          <p className="text-gray-600">調理可能なレシピを分析中...</p>
        </div>
      </div>
    );
  }

  if (currentSession) {
    return (
      <CookingInterface
        session={currentSession}
        onComplete={completeCooking}
        onCancel={() => setCurrentSession(null)}
      />
    );
  }

  return (
    <div className="max-w-full min-w-0 space-y-6 overflow-hidden">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <ChefHat className="h-6 w-6 text-orange-600" />
          料理する
        </h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recipes">調理可能レシピ</TabsTrigger>
          <TabsTrigger value="ingredients">材料確認</TabsTrigger>
          <TabsTrigger value="history">調理履歴</TabsTrigger>
        </TabsList>

        <TabsContent value="recipes" className="space-y-4">
          {cookableRecipes.length === 0 && !loading && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">
                    新しい料理管理機能を使用するには、データベースのセットアップが必要です。
                    開発者にお問い合わせください。
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
          <RecipeList
            recipes={cookableRecipes}
            onStartCooking={startCooking}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="ingredients" className="space-y-4">
          <IngredientStatus ingredients={ingredients} />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <CookingHistory sessions={cookingSessions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// レシピリストコンポーネント
function RecipeList({
  recipes,
  onStartCooking,
  loading,
}: {
  recipes: CookableRecipe[];
  onStartCooking: (recipe: CookableRecipe) => void;
  loading: boolean;
}) {
  if (recipes.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BookOpen className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h3 className="mb-2 text-lg font-semibold">
            調理可能なレシピがありません
          </h3>
          <p className="text-gray-600">
            レシピ管理でお気に入りの動画を保存してください
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {recipes.map((recipe, index) => (
        <Card key={`${recipe.video.id}-${index}`} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* 動画情報 */}
              <div className="flex gap-3">
                <div className="relative h-20 w-32 flex-shrink-0">
                  <Image
                    src={recipe.video.thumbnail}
                    alt={recipe.video.title}
                    width={128}
                    height={80}
                    className="h-full w-full rounded object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Youtube className="h-6 w-6 text-white opacity-80" />
                  </div>
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <h4 className="line-clamp-2 font-semibold">
                    {recipe.video.title}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {recipe.matchPercentage > 0 ? (
                      <Badge
                        variant={
                          recipe.matchPercentage >= 80 ? 'default' : 'secondary'
                        }
                        className="text-xs"
                      >
                        <Star className="mr-1 h-3 w-3" />
                        材料マッチ {recipe.matchPercentage}%
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        <Loader2 className="mr-1 h-3 w-3" />
                        分析が必要
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* レシピ詳細 */}
              {recipe.extractedRecipe && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                    {recipe.extractedRecipe.servings && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {recipe.extractedRecipe.servings}
                      </div>
                    )}
                    {recipe.extractedRecipe.cookingTime && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {recipe.extractedRecipe.cookingTime}
                      </div>
                    )}
                  </div>

                  {/* 材料マッチング状況 */}
                  {recipe.matchedIngredients.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">必要な材料:</h5>
                      <div className="flex flex-wrap gap-1">
                        {recipe.matchedIngredients
                          .slice(0, 6)
                          .map((ingredient, idx) => (
                            <Badge
                              key={idx}
                              variant={
                                ingredient.available ? 'default' : 'destructive'
                              }
                              className="text-xs"
                            >
                              {ingredient.extractedIngredient}
                              {ingredient.available ? (
                                <CheckCircle className="ml-1 h-3 w-3" />
                              ) : (
                                <AlertTriangle className="ml-1 h-3 w-3" />
                              )}
                            </Badge>
                          ))}
                        {recipe.matchedIngredients.length > 6 && (
                          <Badge variant="outline" className="text-xs">
                            +{recipe.matchedIngredients.length - 6}個
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* アクションボタン */}
              <div className="flex gap-2">
                <Button
                  onClick={() => onStartCooking(recipe)}
                  disabled={loading}
                  className={`flex-1 ${buttonVariants({ theme: 'search' })}`}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  {recipe.extractedRecipe ? '料理開始' : '分析して開始'}
                </Button>
                <Button variant="outline" size="sm" asChild className="px-3">
                  <a
                    href={recipe.video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// 材料状況コンポーネント
function IngredientStatus({ ingredients }: { ingredients: Ingredient[] }) {
  const availableIngredients = ingredients.filter((ing) => ing.quantity > 0);
  const lowStockIngredients = ingredients.filter(
    (ing) => ing.quantity > 0 && ing.quantity <= 2
  );

  return (
    <div className="space-y-6">
      {/* 統計 */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {availableIngredients.length}
            </div>
            <div className="text-sm text-gray-600">利用可能</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {lowStockIngredients.length}
            </div>
            <div className="text-sm text-gray-600">在庫少</div>
          </CardContent>
        </Card>
      </div>

      {/* 材料リスト */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">利用可能な材料</h3>
        {availableIngredients.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p className="text-gray-600">利用可能な材料がありません</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {availableIngredients.map((ingredient) => (
              <Card key={ingredient.id} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-medium">
                        {ingredient.name}
                      </h4>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {ingredient.category}
                        </Badge>
                        {ingredient.quantity <= 2 && (
                          <Badge
                            variant="outline"
                            className="text-xs text-yellow-600"
                          >
                            在庫少
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {ingredient.quantity}
                        {ingredient.unit}
                      </div>
                      {ingredient.expiry_date && (
                        <div className="text-xs text-gray-500">
                          期限: {ingredient.expiry_date}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 調理履歴コンポーネント
function CookingHistory({ sessions }: { sessions: CookingSession[] }) {
  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Timer className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h3 className="mb-2 text-lg font-semibold">調理履歴がありません</h3>
          <p className="text-gray-600">料理を作って履歴を蓄積しましょう</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <Card key={session.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h4 className="truncate font-semibold">{session.dishName}</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Users className="mr-1 h-3 w-3" />
                      {session.servings}人分
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="mr-1 h-3 w-3" />
                      {session.cookingTime}分
                    </Badge>
                    <Badge
                      variant={
                        session.status === 'completed' ? 'default' : 'secondary'
                      }
                      className="text-xs"
                    >
                      {session.status === 'completed' ? '完了' : '進行中'}
                    </Badge>
                  </div>
                </div>
                {session.recipeVideoUrl && (
                  <Button variant="outline" size="sm" asChild className="ml-2">
                    <a
                      href={session.recipeVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Youtube className="h-4 w-4" />
                    </a>
                  </Button>
                )}
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

              {session.notes && (
                <div className="rounded bg-gray-50 p-2 text-sm text-gray-600">
                  {session.notes}
                </div>
              )}

              <div className="text-xs text-gray-500">
                {session.completedAt
                  ? `完了: ${new Date(session.completedAt).toLocaleString('ja-JP')}`
                  : `開始: ${new Date(session.createdAt).toLocaleString('ja-JP')}`}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// 調理インターフェースコンポーネント
function CookingInterface({
  session,
  onComplete,
  onCancel,
}: {
  session: CookingSession;
  onComplete: (session: CookingSession, notes: string) => void;
  onCancel: () => void;
}) {
  const [notes, setNotes] = useState(session.notes || '');
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await onComplete(session, notes);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="max-w-full min-w-0 space-y-6 overflow-hidden">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-bold">{session.dishName}</h2>
          <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {session.servings}人分
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {session.cookingTime}分
            </span>
          </div>
        </div>
      </div>

      {/* YouTube動画 */}
      {session.recipeVideoUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Youtube className="h-5 w-5 text-red-600" />
              レシピ動画
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${session.videoId}`}
                title="Recipe Video"
                className="h-full w-full rounded"
                allowFullScreen
              />
            </div>
            <div className="mt-3 flex justify-center">
              <Button variant="outline" asChild>
                <a
                  href={session.recipeVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  YouTubeで開く
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 使用材料 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-600" />
            使用材料
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {session.usedIngredients.map((ingredient) => (
              <div
                key={ingredient.ingredientId}
                className="flex items-center justify-between rounded-lg bg-green-50 p-3"
              >
                <div>
                  <div className="font-medium">{ingredient.ingredientName}</div>
                  <div className="text-sm text-gray-600">
                    在庫: {ingredient.originalQuantity}
                    {ingredient.unit}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">
                    {ingredient.quantityUsed}
                    {ingredient.unit}
                  </div>
                  <div className="text-xs text-gray-500">使用予定</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* メモ */}
      <Card>
        <CardHeader>
          <CardTitle>調理メモ</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="調理中の気づきや感想を記録..."
            rows={3}
            className="w-full resize-none rounded-lg border p-3 focus:border-transparent focus:ring-2 focus:ring-orange-500"
          />
        </CardContent>
      </Card>

      {/* 完了ボタン */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          キャンセル
        </Button>
        <Button
          onClick={handleComplete}
          disabled={isCompleting}
          className={`flex-1 ${buttonVariants({ theme: 'search' })}`}
        >
          {isCompleting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="mr-2 h-4 w-4" />
          )}
          調理完了
        </Button>
      </div>
    </div>
  );
}
