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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Plus,
  List,
  Trash2,
  Edit,
  MoreVertical,
  Clock,
  Video,
  ShoppingCart,
  Download,
  Loader2,
  Package,
  AlertCircle,
  Eye,
  Check,
  AlertTriangle,
} from 'lucide-react';
import {
  buttonVariants,
  iconColorVariants,
  cardVariants,
} from '@/lib/theme-variants';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// 定数配列をコンポーネント外に移動
const CATEGORIES = [
  '野菜',
  '肉類',
  '魚介類',
  '乳製品',
  '調味料',
  '冷凍食品',
  'その他',
];

const UNITS = [
  '個',
  'g',
  'kg',
  'ml',
  'L',
  '本',
  '枚',
  '袋',
  'パック',
  '大さじ',
  '小さじ',
  'カップ',
  'cc',
  '少々',
  '適量',
];

export interface Video {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration?: string;
  added_at: string;
}

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  videos: Video[];
  created_at: string;
  updated_at: string;
}

interface RecipeManagementProps {
  playlists: Playlist[];
  setPlaylists: React.Dispatch<React.SetStateAction<Playlist[]>>;
  onAddToShoppingList: (
    ingredients: {
      name: string;
      category: string;
      quantity: number;
      unit: string;
      notes?: string;
    }[]
  ) => void;
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
    | 'description'
    | 'database';
}

