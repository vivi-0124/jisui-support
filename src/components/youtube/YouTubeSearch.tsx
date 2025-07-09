'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Loader2,
  AlertCircle,
  Package,
} from 'lucide-react';
import { debounce } from '@/utils/helpers';
import { APP_CONFIG } from '@/constants';
import type { Ingredient, YouTubeVideo, Playlist } from '@/types';
import { VideoCard } from '@/components/youtube/VideoCard';

interface YouTubeSearchProps {
  ingredients: Ingredient[];
  playlists: Playlist[];
  onClose: () => void;
  onLoginRequired: () => void;
}

export function YouTubeSearch({
  ingredients,
  playlists,
  onClose,
  onLoginRequired,
}: YouTubeSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<YouTubeVideo[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const toggleIngredientSelection = (ingredientId: string) => {
    setSelectedIngredients(prev =>
      prev.includes(ingredientId)
        ? prev.filter(id => id !== ingredientId)
        : [...prev, ingredientId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIngredients.length === ingredients.length) {
      setSelectedIngredients([]);
    } else {
      setSelectedIngredients(ingredients.map(i => i.id));
    }
  };

  const getSelectedIngredients = () => {
    return selectedIngredients
      .map(id => ingredients.find(i => i.id === id))
      .filter(Boolean) as Ingredient[];
  };

  const searchRecipes = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error('検索に失敗しました');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setSearchResults(data.videos || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchError(error instanceof Error ? error.message : '検索中にエラーが発生しました');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // デバウンス付きの検索関数
  const debouncedSearch = debounce(searchRecipes, APP_CONFIG.searchDebounceMs);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selected = getSelectedIngredients();
    if (selected.length === 0) {
      searchRecipes(searchQuery);
      return;
    }

    // 選択された材料から検索クエリを生成
    const ingredientNames = selected.map(ingredient => ingredient.name);
    const combinedQuery = searchQuery
      ? `${searchQuery} ${ingredientNames.join(' ')}`
      : `${ingredientNames.join(' ')} レシピ`;

    searchRecipes(combinedQuery);
  };

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);
    debouncedSearch(value);
  };

  const allIngredientsSelected = selectedIngredients.length === ingredients.length;

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">レシピを検索</h2>
        
        {/* 検索フォーム */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="料理名やキーワードを入力（例：カレー、パスタ）"
              value={searchQuery}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={searching}
              className="shrink-0"
            >
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2">検索</span>
            </Button>
          </div>
        </form>

        {/* 材料選択セクション */}
        {ingredients.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                <span className="font-medium">手持ちの材料から検索</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
              >
                {allIngredientsSelected ? '全て解除' : '全て選択'}
              </Button>
            </div>
            
            <ScrollArea className="h-32 w-full rounded-md border p-3">
              <div className="grid grid-cols-2 gap-2">
                {ingredients.map((ingredient) => (
                  <div key={ingredient.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`ingredient-${ingredient.id}`}
                      checked={selectedIngredients.includes(ingredient.id)}
                      onCheckedChange={() => toggleIngredientSelection(ingredient.id)}
                    />
                    <Label
                      htmlFor={`ingredient-${ingredient.id}`}
                      className="text-sm cursor-pointer flex items-center gap-1"
                    >
                      {ingredient.name}
                      <Badge variant="outline" className="text-xs">
                        {ingredient.category}
                      </Badge>
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            {selectedIngredients.length > 0 && (
              <p className="text-sm text-gray-600">
                {selectedIngredients.length}個の材料が選択されています
              </p>
            )}
          </div>
        )}
      </div>

      {/* エラー表示 */}
      {searchError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{searchError}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 検索結果 */}
      <div className="space-y-4">
        {searching && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <p className="mt-2 text-gray-600">レシピを検索中...</p>
            </div>
          </div>
        )}

        {!searching && searchResults.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                検索結果 ({searchResults.length}件)
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                閉じる
              </Button>
            </div>
            
            <ScrollArea className="h-96">
              <div className="grid gap-4">
                                 {searchResults.map((video) => (
                   <VideoCard
                     key={video.videoId}
                     video={video}
                     playlists={playlists}
                     onLoginRequired={onLoginRequired}
                   />
                 ))}
              </div>
            </ScrollArea>
          </>
        )}

        {!searching && searchQuery && searchResults.length === 0 && !searchError && (
          <div className="text-center py-8 text-gray-500">
            <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>「{searchQuery}」に関するレシピが見つかりませんでした</p>
            <p className="text-sm">別のキーワードで検索してみてください</p>
          </div>
        )}
      </div>
    </div>
  );
} 