'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Download,
  Clock,
  Package,
  List,
  ShoppingCart,
  Check,
  AlertCircle,
} from 'lucide-react';
import { buttonVariants } from '@/lib/theme-variants';

// Unified interface that supports both extraction method types
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
    | 'database'
    | 'captions'
    | 'ai_analysis';
}

interface RecipeDisplayDialogProps {
  recipe: ExtractedRecipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showExtractionMethod?: boolean;
  showAddToShoppingListButton?: boolean;
  onAddToShoppingList?: () => void;
}

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
    case 'captions':
      return '字幕から抽出';
    case 'ai_analysis':
      return 'AI分析';
    default:
      return '不明';
  }
};

export function RecipeDisplayDialog({
  recipe,
  open,
  onOpenChange,
  showExtractionMethod = false,
  showAddToShoppingListButton = false,
  onAddToShoppingList,
}: RecipeDisplayDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
        {recipe && (
          <div className="flex-1 overflow-y-auto p-1">
            <div className="space-y-6">
              {/* 基本情報 */}
              <div className="flex flex-col gap-3 rounded-lg border bg-gray-50 p-4 sm:flex-row sm:items-center sm:gap-6">
                {recipe.cookingTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <span className="text-sm font-medium">
                      {recipe.cookingTime}
                    </span>
                  </div>
                )}
              </div>

              {/* 抽出方法の表示 */}
              {showExtractionMethod && (
                <div className="rounded-lg bg-blue-50 p-3">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <AlertCircle className="h-4 w-4" />
                    抽出方法:{' '}
                    {getExtractionMethodText(recipe.extractionMethod)}
                  </div>
                </div>
              )}

              {/* 材料 */}
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-base font-semibold">
                  <Package className="h-5 w-5 text-green-600" />
                  材料 (
                  {recipe.servings ||
                    `${recipe.ingredients.length}個`}
                  )
                </h4>
                {recipe.ingredients.length > 0 ? (
                  <div className="space-y-2">
                    {recipe.ingredients.map((ingredient, index) => (
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
                  手順 ({recipe.steps.length}ステップ)
                </h4>
                {recipe.steps.length > 0 ? (
                  <div className="space-y-3">
                    {recipe.steps.map((step, index) => (
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
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            閉じる
          </Button>
          {showAddToShoppingListButton && recipe && recipe.ingredients.length > 0 && (
            <Button
              onClick={onAddToShoppingList}
              className={`w-full sm:w-auto ${buttonVariants({ theme: 'shopping' })}`}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              買い物リストに追加
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type { ExtractedRecipe };