'use client';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Home,
  Package,
  ShoppingCart,
  BookOpen,
  Search,
  Plus,
  User,
  Utensils,
  Clock,
  Eye,
  FileText,
  Users,
  ExternalLink,
  AlertCircle,
  Save,
  List,
  LogOut,
} from 'lucide-react';
import IngredientsManagement, {
  Ingredient,
} from '@/components/ingredients-management';
import ShoppingList from '@/components/shopping-list';
import RecipeManagement from '@/components/recipe-management';
import {
  gradientButtonVariants,
  headerVariants,
  backgroundVariants,
  headerButtonVariants,
  textColorVariants,
} from '@/lib/theme-variants';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { supabase } from '@/lib/supabase';
import React from 'react';
import {
  Playlist as RecipePlaylist,
  Video as RecipeVideo,
} from '@/components/recipe-management';
import { ShoppingItem } from '@/components/shopping-list';

// Mock types - これらは実際のsupabaseタイプに置き換える必要があります
interface YouTubeVideo {
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  description?: string;
  duration?: string;
  viewCount?: number;
  publishedAt?: string;
}

// InventoryItemを削除し、Ingredientをインポート
// interface InventoryItem {
//   id: string;
//   ingredient_name: string;
//   quantity: number;
//   unit: string;
//   expiration_date?: string;
// }

// Playlist, PlaylistVideoの型定義はrecipe-management.tsxからインポートするため、ここから削除
// interface PlaylistVideo { /* ... */ }
// interface Playlist { /* ... */ }

// VideoCardPropsも新しいプロップを受け取るように更新
interface VideoCardProps {
  video: YouTubeVideo;
  playlists: RecipePlaylist[];
  setPlaylists: React.Dispatch<React.SetStateAction<RecipePlaylist[]>>;
  onLoginRequired: () => void;
}

