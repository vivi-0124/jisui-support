// 基本的な材料の型定義
export interface Ingredient {
  id: string;
  user_id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiry_date: string | null;
  location: string | null;
  created_at: string;
}

// 買い物リストアイテムの型定義
export interface ShoppingItem {
  id: string;
  user_id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  is_purchased: boolean;
  notes: string | null;
  added_date: string;
}

// 動画の型定義
export interface Video {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration?: string;
  added_at: string;
}

// プレイリストの型定義
export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  videos: Video[];
  created_at: string;
  updated_at: string;
}

// YouTube検索結果の型定義
export interface YouTubeVideo {
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  description?: string;
  duration?: string;
  viewCount?: number;
  publishedAt?: string;
}

// 抽出されたレシピの型定義
export interface ExtractedRecipe {
  title: string;
  ingredients: string[];
  steps: string[];
  servings?: string;
  cookingTime?: string;
  description: string;
  extractionMethod: 'gemini_video_analysis' | 'gemini_text_analysis' | 'description' | 'database' | 'captions' | 'ai_analysis';
  videoId?: string;
}

// 調理で使用した材料の型定義
export interface UsedIngredient {
  ingredientId: string;
  ingredientName: string;
  quantityUsed: number;
  unit: string;
  originalQuantity: number;
}

// 調理セッションの型定義
export interface CookingSession {
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

// マッチした材料の型定義
export interface MatchedIngredient {
  ingredientId: string;
  ingredientName: string;
  extractedIngredient: string;
  available: boolean;
  availableQuantity: number;
  unit: string;
}

// 調理可能レシピの型定義
export interface CookableRecipe {
  video: Video;
  extractedRecipe?: ExtractedRecipe;
  matchedIngredients: MatchedIngredient[];
  matchPercentage: number;
}

// 買い物リストに追加する材料の型定義
export interface IngredientToAdd {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  notes?: string;
}

// フォーム用の型定義
export type IngredientFormData = Omit<Ingredient, 'id' | 'user_id' | 'created_at'>;
export type ShoppingItemFormData = Omit<ShoppingItem, 'id' | 'user_id' | 'added_date'>;
export type PlaylistFormData = Omit<Playlist, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type VideoFormData = Omit<Video, 'id' | 'added_at'>;

// API応答の型定義
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 検索関連の型定義
export interface SearchFilters {
  category?: string;
  expiringSoon?: boolean;
  inStock?: boolean;
}

// 統計情報の型定義
export interface InventoryStats {
  totalItems: number;
  expiringSoon: number;
  expired: number;
  byCategory: Record<string, number>;
}

export interface ShoppingStats {
  totalItems: number;
  purchased: number;
  unpurchased: number;
  byCategory: Record<string, number>;
} 