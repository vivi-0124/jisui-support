"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import Image from "next/image";
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
} from "lucide-react";
import IngredientsManagement from "@/components/ingredients-management";
import ShoppingList from "@/components/shopping-list";
import RecipeManagement from "@/components/recipe-management";
import { gradientButtonVariants, headerVariants, backgroundVariants, headerButtonVariants, textColorVariants } from "@/lib/theme-variants";

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

interface InventoryItem {
  id: string;
  ingredient_name: string;
  quantity: number;
  unit: string;
  expiration_date?: string;
}

export default function JisuiSupport() {
  const [activeTab, setActiveTab] = useState("home");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<YouTubeVideo[]>([]);

  return (
    <div className={backgroundVariants({ theme: "home" })}>
      {/* Header */}
      <header className={headerVariants({ theme: "home" })}>
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <Home className="w-6 h-6" />
            <h1 className="text-xl font-bold">自炊サポート</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className={headerButtonVariants({ theme: "home" })}>
                  <Search className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-[540px] overflow-y-auto px-4 sm:px-6">
                <RecipeSearchSheet 
                  onResultsChange={setSearchResults} 
                  onClose={() => {
                    setSearchOpen(false);
                    setActiveTab("home"); // 検索後にホームタブに切り替え
                  }} 
                />
              </SheetContent>
            </Sheet>
            <Button variant="ghost" size="sm" className={headerButtonVariants({ theme: "home" })}>
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          {/* Home Tab Content */}
          <TabsContent value="home" className="space-y-8">
            {/* Welcome Section */}
            <div className="text-center space-y-3 pt-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                おかえりなさい！
              </h2>
              <p className={`text-lg ${textColorVariants({ theme: "home" })}`}>今日も自炊を楽しくサポートします</p>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-4 justify-center py-4">
              <Button 
                size="lg" 
                onClick={() => setActiveTab("ingredients")}
                className={gradientButtonVariants({ theme: "ingredients", size: "lg" })}
              >
                <Plus className="w-6 h-6 text-white" />
              </Button>
              <Button 
                size="lg" 
                onClick={() => setActiveTab("shopping")}
                className={gradientButtonVariants({ theme: "shopping", size: "lg" })}
              >
                <ShoppingCart className="w-6 h-6 text-white" />
              </Button>
              <Button 
                size="lg" 
                onClick={() => setActiveTab("recipes")}
                className={gradientButtonVariants({ theme: "recipes", size: "lg" })}
              >
                <BookOpen className="w-6 h-6 text-white" />
              </Button>
            </div>

            {/* 検索結果表示エリア */}
            {searchResults.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    検索結果
                  </h3>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                    {searchResults.length}件見つかりました
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.map((video, index) => (
                    <VideoCard key={`${video.videoId}-${index}`} video={video} />
                  ))}
                </div>
              </section>
            )}
          </TabsContent>

          {/* Other Tab Contents */}
          <TabsContent value="ingredients">
            <IngredientsManagement />
          </TabsContent>

          <TabsContent value="shopping">
            <ShoppingList />
          </TabsContent>

          <TabsContent value="recipes">
            <RecipeManagement />
          </TabsContent>

          {/* Bottom Navigation */}
          <TabsList className="fixed bottom-0 left-0 right-0 grid w-full grid-cols-4 h-16 p-1 bg-white border-t shadow-lg rounded-none">
            <TabsTrigger value="home" className={`flex flex-col items-center gap-1 px-2 py-1 text-xs data-[state=active]:text-gray-600`}>
              <Home className="w-4 h-4" />
              ホーム
            </TabsTrigger>
            <TabsTrigger value="ingredients" className={`flex flex-col items-center gap-1 px-2 py-1 text-xs data-[state=active]:text-green-600`}>
              <Package className="w-4 h-4" />
              材料管理
            </TabsTrigger>
            <TabsTrigger value="shopping" className={`flex flex-col items-center gap-1 px-2 py-1 text-xs data-[state=active]:text-purple-600`}>
              <ShoppingCart className="w-4 h-4" />
              買い物リスト
            </TabsTrigger>
            <TabsTrigger value="recipes" className={`flex flex-col items-center gap-1 px-2 py-1 text-xs data-[state=active]:text-blue-600`}>
              <BookOpen className="w-4 h-4" />
              レシピ管理
            </TabsTrigger>
          </TabsList>

        </Tabs>
      </main>
    </div>
  );
}