export default function JisuiSupport() {
  const [activeTab, setActiveTab] = useState('home');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<YouTubeVideo[]>([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const { user, loading, supabase } = useAuth();
  const [playlists, setPlaylists] = useState<RecipePlaylist[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);

  // データ読み込み & 移行
  useEffect(() => {
    if (loading) return;

    const localIngredientsKey = 'ingredients_data';
    const localShoppingKey = 'shopping_list_data';

    const manageData = async () => {
      if (user) {
        // --- ログイン時 ---
        let needsReload = false;

        // データ移行
        const localIngredients = JSON.parse(
          localStorage.getItem(localIngredientsKey) || '[]'
        );
        if (localIngredients.length > 0) {
          const { error } = await supabase
            .from('ingredients')
            .insert(
              localIngredients.map((i: Ingredient) => ({
                ...i,
                user_id: user.id,
              }))
            );
          if (!error) {
            localStorage.removeItem(localIngredientsKey);
            needsReload = true;
          }
        }
        const localShoppingItems = JSON.parse(
          localStorage.getItem(localShoppingKey) || '[]'
        );
        if (localShoppingItems.length > 0) {
          const { error } = await supabase
            .from('shopping_items')
            .insert(
              localShoppingItems.map((i: ShoppingItem) => ({
                ...i,
                user_id: user.id,
              }))
            );
          if (!error) {
            localStorage.removeItem(localShoppingKey);
            needsReload = true;
          }
        }
        if (needsReload) window.location.reload();

        // Supabaseからデータ取得
        const { data: ingredientsData } = await supabase
          .from('ingredients')
          .select('*')
          .eq('user_id', user.id);
        setIngredients(ingredientsData || []);

        const { data: shoppingData } = await supabase
          .from('shopping_items')
          .select('*')
          .eq('user_id', user.id);
        setShoppingItems(shoppingData || []);
      } else {
        // --- 未ログイン時 ---
        setIngredients(
          JSON.parse(localStorage.getItem(localIngredientsKey) || '[]')
        );
        setShoppingItems(
          JSON.parse(localStorage.getItem(localShoppingKey) || '[]')
        );
      }
    };

    manageData();
  }, [user, loading, supabase]);

  // ローカルストレージへの書き込み
  useEffect(() => {
    if (!user && !loading) {
      localStorage.setItem('ingredients_data', JSON.stringify(ingredients));
      localStorage.setItem('shopping_list_data', JSON.stringify(shoppingItems));
    }
  }, [ingredients, shoppingItems, user, loading]);

  // Supabaseからプレイリストを読み込み
  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!user) {
        // ユーザーがログインしていない場合は何もしない
        setPlaylists([]);
        return;
      }

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
        console.error('Error fetching playlists in JisuiSupport:', error);
      } else {
        setPlaylists(
          data.map((p) => ({
            ...p,
            videos: p.videos || [],
          })) as RecipePlaylist[]
        );
      }
    };

    if (!loading) {
      // 認証状態のロードが完了したらフェッチを開始
      fetchPlaylists();
    }
  }, [user, loading, supabase]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={backgroundVariants({ theme: 'home' })}>
      {/* Header */}
      <header className={headerVariants({ theme: 'home' })}>
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="h-6 w-6" />
            <h1 className="text-xl font-bold">自炊サポート</h1>
          </div>

          <div className="flex items-center gap-3">
            <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={headerButtonVariants({ theme: 'home' })}
                >
                  <Search className="mr-1 h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="h-full w-full overflow-y-auto px-4 sm:w-[540px] sm:px-6"
              >
                <SheetHeader>
                  <SheetTitle></SheetTitle>
                </SheetHeader>
                <RecipeSearchSheet
                  ingredients={ingredients}
                  onResultsChange={setSearchResults}
                  onClose={() => {
                    setSearchOpen(false);
                    setActiveTab('home'); // 検索後にホームタブに切り替え
                  }}
                />
              </SheetContent>
            </Sheet>
            {user ? (
              <div className="flex items-center gap-3">
                <User className="mr-1 h-5 w-5" />
                <Button
                  variant="ghost"
                  size="sm"
                  className={headerButtonVariants({ theme: 'home' })}
                  onClick={() => supabase.auth.signOut()}
                >
                  <LogOut className="mr-1 h-5 w-5" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-green-500 via-purple-500 to-blue-500 px-4 py-2 text-white shadow-md transition-all duration-200 hover:from-green-600 hover:via-purple-600 hover:to-blue-600 hover:shadow-lg"
                onClick={() => setAuthModalOpen(true)}
              >
                <User className="h-4 w-4" />
                ログイン/アカウント作成
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Home Tab Content */}
          <TabsContent value="home" className="space-y-8">
            {/* Welcome Section */}
            <div className="space-y-3 pt-6 text-center">
              <h2 className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-3xl font-bold text-transparent">
                おかえりなさい！
              </h2>
              <p className={`text-lg ${textColorVariants({ theme: 'home' })}`}>
                今日も自炊を楽しくサポートします
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex justify-center gap-4 py-4">
              <Button
                size="lg"
                onClick={() => setActiveTab('ingredients')}
                className={gradientButtonVariants({
                  theme: 'ingredients',
                  size: 'lg',
                })}
              >
                <Plus className="h-6 w-6 text-white" />
              </Button>
              <Button
                size="lg"
                onClick={() => setActiveTab('shopping')}
                className={gradientButtonVariants({
                  theme: 'shopping',
                  size: 'lg',
                })}
              >
                <ShoppingCart className="h-6 w-6 text-white" />
              </Button>
              <Button
                size="lg"
                onClick={() => setActiveTab('recipes')}
                className={gradientButtonVariants({
                  theme: 'recipes',
                  size: 'lg',
                })}
              >
                <BookOpen className="h-6 w-6 text-white" />
              </Button>
            </div>

            {/* 検索結果表示エリア */}
            {searchResults.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-xl font-semibold">
                    <Users className="h-5 w-5 text-orange-600" />
                    検索結果
                  </h3>
                  <Badge
                    variant="secondary"
                    className="border-orange-200 bg-orange-100 text-orange-700"
                  >
                    {searchResults.length}件見つかりました
                  </Badge>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {searchResults.map((video, index) => (
                    <VideoCard
                      key={`${video.videoId}-${index}`}
                      video={video}
                      playlists={playlists}
                      setPlaylists={setPlaylists}
                      onLoginRequired={() => setAuthModalOpen(true)}
                    />
                  ))}
                </div>
              </section>
            )}
          </TabsContent>

          {/* Other Tab Contents */}
          <TabsContent value="ingredients" className="space-y-6">
            <IngredientsManagement
              ingredients={ingredients}
              setIngredients={setIngredients}
            />
          </TabsContent>

          {/* Shopping List Tab Content */}
          <TabsContent value="shopping" className="space-y-6">
            <ShoppingList
              shoppingItems={shoppingItems}
              setShoppingItems={setShoppingItems}
            />
          </TabsContent>

          <TabsContent value="recipes">
            <RecipeManagement
              playlists={playlists}
              setPlaylists={setPlaylists}
            />
          </TabsContent>

          {/* Bottom Navigation */}
          <TabsList className="fixed right-0 bottom-0 left-0 grid h-16 w-full grid-cols-4 rounded-none border-t bg-white p-1 shadow-lg">
            <TabsTrigger
              value="home"
              className={`flex flex-col items-center gap-1 px-2 py-1 text-xs data-[state=active]:text-gray-600`}
            >
              <Home className="h-4 w-4" />
              ホーム
            </TabsTrigger>
            <TabsTrigger
              value="ingredients"
              className={`flex flex-col items-center gap-1 px-2 py-1 text-xs data-[state=active]:text-green-600`}
            >
              <Package className="h-4 w-4" />
              材料管理
            </TabsTrigger>
            <TabsTrigger
              value="shopping"
              className={`flex flex-col items-center gap-1 px-2 py-1 text-xs data-[state=active]:text-purple-600`}
            >
              <ShoppingCart className="h-4 w-4" />
              買い物リスト
            </TabsTrigger>
            <TabsTrigger
              value="recipes"
              className={`flex flex-col items-center gap-1 px-2 py-1 text-xs data-[state=active]:text-blue-600`}
            >
              <BookOpen className="h-4 w-4" />
              レシピ管理
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </main>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}