interface AddPlaylistButtonProps {
  onSave: (
    playlist: Omit<Playlist, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => void;
  editingPlaylist?: Playlist | null;
  onEditComplete?: () => void;
  children: React.ReactNode;
}

function AddPlaylistButton({
  onSave,
  editingPlaylist,
  onEditComplete,
  children,
}: AddPlaylistButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState<
    Omit<Playlist, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  >({
    name: '',
    description: null,
    videos: [],
  });

  useEffect(() => {
    if (editingPlaylist) {
      setNewPlaylist({
        name: editingPlaylist.name,
        description: editingPlaylist.description,
        videos: editingPlaylist.videos,
      });
      setIsDialogOpen(true);
    }
  }, [editingPlaylist]);

  const handleSavePlaylist = () => {
    if (!newPlaylist.name.trim()) {
      alert('プレイリスト名を入力してください');
      return;
    }

    onSave(newPlaylist);
    handleCloseDialog();
    if (editingPlaylist && onEditComplete) {
      onEditComplete();
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
    if (editingPlaylist && onEditComplete) {
      onEditComplete();
    }
  };

  const resetForm = () => {
    setNewPlaylist({
      name: '',
      description: null,
      videos: [],
    });
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="mx-4 w-[calc(100vw-2rem)] max-w-md rounded-lg sm:mx-auto sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {editingPlaylist
              ? 'プレイリストを編集'
              : '新しいプレイリストを作成'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            プレイリストの詳細情報を入力してください。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              プレイリスト名 *
            </Label>
            <Input
              id="name"
              value={newPlaylist.name}
              onChange={(e) =>
                setNewPlaylist({ ...newPlaylist, name: e.target.value })
              }
              placeholder="例: お気に入りの料理動画"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              説明
            </Label>
            <textarea
              id="description"
              value={newPlaylist.description || ''}
              onChange={(e) =>
                setNewPlaylist({ ...newPlaylist, description: e.target.value })
              }
              placeholder="プレイリストの説明を入力してください"
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleCloseDialog}
            className="w-full sm:w-auto"
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSavePlaylist}
            className={`w-full sm:w-auto ${buttonVariants({ theme: 'recipes' })}`}
          >
            {editingPlaylist ? '更新' : '作成'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AddVideoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVideo: (video: Omit<Video, 'id' | 'added_at'>) => void;
}

function AddVideoDialog({ isOpen, onClose, onAddVideo }: AddVideoDialogProps) {
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const extractVideoId = (url: string) => {
    const regex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const fetchVideoInfo = async (url: string) => {
    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new Error('有効なYouTube URLを入力してください');
    }

    try {
      const response = await fetch(`/api/youtube/search?videoId=${videoId}`);
      if (!response.ok) {
        throw new Error('動画情報の取得に失敗しました');
      }
      const data = await response.json();
      return data;
    } catch {
      // APIが利用できない場合のフォールバック
      return {
        title: videoTitle || 'YouTube動画',
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        duration: '不明',
      };
    }
  };

  const handleAddVideo = async () => {
    if (!videoUrl.trim()) {
      alert('YouTube URLを入力してください');
      return;
    }

    setIsLoading(true);
    try {
      const videoInfo = await fetchVideoInfo(videoUrl);
      onAddVideo({
        title: videoInfo.title,
        url: videoUrl,
        thumbnail: videoInfo.thumbnail,
        duration: videoInfo.duration,
      });
      setVideoUrl('');
      setVideoTitle('');
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="mx-4 w-[calc(100vw-2rem)] max-w-md rounded-lg sm:mx-auto sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-lg">動画を追加</DialogTitle>
          <DialogDescription className="text-sm">
            YouTube URLを入力して動画をプレイリストに追加してください。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="videoUrl" className="text-sm font-medium">
              YouTube URL *
            </Label>
            <Input
              id="videoUrl"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="videoTitle" className="text-sm font-medium">
              動画タイトル（オプション）
            </Label>
            <Input
              id="videoTitle"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="動画のタイトルを入力"
              className="h-11"
            />
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            キャンセル
          </Button>
          <Button
            onClick={handleAddVideo}
            disabled={isLoading}
            className={`w-full sm:w-auto ${buttonVariants({ theme: 'recipes' })}`}
          >
            {isLoading ? '追加中...' : '追加'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AddToShoppingListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  extractedRecipe: ExtractedRecipe | null;
  onAddToShoppingList: (
    ingredients: {
      name: string;
      category: string;
      quantity: number;
      unit: string;
      notes?: string;
    }[]
  ) => void;
}

// 材料解析ロジックを共通化
const parseIngredient = (
  ingredient: string
): { name: string; quantity: number; unit: string } => {
  const unitRegex = UNITS.join('|');
  // Handle full-width numbers and fractions
  const quantityRegex = `([\\d０-９\\.\\/\\-〜～]+)`;

  // Normalize full-width characters to half-width
  const normalizedIngredient = ingredient
    .replace(/[０-９．／〜～]/g, (s) => {
      return String.fromCharCode(s.charCodeAt(0) - 0xfee0);
    })
    .replace('〜', '-')
    .replace('～', '-');

  // 1. 「名前 数量 単位」のパターン (e.g., "豚バラ肉 100 g")
  let match = normalizedIngredient.match(
    new RegExp(`^(.*?)\\s*${quantityRegex}\\s*(${unitRegex})$`)
  );
  if (match) {
    const name = match[1].trim();
    const quantityStr = match[2];
    const unit = match[3];
    let quantity = 1;

    if (quantityStr.includes('/')) {
      const parts = quantityStr.split('/');
      quantity = parseInt(parts[0], 10) / parseInt(parts[1], 10);
    } else if (quantityStr.includes('-')) {
      const parts = quantityStr.split('-');
      quantity = parseFloat(parts[1]); // Use the upper bound of a range
    } else {
      quantity = parseFloat(quantityStr);
    }
    return { name, quantity: isNaN(quantity) ? 1 : quantity, unit };
  }

  // 2. 「名前 単位」（少々・適量など）のパターン
  match = normalizedIngredient.match(new RegExp(`^(.*?)\\s*(${unitRegex})$`));
  if (match) {
    const name = match[1].trim();
    const unit = match[2];
    if (unit === '少々' || unit === '適量') {
      return { name, quantity: 1, unit };
    }
  }

  // 3. 「名前 数量」 (単位なし) のパターン (e.g., "卵 1")
  match = normalizedIngredient.match(new RegExp(`^(.*?)\\s*${quantityRegex}$`));
  if (match) {
    const name = match[1].trim();
    const quantityStr = match[2];
    let quantity = 1;
    if (quantityStr.includes('/')) {
      const parts = quantityStr.split('/');
      quantity = parseInt(parts[0], 10) / parseInt(parts[1], 10);
    } else if (quantityStr.includes('-')) {
      const parts = quantityStr.split('-');
      quantity = parseFloat(parts[1]);
    } else {
      quantity = parseFloat(quantityStr);
    }
    return { name, quantity: isNaN(quantity) ? 1 : quantity, unit: '個' };
  }

  // マッチしない場合は、元の文字列を名前として返す
  return { name: ingredient.trim(), quantity: 1, unit: '個' };
};

function AddToShoppingListDialog({
  isOpen,
  onClose,
  extractedRecipe,
  onAddToShoppingList,
}: AddToShoppingListDialogProps) {
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [ingredientDetails, setIngredientDetails] = useState<
    Record<
      string,
      {
        name: string;
        category: string;
        quantity: number;
        unit: string;
        notes: string;
      }
    >
  >({});

  const allIngredientsSelected =
    extractedRecipe &&
    selectedIngredients.length === extractedRecipe.ingredients.length;

  const handleToggleSelectAll = () => {
    if (!extractedRecipe) return;
    if (allIngredientsSelected) {
      setSelectedIngredients([]);
    } else {
      setSelectedIngredients(
        extractedRecipe.ingredients.map((_, index) => `ingredient-${index}`)
      );
    }
  };

  useEffect(() => {
    if (extractedRecipe && isOpen) {
      // 初期化
      setSelectedIngredients([]);
      const initialDetails: Record<
        string,
        {
          name: string;
          category: string;
          quantity: number;
          unit: string;
          notes: string;
        }
      > = {};

      extractedRecipe.ingredients.forEach((ingredient, index) => {
        const ingredientId = `ingredient-${index}`;
        const parsed = parseIngredient(ingredient);

        // カテゴリの推測
        let category = 'その他';
        const lowerName = parsed.name.toLowerCase();
        // 乳製品を最初にチェック（牛乳の「牛」が肉類に誤分類されないように）
        if (
          lowerName.includes('牛乳') ||
          lowerName.includes('チーズ') ||
          lowerName.includes('バター') ||
          lowerName.includes('ヨーグルト')
        ) {
          category = '乳製品';
        } else if (
          lowerName.includes('肉') ||
          lowerName.includes('豚') ||
          lowerName.includes('牛') ||
          lowerName.includes('鶏')
        ) {
          category = '肉類';
        } else if (
          lowerName.includes('魚') ||
          lowerName.includes('海老') ||
          lowerName.includes('蟹') ||
          lowerName.includes('えび') ||
          lowerName.includes('かに') ||
          lowerName.includes('鮭') ||
          lowerName.includes('さけ') ||
          lowerName.includes('まぐろ') ||
          lowerName.includes('あじ') ||
          lowerName.includes('さば')
        ) {
          category = '魚介類';
        } else if (
          // 基本的な調味料
          lowerName.includes('醤油') ||
          lowerName.includes('味噌') ||
          lowerName.includes('塩') ||
          lowerName.includes('砂糖') ||
          lowerName.includes('みりん') ||
          lowerName.includes('酒') ||
          
          // 酢類
          lowerName.includes('酢') ||
          lowerName.includes('ポン酢') ||
          
          // 油類
          lowerName.includes('油') ||
          lowerName.includes('オイル') ||
          
          // 胡椒・スパイス類
          lowerName.includes('コショウ') ||
          lowerName.includes('胡椒') ||
          lowerName.includes('こしょう') ||
          lowerName.includes('スパイス') ||
          lowerName.includes('ハーブ') ||
          
          // 一般的な調味料
          lowerName.includes('マヨネーズ') ||
          lowerName.includes('ケチャップ') ||
          lowerName.includes('ソース') ||
          
          // だし・出汁類
          lowerName.includes('だし') ||
          lowerName.includes('出汁') ||
          
          // アルコール調味料
          lowerName.includes('ワイン') ||
          lowerName.includes('料理酒') ||
          
          // 日本の調味料
          lowerName.includes('めんつゆ') ||
          lowerName.includes('たれ') ||
          lowerName.includes('ドレッシング') ||
          
          // 薬味・香味野菜（調味料として使用）
          lowerName.includes('にんにく') ||
          lowerName.includes('ニンニク') ||
          lowerName.includes('しょうが') ||
          lowerName.includes('生姜') ||
          
          // 和の調味料
          lowerName.includes('わさび') ||
          lowerName.includes('からし') ||
          lowerName.includes('山椒') ||
          
          // 辛味調味料
          lowerName.includes('唐辛子') ||
          lowerName.includes('豆板醤') ||
          lowerName.includes('コチュジャン') ||
          
          // アジア系調味料
          lowerName.includes('オイスターソース') ||
          lowerName.includes('ナンプラー') ||
          
          // 甘味調味料
          lowerName.includes('はちみつ') ||
          lowerName.includes('蜂蜜') ||
          lowerName.includes('シロップ')
        ) {
          category = '調味料';
        } else if (
          lowerName.includes('玉ねぎ') ||
          lowerName.includes('にんじん') ||
          lowerName.includes('じゃがいも') ||
          lowerName.includes('トマト') ||
          lowerName.includes('きゅうり') ||
          lowerName.includes('レタス') ||
          lowerName.includes('キャベツ')
        ) {
          category = '野菜';
        }

        initialDetails[ingredientId] = {
          name: parsed.name,
          category,
          quantity: parsed.quantity,
          unit: parsed.unit,
          notes: '',
        };
      });

      setIngredientDetails(initialDetails);
    }
  }, [extractedRecipe, isOpen]);

  const handleIngredientToggle = (ingredientId: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(ingredientId)
        ? prev.filter((id) => id !== ingredientId)
        : [...prev, ingredientId]
    );
  };

  const handleDetailChange = (
    ingredientId: string,
    field: string,
    value: string | number
  ) => {
    setIngredientDetails((prev) => ({
      ...prev,
      [ingredientId]: {
        ...prev[ingredientId],
        [field]: value,
      },
    }));
  };

  const handleAddToShoppingList = () => {
    if (selectedIngredients.length === 0) {
      alert('追加する材料を選択してください');
      return;
    }

    const ingredientsToAdd = selectedIngredients.map((ingredientId) => {
      const details = ingredientDetails[ingredientId];
      return {
        name: details.name,
        category: details.category,
        quantity: details.quantity,
        unit: details.unit,
        notes: details.notes || undefined,
      };
    });

    onAddToShoppingList(ingredientsToAdd);
    onClose();
  };

  if (!extractedRecipe) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="mx-4 flex h-[90vh] w-[calc(100vw-2rem)] max-w-2xl flex-col overflow-hidden rounded-lg sm:mx-auto sm:max-h-[90vh] sm:w-full">
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ShoppingCart className="h-5 w-5 text-purple-600" />
            買い物リストに追加
          </DialogTitle>
          <DialogDescription className="text-sm">
            レシピから必要な材料を買い物リストに追加します
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4">
            {/* レシピ情報 */}
            <div className="rounded-lg bg-blue-50 p-3">
              <h4 className="text-sm font-semibold">{extractedRecipe.title}</h4>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                {extractedRecipe.cookingTime && (
                  <span>⏱️ {extractedRecipe.cookingTime}</span>
                )}
              </div>
            </div>

            {/* 選択状況 */}
            <div className="flex items-center justify-between rounded-lg bg-purple-50 p-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">材料を選択</span>
                {extractedRecipe && extractedRecipe.ingredients.length > 0 && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={handleToggleSelectAll}
                    className="p-0 text-sm h-auto font-medium text-purple-600 hover:text-purple-800"
                  >
                    {allIngredientsSelected ? '全選択を解除' : 'すべて選択'}
                  </Button>
                )}
              </div>
              <Badge variant="secondary" className="text-xs">
                {selectedIngredients.length}/
                {extractedRecipe.ingredients.length}個選択中
              </Badge>
            </div>

            {/* 材料リスト */}
            <div className="space-y-3">
              {extractedRecipe.ingredients.map((ingredient, index) => {
                const ingredientId = `ingredient-${index}`;
                const isSelected = selectedIngredients.includes(ingredientId);
                const details = ingredientDetails[ingredientId] || {
                  name: ingredient, // フォールバック
                  category: 'その他',
                  quantity: 1,
                  unit: '個',
                  notes: '',
                };

                return (
                  <div
                    key={ingredientId}
                    className={`rounded-lg border p-3 transition-all ${
                      isSelected
                        ? 'border-purple-300 bg-purple-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* 材料選択 */}
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() =>
                            handleIngredientToggle(ingredientId)
                          }
                          className="mt-1 data-[state=checked]:border-purple-500 data-[state=checked]:bg-purple-500"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium break-words">
                            {details.name}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            元の表記: {ingredient}
                          </div>
                        </div>
                      </div>

                      {/* 詳細設定 */}
                      {isSelected && (
                        <div className="ml-6 space-y-3 border-t border-purple-200 pt-3">
                          {/* カテゴリ */}
                          <div>
                            <Label className="text-xs font-medium">
                              カテゴリ
                            </Label>
                            <select
                              value={details.category}
                              onChange={(e) =>
                                handleDetailChange(
                                  ingredientId,
                                  'category',
                                  e.target.value
                                )
                              }
                              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                            >
                              {CATEGORIES.map((category) => (
                                <option key={category} value={category}>
                                  {category}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* 数量と単位 */}
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div>
                              <Label className="text-xs font-medium">
                                数量
                              </Label>
                              <Input
                                type="number"
                                min="0.1"
                                step="0.1"
                                value={details.quantity}
                                onChange={(e) =>
                                  handleDetailChange(
                                    ingredientId,
                                    'quantity',
                                    parseFloat(e.target.value) || 1
                                  )
                                }
                                className="mt-1 h-9 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium">
                                単位
                              </Label>
                              <select
                                value={details.unit}
                                onChange={(e) =>
                                  handleDetailChange(
                                    ingredientId,
                                    'unit',
                                    e.target.value
                                  )
                                }
                                className="mt-1 h-9 w-full rounded-md border border-gray-300 px-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                              >
                                {UNITS.map((unit) => (
                                  <option key={unit} value={unit}>
                                    {unit}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* メモ */}
                          <div>
                            <Label className="text-xs font-medium">メモ</Label>
                            <Input
                              value={details.notes}
                              onChange={(e) =>
                                handleDetailChange(
                                  ingredientId,
                                  'notes',
                                  e.target.value
                                )
                              }
                              placeholder="例: 低脂肪、有機栽培"
                              className="mt-1 h-9 text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 flex-col gap-2 border-t pt-4 sm:flex-row">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            キャンセル
          </Button>
          <Button
            onClick={handleAddToShoppingList}
            disabled={selectedIngredients.length === 0}
            className={`w-full sm:w-auto ${buttonVariants({ theme: 'shopping' })}`}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            買い物リストに追加 ({selectedIngredients.length}個)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function RecipeManagement({
  playlists,
  setPlaylists,
  onAddToShoppingList,
}: RecipeManagementProps) {
  const { user } = useAuth();
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [isAddVideoDialogOpen, setIsAddVideoDialogOpen] = useState(false);
  const [showRecipeDialog, setShowRecipeDialog] = useState(false);
  const [showShoppingDialog, setShowShoppingDialog] = useState(false);
  const [extractedRecipe, setExtractedRecipe] =
    useState<ExtractedRecipe | null>(null);
  const [loadingVideoId, setLoadingVideoId] = useState<string | null>(null);
  const [extractedVideoIds, setExtractedVideoIds] = useState<Set<string>>(new Set());
  const [errorDialog, setErrorDialog] = useState<{
    open: boolean;
    message: string;
  }>({ open: false, message: '' });

  const getExtractionMethodText = (
    method: ExtractedRecipe['extractionMethod'] | undefined
  ) => {
    switch (method) {
      case 'gemini_video_analysis':
        return 'AI動画分析';
      case 'gemini_text_analysis':
        return 'AIテキスト分析';
      case 'database':
        return 'データベースから取得';
      case 'description':
        return '説明文から抽出';
      default:
        return '不明';
    }
  };

  useEffect(() => {
    const fetchExtractedRecipes = async () => {
      if (!user) return;

      // プレイリストがまだロードされていない場合はスキップ
      const allVideoIds = playlists.flatMap((p) => p.videos.map((v) => v.id));
      if (allVideoIds.length === 0) return;

      const { data, error } = await supabase
        .from('extracted_recipes')
        .select('video_id')
        .eq('user_id', user.id)
        .in('video_id', allVideoIds.map((id) => id));

      if (!error && data) {
        setExtractedVideoIds(new Set(data.map((d: { video_id: string }) => d.video_id)));
      }
    };

    fetchExtractedRecipes();
    
  }, [user, playlists]);

  const handleSavePlaylist = async (
    playlistData: Omit<Playlist, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => {
    if (!user) return;

    if (editingPlaylist) {
      // Update existing playlist
      const { data, error } = await supabase
        .from('playlists')
        .update({
          name: playlistData.name,
          description: playlistData.description,
        })
        .eq('id', editingPlaylist.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating playlist:', error);
      } else {
        setPlaylists(
          playlists.map((p) => (p.id === data.id ? { ...p, ...data } : p))
        );
      }
    } else {
      // Create new playlist
      const { data, error } = await supabase
        .from('playlists')
        .insert([{ ...playlistData, user_id: user.id }])
        .select()
        .single();

      if (error) {
        console.error('Error creating playlist:', error);
      } else {
        setPlaylists([...playlists, { ...data, videos: [] }]);
      }
    }
    setEditingPlaylist(null);
  };

  const handleDeletePlaylist = async (id: string) => {
    if (!user) return;

    if (
      confirm('このプレイリストを削除しますか？（関連する動画も削除されます）')
    ) {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting playlist:', error);
      } else {
        setPlaylists(playlists.filter((p) => p.id !== id));
      }
    }
  };

  const handleEditPlaylist = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
  };

  const handleEditComplete = () => {
    setEditingPlaylist(null);
  };

  const handleAddVideo = async (videoData: Omit<Video, 'id' | 'added_at'>) => {
    if (!activePlaylistId || !user) return;

    const { data, error } = await supabase
      .from('videos')
      .insert([
        {
          playlist_id: activePlaylistId,
          user_id: user.id,
          title: videoData.title,
          url: videoData.url,
          thumbnail: videoData.thumbnail,
          duration: videoData.duration,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error adding video to playlist:', error);
    } else {
      const newVideo = {
        id: data.id,
        title: data.title,
        url: data.url,
        thumbnail: data.thumbnail,
        duration: data.duration,
        added_at: data.created_at,
      };

      setPlaylists(
        playlists.map((p) =>
          p.id === activePlaylistId
            ? { ...p, videos: [...p.videos, newVideo] }
            : p
        )
      );
    }
  };

  const handleDeleteVideo = async (playlistId: string, videoId: string) => {
    const { error } = await supabase.from('videos').delete().eq('id', videoId);

    if (error) {
      console.error('Error deleting video:', error);
    } else {
      setPlaylists(
        playlists.map((p) =>
          p.id === playlistId
            ? { ...p, videos: p.videos.filter((v) => v.id !== videoId) }
            : p
        )
      );
    }
  };

  const handleExtractRecipe = async (video: Video) => {
    // 対象動画のロード状態を設定
    setLoadingVideoId(video.id);
    setErrorDialog({ open: false, message: '' });
    try {
      // YouTube URLから動画IDを抽出
      const videoId = extractVideoId(video.url);
      if (!videoId) {
        throw new Error('動画IDの抽出に失敗しました');
      }

      const response = await fetch(
        `/api/youtube/extract-recipe?videoId=${videoId}`
      );
      const data = await response.json();

      if (response.ok) {
        setExtractedRecipe(data.recipe);
        setShowRecipeDialog(true);

        // 抽出済みリストに追加
        setExtractedVideoIds((prev) => new Set(prev).add(video.id));
      } else {
        setErrorDialog({
          open: true,
          message: data.error || 'レシピの抽出に失敗しました',
        });
      }
    } catch (error) {
      console.error('Recipe extraction error:', error);
      setErrorDialog({
        open: true,
        message: 'レシピの抽出中にエラーが発生しました',
      });
    } finally {
      // ロード状態をリセット
      setLoadingVideoId(null);
    }
  };

  const extractVideoId = (url: string): string | null => {
    const regex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleAddToShoppingListInternal = (
    ingredients: {
      name: string;
      category: string;
      quantity: number;
      unit: string;
      notes?: string;
    }[]
  ) => {
    onAddToShoppingList(ingredients);
    setShowShoppingDialog(false);
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー統計 */}
      <div className="flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <List className={iconColorVariants({ theme: 'recipes' })} />
          <span>プレイリスト {playlists.length}個</span>
        </div>
        <div className="flex items-center gap-1">
          <Video className="h-4 w-4 text-blue-600" />
          <span>
            動画{' '}
            {playlists.reduce(
              (total, playlist) => total + playlist.videos.length,
              0
            )}
            本
          </span>
        </div>
      </div>

      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">レシピ管理</h2>
        {playlists.length > 0 && (
          <AddPlaylistButton
            onSave={handleSavePlaylist}
            editingPlaylist={editingPlaylist}
            onEditComplete={handleEditComplete}
          >
            <Button className={buttonVariants({ theme: 'recipes' })}>
              <Plus className="mr-2 h-4 w-4" />
              プレイリスト作成
            </Button>
          </AddPlaylistButton>
        )}
      </div>

      {/* プレイリスト一覧 */}
      <div className="grid gap-4">
        {playlists.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              {user ? (
                <>
                  <Video className="mx-auto mb-4 h-16 w-16 text-blue-300" />
                  <h3 className="mb-2 text-lg font-semibold">
                  プレイリストがありません
                  </h3>
                  <p className="mb-4 text-gray-600">
                    最初のプレイリストを作成してレシピを整理しましょう
                  </p>
                  <AddPlaylistButton
                    onSave={handleSavePlaylist}
                    editingPlaylist={editingPlaylist}
                    onEditComplete={handleEditComplete}
                  >
                    <Button
                      className={`${buttonVariants({ theme: 'recipes' })}`}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      プレイリスト作成
                    </Button>
                  </AddPlaylistButton>
                </>
              ) : (
                <>
                  <Video className="mx-auto mb-4 h-16 w-16 text-blue-300" />
                  <h3 className="mb-2 text-lg font-semibold">
                    プレイリストがありません
                  </h3>
                  <p className="mb-4 text-gray-600">
                    ログインしてレシピを管理しましょう
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <Accordion type="single" collapsible className="space-y-3">
            {playlists.map((playlist) => (
              <AccordionItem
                key={playlist.id}
                value={playlist.id}
                className="border-0"
              >
                <Card className={cardVariants({ theme: 'recipes' })}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <AccordionTrigger className="p-0 hover:no-underline [&>svg]:h-4 [&>svg]:w-4">
                          <div className="flex flex-col items-start gap-2 text-left">
                            <CardTitle className="text-base sm:text-lg">
                              {playlist.name}
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 sm:gap-4 sm:text-sm">
                              <span>{playlist.videos.length}本の動画</span>
                              <span>
                                作成日:{' '}
                                {new Date(
                                  playlist.created_at
                                ).toLocaleDateString('ja-JP')}
                              </span>
                            </div>
                          </div>
                        </AccordionTrigger>
                      </div>
                      <div className="flex items-center gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={() => handleEditPlaylist(playlist)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              編集
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setActivePlaylistId(playlist.id);
                                setIsAddVideoDialogOpen(true);
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              動画追加
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeletePlaylist(playlist.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              削除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    {playlist.description && (
                      <p className="mt-2 text-xs text-gray-600 sm:text-sm">
                        {playlist.description}
                      </p>
                    )}
                  </CardHeader>
                  <AccordionContent>
                    <CardContent className="pt-0">
                      {playlist.videos.length === 0 ? (
                        <div className="py-6 text-center text-gray-500 sm:py-8">
                          <Video className="mx-auto mb-3 h-8 w-8 text-gray-300 sm:h-12 sm:w-12" />
                          <p className="mb-4 text-sm">動画がありません</p>
                          <Button
                            onClick={() => {
                              setActivePlaylistId(playlist.id);
                              setIsAddVideoDialogOpen(true);
                            }}
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            動画を追加
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {playlist.videos.map((video, index) => (
                            <div
                              key={video.id}
                              className="flex items-start gap-3 rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                            >
                              {/* 番号 */}
                              <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-100 font-mono text-xs text-blue-600 sm:h-8 sm:w-8 sm:text-sm">
                                {index + 1}
                              </div>

                              {/* サムネイル */}
                              <a
                                href={video.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative block h-12 w-20 flex-shrink-0 sm:h-14 sm:w-24"
                              >
                                <Image
                                  src={video.thumbnail}
                                  alt={video.title}
                                  width={96}
                                  height={56}
                                  className="rounded object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src =
                                      '/placeholder-video.png';
                                  }}
                                />
                              </a>

                              {/* 動画情報 */}
                              <div className="min-w-0 flex-1">
                                <h4 className="line-clamp-2 text-xs font-medium sm:text-sm">
                                  {video.title}
                                </h4>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{video.duration}</span>
                                  </div>
                                  <span>•</span>
                                  <span>
                                    追加日:{' '}
                                    {new Date(
                                      video.added_at
                                    ).toLocaleDateString('ja-JP')}
                                  </span>
                                </div>
                              </div>

                              {/* アクションボタン */}
                              <div className="flex flex-col gap-1 sm:flex-row">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleExtractRecipe(video)}
                                  // 他の動画が抽出中の場合はボタンを無効化
                                  disabled={loadingVideoId !== null}
                                  className="h-8 w-8 p-0 text-green-600 hover:bg-green-50 sm:h-auto sm:w-auto sm:px-2"
                                >
                                  {loadingVideoId === video.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin sm:h-4 sm:w-4" />
                                  ) : extractedVideoIds.has(video.id) ? (
                                    <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                  ) : (
                                    <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                                  )}
                                  <span className="sr-only sm:not-sr-only sm:ml-1">
                                    {extractedVideoIds.has(video.id) ? 'レシピ表示' : 'レシピ取得'}
                                  </span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleDeleteVideo(playlist.id, video.id)
                                  }
                                  className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700 sm:h-auto sm:w-auto sm:px-2"
                                >
                                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="sr-only">削除</span>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* ダイアログ */}
      <AddVideoDialog
        isOpen={isAddVideoDialogOpen}
        onClose={() => setIsAddVideoDialogOpen(false)}
        onAddVideo={handleAddVideo}
      />

      {/* レシピ表示ダイアログ */}
      <Dialog open={showRecipeDialog} onOpenChange={setShowRecipeDialog}>
        <DialogContent className="mx-4 flex h-[90vh] w-[calc(100vw-2rem)] max-w-2xl flex-col overflow-hidden rounded-lg sm:mx-auto sm:max-h-[90vh] sm:w-full">
          <DialogHeader className="flex-shrink-0 pb-4">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Download className="h-5 w-5 text-orange-600" />
              抽出されたレシピ
            </DialogTitle>
            <DialogDescription className="text-sm">
              動画から抽出された材料と手順です
            </DialogDescription>
          </DialogHeader>
          {extractedRecipe && (
            <div className="flex-1 overflow-y-auto p-1">
              <div className="space-y-6">
                {/* 基本情報 */}
                <div className="flex flex-col gap-3 rounded-lg border bg-gray-50 p-4 sm:flex-row sm:items-center sm:gap-6">
                  {extractedRecipe.cookingTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-gray-500" />
                      <span className="text-sm font-medium">
                        {extractedRecipe.cookingTime}
                      </span>
                    </div>
                  )}
                </div>

                {/* 抽出方法の表示 */}
                <div className="rounded-lg bg-blue-50 p-3">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <AlertCircle className="h-4 w-4" />
                    抽出方法:{' '}
                    {getExtractionMethodText(extractedRecipe.extractionMethod)}
                  </div>
                </div>

                {/* 材料 */}
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-base font-semibold">
                    <Package className="h-5 w-5 text-green-600" />
                    材料 (
                    {extractedRecipe.servings ||
                      `${extractedRecipe.ingredients.length}個`}
                    )
                  </h4>
                  {extractedRecipe.ingredients.length > 0 ? (
                    <div className="space-y-2">
                      {extractedRecipe.ingredients.map((ingredient, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 rounded-md border bg-white p-3 shadow-sm"
                        >
                          <Check className="h-5 w-5 flex-shrink-0 text-green-500" />
                          <span className="text-sm break-words">
                            {ingredient}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      材料が見つかりませんでした
                    </p>
                  )}
                </div>

                {/* 手順 */}
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-base font-semibold">
                    <List className="h-5 w-5 text-blue-600" />
                    手順 ({extractedRecipe.steps.length}ステップ)
                  </h4>
                  {extractedRecipe.steps.length > 0 ? (
                    <div className="space-y-3">
                      {extractedRecipe.steps.map((step, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 rounded-md border bg-white p-3 shadow-sm"
                        >
                          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                            {index + 1}
                          </div>
                          <p className="flex-1 text-sm leading-relaxed break-words">
                            {step}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      手順が見つかりませんでした
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-shrink-0 flex-col gap-2 border-t pt-4 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setShowRecipeDialog(false)}
              className="w-full sm:w-auto"
            >
              閉じる
            </Button>
            {extractedRecipe && extractedRecipe.ingredients.length > 0 && (
              <Button
                onClick={() => {
                  setShowRecipeDialog(false);
                  setShowShoppingDialog(true);
                }}
                className={`w-full sm:w-auto ${buttonVariants({ theme: 'shopping' })}`}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                買い物リストに追加
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 買い物リスト追加ダイアログ */}
      <AddToShoppingListDialog
        isOpen={showShoppingDialog}
        onClose={() => setShowShoppingDialog(false)}
        extractedRecipe={extractedRecipe}
        onAddToShoppingList={handleAddToShoppingListInternal}
      />

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