// レシピ検索シートコンポーネント
interface RecipeSearchSheetProps {
  onResultsChange: (results: YouTubeVideo[]) => void;
  onClose: () => void;
}

function RecipeSearchSheet({ onResultsChange, onClose }: RecipeSearchSheetProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ingredients, setIngredients] = useState<InventoryItem[]>([]);
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<string[]>([]);

  // 実際の材料データをlocalStorageから取得
  useEffect(() => {
    const savedIngredients = localStorage.getItem("ingredients");
    if (savedIngredients) {
      try {
        const parsedIngredients = JSON.parse(savedIngredients);
        // ingredients-managementコンポーネントの形式からInventoryItem形式に変換
        const convertedIngredients = parsedIngredients.map((ingredient: {
          id: string;
          name: string;
          quantity: number;
          unit: string;
          expiryDate: string;
        }) => ({
          id: ingredient.id,
          ingredient_name: ingredient.name, // name -> ingredient_name
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          expiration_date: ingredient.expiryDate, // expiryDate -> expiration_date
        }));
        setIngredients(convertedIngredients);
      } catch (error) {
        console.error("材料データの読み込みに失敗しました:", error);
        setIngredients([]);
      }
    } else {
      setIngredients([]);
    }
  }, []);

  const toggleIngredientSelection = (ingredientId: string) => {
    setSelectedIngredientIds(prev =>
      prev.includes(ingredientId)
        ? prev.filter(id => id !== ingredientId)
        : [...prev, ingredientId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIngredientIds.length === ingredients.length) {
      setSelectedIngredientIds([]);
    } else {
      setSelectedIngredientIds(ingredients.map(ing => ing.id));
    }
  };

  const getSelectedIngredients = () => {
    return ingredients.filter(ing => selectedIngredientIds.includes(ing.id));
  };

  const searchRecipes = async (query: string) => {
    setLoading(true);
    setError("");

    try {
      const selectedIngredients = getSelectedIngredients();
      const ingredientNames = selectedIngredients.map(ing => ing.ingredient_name);
      
      const searchTerms = [];
      if (query.trim()) {
        searchTerms.push(query.trim());
      }
      if (ingredientNames.length > 0) {
        searchTerms.push(...ingredientNames);
      }

      const finalQuery = searchTerms.join(" ");

      if (!finalQuery) {
        setError("検索キーワードまたは材料を選択してください");
        return;
      }

             // 実際のYouTube API呼び出し
       const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(finalQuery)}`);
       const data = await response.json();

              if (response.ok) {
         onResultsChange(data.videos || []);
         if (data.videos && data.videos.length === 0) {
           setError("検索結果が見つかりませんでした");
         }
         onClose(); // 検索成功時にシートを閉じてホームタブに切り替え
       } else {
         throw new Error(data.error || "検索に失敗しました");
       }
      
    } catch {
      setError("検索に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchRecipes(searchQuery);
  };

  const isAllSelected = ingredients.length > 0 && selectedIngredientIds.length === ingredients.length;
  const isPartiallySelected = selectedIngredientIds.length > 0 && selectedIngredientIds.length < ingredients.length;

  return (
    <div className="space-y-8 mt-10">
      {/* 検索フォーム */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Search className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <Label htmlFor="search-input" className="text-lg font-semibold text-gray-800">
                  検索キーワード
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  料理名、ジャンル、材料名などを入力してください
                </p>
              </div>
            </div>
            
            <div className="relative">
              <Input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="例：和食、洋食、中華、イタリアン..."
                className="h-12 pl-4 pr-4 text-base bg-white border-2 border-green-200 rounded-xl focus:border-green-400 focus:ring-4 focus:ring-green-100 transition-all duration-200 shadow-sm"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
          
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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

      {/* 材料選択セクション */}
      {ingredients.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="ingredients" className="border-none">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Utensils className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-800">使用する材料を選択</div>
                    <div className="text-sm text-gray-500">在庫の材料から選んでより具体的に検索</div>
                  </div>
                  {selectedIngredientIds.length > 0 && (
                    <Badge variant="secondary" className="ml-auto bg-green-100 text-green-700 border-green-200">
                      {selectedIngredientIds.length}個選択中
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-4 pt-2">
                  {/* 全選択 */}
                  <div 
                    className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => toggleSelectAll()}
                  >
                    <Checkbox
                      id="select-all"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) {
                          const input = el.querySelector("input");
                          if (input) {
                            input.indeterminate = isPartiallySelected;
                          }
                        }
                      }}
                      className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                    />
                    <Label htmlFor="select-all" className="cursor-pointer flex-1 font-medium text-gray-700">
                      すべて選択
                    </Label>
                  </div>

                  {/* 個別材料 */}
                  <div className="grid grid-cols-1 gap-3">
                    {ingredients.map((ingredient) => {
                      const isSelected = selectedIngredientIds.includes(ingredient.id);
                      return (
                        <div
                          key={ingredient.id}
                          className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                            isSelected 
                              ? "border-green-300 bg-green-50 shadow-sm scale-[1.02]" 
                              : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                          }`}
                          onClick={() => toggleIngredientSelection(ingredient.id)}
                        >
                          <Checkbox
                            id={ingredient.id}
                            checked={isSelected}
                            className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                          />
                          <Label htmlFor={ingredient.id} className="cursor-pointer flex-1 font-medium text-gray-700">
                            {ingredient.ingredient_name}
                          </Label>
                          {isSelected && (
                            <div className="flex items-center justify-center w-6 h-6 bg-green-500 rounded-full">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
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

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
          <Alert variant="destructive" className="border-none bg-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
              <AlertDescription className="text-red-800 font-medium">
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
interface VideoCardProps {
  video: YouTubeVideo;
}

function VideoCard({ video }: VideoCardProps) {
  const [showDescription, setShowDescription] = useState(false);

  const formatDuration = (duration: string | undefined) => {
    if (!duration) return "0:00";

    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return duration;

    const hours = parseInt(match[1] || "0");
    const minutes = parseInt(match[2] || "0");
    const seconds = parseInt(match[3] || "0");

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatViewCount = (count: number | undefined) => {
    if (!count || count === 0) return "0回再生";

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
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <div className="text-gray-400 text-center">
                <FileText className="h-8 w-8 mx-auto mb-2" />
                <span className="text-sm">画像なし</span>
              </div>
            </div>
          )}
        </AspectRatio>
        <div className="absolute bottom-2 right-2">
          <Badge variant="secondary" className="bg-black/80 text-white">
            <Clock className="h-3 w-3 mr-1" />
            {formatDuration(video.duration)}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <div>
          <CardTitle className="text-base font-medium line-clamp-2 mb-2">
            {video.title || "動画タイトルなし"}
          </CardTitle>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{video.channelName || "不明"}</span>
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
              <ExternalLink className="h-3 w-3 mr-1" />
              YouTube
            </a>
          </Button>
        </div>

        <Dialog open={showDescription} onOpenChange={setShowDescription}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-center hover:bg-green-50">
              <FileText className="h-3 w-3 mr-1" />
              詳細情報
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] w-full sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg font-semibold line-clamp-2 text-left pr-8">
                {video.title}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4 text-green-600" />
                      動画の説明
                    </h4>
                    {video.description ? (
                      <div className="border rounded-lg bg-gray-50 p-4">
                        <p className="text-sm leading-relaxed whitespace-pre-line">
                          {video.description}
                        </p>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-8 bg-gray-50 flex items-center justify-center">
                        <div className="text-center space-y-2">
                          <FileText className="h-8 w-8 text-gray-400 mx-auto" />
                          <p className="text-sm text-muted-foreground">説明文がありません</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