// レシピ検索シートコンポーネント
interface RecipeSearchSheetProps {
  ingredients: Ingredient[];
  onResultsChange: (results: YouTubeVideo[]) => void;
  onClose: () => void;
}

function RecipeSearchSheet({
  ingredients,
  onResultsChange,
  onClose,
}: RecipeSearchSheetProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<string[]>(
    []
  );

  const toggleIngredientSelection = (ingredientId: string) => {
    setSelectedIngredientIds((prev) =>
      prev.includes(ingredientId)
        ? prev.filter((id) => id !== ingredientId)
        : [...prev, ingredientId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIngredientIds.length === ingredients.length) {
      setSelectedIngredientIds([]);
    } else {
      setSelectedIngredientIds(ingredients.map((ing) => ing.id));
    }
  };

  const getSelectedIngredients = () => {
    return ingredients.filter((ing) => selectedIngredientIds.includes(ing.id));
  };

  const searchRecipes = async (query: string) => {
    setLoading(true);
    setError('');

    try {
      const selectedIngredients = getSelectedIngredients();
      const ingredientNames = selectedIngredients.map((ing) => ing.name);

      const searchTerms = [];
      if (query.trim()) {
        searchTerms.push(query.trim());
      }
      if (ingredientNames.length > 0) {
        searchTerms.push(...ingredientNames);
      }

      const finalQuery = searchTerms.join(' ');

      if (!finalQuery) {
        setError('検索キーワードまたは材料を選択してください');
        return;
      }

      // 実際のYouTube API呼び出し
      const response = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(finalQuery)}`
      );
      const data = await response.json();

      if (response.ok) {
        onResultsChange(data.videos || []);
        if (data.videos && data.videos.length === 0) {
          setError('検索結果が見つかりませんでした');
        }
        onClose(); // 検索成功時にシートを閉じてホームタブに切り替え
      } else {
        throw new Error(data.error || '検索に失敗しました');
      }
    } catch {
      setError('検索に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchRecipes(searchQuery);
  };

  const isAllSelected =
    ingredients.length > 0 &&
    selectedIngredientIds.length === ingredients.length;
  const isPartiallySelected =
    selectedIngredientIds.length > 0 &&
    selectedIngredientIds.length < ingredients.length;

  return (
    <div className="mt-4 min-h-full space-y-8">
      {/* 材料選択セクション */}
      {ingredients.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="ingredients" className="border-none">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-orange-100 p-2">
                    <Utensils className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-800">
                      使用する材料を選択
                    </div>
                    <div className="text-sm text-gray-500">
                      在庫の材料から選んでより具体的に検索
                    </div>
                  </div>
                  {selectedIngredientIds.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-auto border-orange-200 bg-orange-100 text-orange-700"
                    >
                      {selectedIngredientIds.length}個選択中
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-4 pt-2">
                  {/* 全選択 */}
                  <div
                    className="flex h-auto w-full cursor-pointer items-center justify-start space-x-4 rounded-lg border-gray-200 bg-orange-50 p-5 transition-all duration-200 hover:border-gray-300 hover:bg-orange-100"
                    onClick={() => toggleSelectAll()}
                  >
                    <div className="flex h-5 w-5 items-center justify-center">
                      <Checkbox
                        id="select-all"
                        checked={isAllSelected}
                        ref={(el) => {
                          if (el) {
                            const input = el.querySelector('input');
                            if (input) {
                              input.indeterminate = isPartiallySelected;
                            }
                          }
                        }}
                        className="pointer-events-none data-[state=checked]:border-orange-500 data-[state=checked]:bg-orange-500"
                      />
                    </div>
                    <span className="flex-1 text-left font-medium text-gray-700">
                      すべて選択
                    </span>
                    <div className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-500">
                      {ingredients.length}個
                    </div>
                  </div>

                  {/* 個別材料 */}
                  <div className="grid grid-cols-1 gap-3">
                    {ingredients.map((ingredient) => {
                      const isSelected = selectedIngredientIds.includes(
                        ingredient.id
                      );
                      return (
                        <div
                          key={ingredient.id}
                          className={`group flex h-auto w-full cursor-pointer items-center justify-start space-x-4 rounded-lg p-5 transition-all duration-200 ${
                            isSelected
                              ? 'scale-[1.02] border-orange-400 bg-orange-50 shadow-md ring-2 ring-orange-100 hover:bg-orange-50'
                              : 'border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50 hover:shadow-sm'
                          }`}
                          onClick={() =>
                            toggleIngredientSelection(ingredient.id)
                          }
                        >
                          <div className="flex h-5 w-5 items-center justify-center">
                            <Checkbox
                              id={ingredient.id}
                              checked={isSelected}
                              className="pointer-events-none data-[state=checked]:border-orange-500 data-[state=checked]:bg-orange-500"
                            />
                          </div>
                          <span className="flex-1 text-left font-medium text-gray-700 group-hover:text-gray-900">
                            {ingredient.name}
                          </span>
                          <div className="flex items-center gap-2">
                            {ingredient.quantity && ingredient.unit && (
                              <div className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-500">
                                {ingredient.quantity}
                                {ingredient.unit}
                              </div>
                            )}
                            {isSelected && (
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 shadow-sm">
                                <span className="text-sm font-bold text-white">
                                  ✓
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}

      {/* 検索フォーム */}
      <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <div className="mb-3 flex items-center gap-2">
              <div className="rounded-lg bg-orange-100 p-2">
                <Search className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <Label
                  htmlFor="search-input"
                  className="text-lg font-semibold text-gray-800"
                >
                  検索キーワード
                </Label>
                <p className="mt-1 text-sm text-gray-600">
                  料理名、ジャンル、材料名などを入力してください
                </p>
              </div>
            </div>

            <div className="relative">
              <Input
                id="search-input"
                type="text"
                autoFocus={false}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="例：和食、洋食、中華、イタリアン..."
                className="h-12 rounded-xl border-2 border-orange-200 bg-white pr-4 pl-4 text-base shadow-sm transition-all duration-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full transform rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:from-orange-600 hover:to-orange-700 hover:shadow-xl disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                検索中...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                レシピを検索する
              </div>
            )}
          </Button>
        </form>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4">
          <Alert variant="destructive" className="border-none bg-transparent">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
              <AlertDescription className="font-medium text-red-800">
                {error}
              </AlertDescription>
            </div>
          </Alert>
        </div>
      )}
    </div>
  );
}

// 動画カードコンポーネント
function VideoCard({
  video,
  playlists,
  setPlaylists,
  onLoginRequired,
}: VideoCardProps) {
  const [showDescription, setShowDescription] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('');
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const { user } = useAuth();

  const handleSaveClick = () => {
    if (!user) {
      onLoginRequired();
    } else {
      setShowSaveDialog(true);
    }
  };

  const createNewPlaylist = async () => {
    if (!newPlaylistName.trim()) {
      return;
    }
    if (!user) return; // コンポーネントスコープのuserを使用

    try {
      const { data, error } = await supabase
        .from('playlists')
        .insert({
          user_id: user.id,
          name: newPlaylistName,
          description: newPlaylistDescription || null,
        })
        .select();

      if (error) {
        console.error('Error creating playlist from VideoCard:', error);
        return;
      }
      if (data && data.length > 0) {
        const newPlaylist: RecipePlaylist = {
          ...data[0],
          videos: [],
        } as RecipePlaylist;
        setPlaylists((prev) => [...prev, newPlaylist]);
        setSelectedPlaylistId(newPlaylist.id);
        setShowCreatePlaylist(false);
        setNewPlaylistName('');
        setNewPlaylistDescription('');
      }
    } catch (err) {
      console.error('Unexpected error creating playlist:', err);
    }
  };

  const saveToPlaylist = async () => {
    if (!selectedPlaylistId) {
      return;
    }

    if (!user) return; // コンポーネントスコープのuserを使用

    const videoToSave = {
      title: video.title || 'YouTube動画',
      url: `https://www.youtube.com/watch?v=${video.videoId}`,
      thumbnail:
        video.thumbnailUrl ||
        `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`,
      duration: formatDuration(video.duration) || null,
    };

    try {
      // 重複チェックはSupabase側で行うか、事前にフェッチして確認
      const { data: existingVideos, error: fetchError } = await supabase
        .from('videos')
        .select('url')
        .eq('playlist_id', selectedPlaylistId)
        .eq('url', videoToSave.url);

      if (fetchError) {
        console.error('Error checking duplicate video:', fetchError);
        return;
      }

      if (existingVideos && existingVideos.length > 0) {
        alert('この動画はすでにプレイリストに存在します。');
        setShowSaveDialog(false);
        setSelectedPlaylistId('');
        return;
      }

      const { data, error } = await supabase
        .from('videos')
        .insert({
          playlist_id: selectedPlaylistId,
          user_id: user.id, // RLSのためにuser_idも保存
          title: videoToSave.title,
          url: videoToSave.url,
          thumbnail: videoToSave.thumbnail,
          duration: videoToSave.duration,
        })
        .select();

      if (error) {
        console.error('Error saving video to playlist:', error);
        return;
      }

      if (data && data.length > 0) {
        const newVideo = data[0] as RecipeVideo;
        // UIのプレイリストの状態を更新
        setPlaylists((prevPlaylists) =>
          prevPlaylists.map((p) =>
            p.id === selectedPlaylistId
              ? {
                  ...p,
                  videos: [...p.videos, newVideo],
                  updated_at: new Date().toISOString(),
                }
              : p
          )
        );

        // プレイリストのupdated_atをSupabaseでも更新
        const { error: playlistUpdateError } = await supabase
          .from('playlists')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', selectedPlaylistId);

        if (playlistUpdateError) {
          console.error(
            'Error updating playlist timestamp:',
            playlistUpdateError
          );
        }
      }
    } catch (err) {
      console.error('Unexpected error saving video:', err);
    }

    setShowSaveDialog(false);
    setSelectedPlaylistId('');
  };

  const formatDuration = (duration: string | undefined) => {
    if (!duration) return '0:00';

    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return duration;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatViewCount = (count: number | undefined) => {
    if (!count || count === 0) return '0回再生';

    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M回再生`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K回再生`;
    }
    return `${count}回再生`;
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <AspectRatio ratio={16 / 9}>
          {video.thumbnailUrl ? (
            <Image
              src={video.thumbnailUrl}
              alt={`${video.title}のサムネイル画像`}
              fill
              className="object-cover"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R7/2Q=="
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-200">
              <div className="text-center text-gray-400">
                <FileText className="mx-auto mb-2 h-8 w-8" />
                <span className="text-sm">画像なし</span>
              </div>
            </div>
          )}
        </AspectRatio>
        <div className="absolute right-2 bottom-2">
          <Badge variant="secondary" className="bg-black/80 text-white">
            <Clock className="mr-1 h-3 w-3" />
            {formatDuration(video.duration)}
          </Badge>
        </div>
      </div>

      <CardContent className="space-y-3 p-4">
        <div>
          <CardTitle className="mb-2 line-clamp-2 text-base font-medium">
            {video.title || '動画タイトルなし'}
          </CardTitle>
          <div className="text-muted-foreground flex items-center justify-between text-sm">
            <span>{video.channelName || '不明'}</span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {formatViewCount(video.viewCount)}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button asChild size="sm" className="flex-1">
            <a
              href={`https://www.youtube.com/watch?v=${video.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-1 h-3 w-3" />
              YouTube
            </a>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSaveClick}
            className="px-3"
          >
            <Save className="h-3 w-3" />
          </Button>
        </div>

        <Dialog open={showDescription} onOpenChange={setShowDescription}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center hover:bg-orange-50"
            >
              <FileText className="mr-1 h-3 w-3" />
              詳細情報
            </Button>
          </DialogTrigger>
          <ScrollArea className="h-full">
            <DialogContent className="flex max-h-[85vh] w-full max-w-[95vw] flex-col overflow-hidden sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="line-clamp-2 pr-8 text-left text-base font-semibold sm:text-lg">
                  {video.title}
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-hidden">
                  <div className="space-y-4 p-4">
                    <div className="space-y-3">
                      <h4 className="flex items-center gap-2 text-sm font-semibold">
                        <FileText className="h-4 w-4 text-orange-600" />
                        動画の説明
                      </h4>
                      {video.description ? (
                        <div className="rounded-lg border bg-gray-50 p-4">
                          <p className="text-sm leading-relaxed whitespace-pre-line">
                            {video.description}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center rounded-lg border bg-gray-50 p-8">
                          <div className="space-y-2 text-center">
                            <FileText className="mx-auto h-8 w-8 text-gray-400" />
                            <p className="text-muted-foreground text-sm">
                              説明文がありません
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
              </div>
            </DialogContent>
          </ScrollArea>
        </Dialog>

        {/* 保存ダイアログ */}
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Save className="h-5 w-5 text-orange-600" />
                プレイリストに保存
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>保存先のプレイリストを選択</Label>
                {playlists.length === 0 ? (
                  <div className="py-6 text-center text-gray-500">
                    <List className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                    <p className="mb-4">プレイリストがありません</p>
                    <Button
                      onClick={() => setShowCreatePlaylist(true)}
                      className="bg-orange-600 text-white hover:bg-orange-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      新しいプレイリストを作成
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="h-[200px]">
                    <div className="grid gap-2">
                      {playlists.map((playlist) => (
                        <Button
                          key={playlist.id}
                          variant={
                            selectedPlaylistId === playlist.id
                              ? 'default'
                              : 'outline'
                          }
                          onClick={() => setSelectedPlaylistId(playlist.id)}
                          className="w-full justify-start"
                        >
                          {playlist.name} ({playlist.videos.length}本)
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {/* 既存プレイリストがある場合の新規作成ボタン */}
                {playlists.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setShowCreatePlaylist(true)}
                    className="mt-2 w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    新しいプレイリストを作成
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSaveDialog(false)}
                  className="flex-1"
                >
                  キャンセル
                </Button>
                <Button
                  onClick={saveToPlaylist}
                  disabled={!selectedPlaylistId}
                  className="flex-1"
                >
                  保存
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 新しいプレイリスト作成ダイアログ */}
        <Dialog open={showCreatePlaylist} onOpenChange={setShowCreatePlaylist}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>新しいプレイリストを作成</DialogTitle>
              <DialogDescription>
                動画を保存するための新しいプレイリストを作成します。
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newPlaylistName">プレイリスト名</Label>
                <Input
                  id="newPlaylistName"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPlaylistDescription">説明 (任意)</Label>
                <textarea
                  id="newPlaylistDescription"
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  rows={3}
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreatePlaylist(false)}
              >
                キャンセル
              </Button>
              <Button onClick={createNewPlaylist}>作成</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
