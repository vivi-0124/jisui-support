'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Plus,
} from 'lucide-react';
import { buttonVariants, iconColorVariants } from '@/lib/theme-variants';
import { supabase } from '@/lib/supabase';
import { useAuth, type User } from '@/contexts/AuthContext';
import { Ingredient } from '@/components/ingredients-management';
import {
  Playlist as RecipePlaylist,
  Video as RecipeVideo,
} from '@/components/recipe-management';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

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
  steps?: string[];
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
  const [_loading, setLoading] = useState(false);
  const [analyzingVideoId, setAnalyzingVideoId] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<CookingSession | null>(
    null
  );
  const [recipeDialogOpen, setRecipeDialogOpen] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{
    open: boolean;
    message: string;
  }>({ open: false, message: '' });

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
        type DBRow = {
          id: string;
          dish_name: string;
          servings: number;
          used_ingredients: UsedIngredient[] | null;
          cooking_time: number;
          notes: string | null;
          recipe_video_url: string | null;
          video_id: string | null;
          status: 'preparing' | 'cooking' | 'completed' | null;
          created_at: string;
          completed_at: string | null;
        };

        const normalizedSessions: CookingSession[] = (data || []).map(
          (row: DBRow) => ({
            id: row.id,
            dishName: row.dish_name,
            servings: row.servings,
            usedIngredients: row.used_ingredients ?? [],
            cookingTime: row.cooking_time,
            notes: row.notes ?? '',
            recipeVideoUrl: row.recipe_video_url ?? undefined,
            videoId: row.video_id ?? undefined,
            status: (row.status ?? 'completed') as 'preparing' | 'cooking' | 'completed',
            createdAt: row.created_at,
            completedAt: row.completed_at ?? undefined,
          })
        );

        setCookingSessions(normalizedSessions);
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
            const matchPercentage = calculateMatchPercentage(
              matchedIngredients
            );

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
      await Promise.all([loadPlaylists(), loadCookingSessions()]);
    } catch (error) {
      console.error('データの読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  }, [loadPlaylists, loadCookingSessions]);

  // データを読み込み
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  // プレイリストまたは材料が更新されたら調理可能レシピを再計算
  useEffect(() => {
    if (user && playlists.length > 0) {
      loadCookableRecipes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, playlists, ingredients]);

  const analyzeRecipe = async (
    video: RecipeVideo
  ): Promise<{ recipe: ExtractedRecipe | null; error?: string }> => {
    const videoId = extractVideoId(video.url);
    if (!videoId) {
      return { recipe: null, error: '有効なYouTube URLではありません。' };
    }

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

        return { recipe: extractedRecipe };
      } else {
        return { recipe: null, error: data.error };
      }
    } catch (error) {
      console.error('レシピ分析エラー:', error);
      return { recipe: null, error: 'レシピの分析中に不明なエラーが発生しました。' };
    }
  };

  const startCooking = async (recipe: CookableRecipe) => {
    if (!recipe.extractedRecipe) {
      // レシピ分析が必要
      setAnalyzingVideoId(recipe.video.id);
      const { recipe: extractedRecipe, error } = await analyzeRecipe(
        recipe.video
      );
      setAnalyzingVideoId(null);

      if (error || !extractedRecipe) {
        setErrorDialog({
          open: true,
          message: error || 'レシピの分析に失敗しました',
        });
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
      steps: recipe.extractedRecipe.steps || [],
    };

    setCurrentSession(session);
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

    setIngredients(updatedIngredients.filter(ingredient => ingredient.quantity > 0));

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

    alert(`${completedSession.dishName}の調理が完了しました！`);
  };

  if (_loading && cookableRecipes.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-amber-600" />
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
        onCancel={() => {
          setCurrentSession(null);
        }}
      />
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-6 mb-6 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <ChefHat className={iconColorVariants({ theme: 'cooking' })} />
          <span>調理可能 {cookableRecipes.length}品</span>
        </div>
        <div className="flex items-center gap-1">
          <Timer className="h-4 w-4 text-gray-500" />
          <span>調理履歴 {cookingSessions.length}品</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">料理する</h2>
        {user && cookingSessions.length > 0 && (
          <Button
            onClick={() => setRecipeDialogOpen(true)}
            className={`${buttonVariants({ theme: 'cooking' })}`}
          >
            <Plus className="mr-2 h-4 w-4" />
            料理開始
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {cookableRecipes.length === 0 && !user && (
          <Card>
            <CardContent className="p-8 text-center">
              <ChefHat className="mx-auto mb-4 h-16 w-16 text-amber-300" />
              <h3 className="mb-2 text-lg font-semibold">調理可能なレシピがありません</h3>
              <p className="mb-4 text-gray-600">ログインしてレシピを登録しましょう</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 調理履歴（ログインユーザーのみ） */}
      {user && (
        <CookingHistory 
          sessions={cookingSessions} 
          user={user} 
          onStartCooking={() => setRecipeDialogOpen(true)}
        />
      )}

      {/* レシピ選択ダイアログ */}
      <Dialog open={recipeDialogOpen} onOpenChange={setRecipeDialogOpen}>
        <DialogContent className="mx-4 flex h-[90vh] w-[calc(100vw-2rem)] max-w-2xl flex-col overflow-hidden rounded-lg sm:mx-auto sm:h-auto sm:max-h-[90vh] sm:w-full">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-lg">レシピを選択</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4">
            {!user ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <ChefHat className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <h3 className="mb-2 text-lg font-semibold">
                    ログインが必要です
                  </h3>
                  <p className="text-gray-600">
                    調理機能を利用するには、ログインしてレシピを準備してください。
                  </p>
                </CardContent>
              </Card>
            ) : (
              <RecipeList
                recipes={cookableRecipes}
                onStartCooking={(recipe) => {
                  startCooking(recipe);
                  setRecipeDialogOpen(false);
                }}
                analyzingVideoId={analyzingVideoId}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* エラー表示ダイアログ */}
      <Dialog
        open={errorDialog.open}
        onOpenChange={(open) => setErrorDialog({ ...errorDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <span>レシピの取得に失敗しました</span>
            </DialogTitle>
            <DialogDescription className="pt-4">
              {errorDialog.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setErrorDialog({ open: false, message: '' })}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// レシピリストコンポーネント
function RecipeList({
  recipes,
  onStartCooking,
  analyzingVideoId,
}: {
  recipes: CookableRecipe[];
  onStartCooking: (recipe: CookableRecipe) => void;
  analyzingVideoId: string | null;
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
                    {recipe.extractedRecipe ? (
                      <Badge
                        variant={
                          recipe.matchPercentage >= 80
                            ? 'default'
                            : 'secondary'
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
                  disabled={analyzingVideoId === recipe.video.id}
                  className={`flex-1 ${buttonVariants({ theme: 'cooking' })}`}
                >
                  {analyzingVideoId === recipe.video.id ? (
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

// 調理履歴コンポーネント
function CookingHistory({
  sessions,
  user,
  onStartCooking,
}: {
  sessions: CookingSession[];
  user: User | null;
  onStartCooking: () => void;
}) {
  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Timer className="mx-auto mb-4 h-16 w-16 text-amber-300" />
          <h3 className="mb-2 text-lg font-semibold">調理履歴がありません</h3>
          <p className="mb-4 text-gray-600">
            {user
              ? '料理を作って履歴を蓄積しましょう'
              : 'ログインして調理履歴を確認しましょう'}
          </p>
          {user && (
            <Button
              onClick={onStartCooking}
              className={`${buttonVariants({ theme: 'cooking' })}`}
            >
              <Plus className="mr-2 h-4 w-4" />
              料理開始
            </Button>
          )}
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

      {/* 調理手順 */}
      {session.steps && session.steps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              調理手順
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {session.steps.map((step, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                    {index + 1}
                  </span>
                  <span className="mt-0.5">{step}</span>
                </li>
              ))}
            </ol>
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
            className="w-full resize-none rounded-lg border p-3 focus:border-transparent focus:ring-2 focus:ring-amber-500"
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
          className={`flex-1 ${buttonVariants({ theme: 'cooking' })}`}
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
