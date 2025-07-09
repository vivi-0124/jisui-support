// カテゴリ一覧
export const CATEGORIES = [
  '野菜',
  '肉類',
  '魚介類',
  '乳製品',
  '調味料',
  '冷凍食品',
  'その他',
] as const;

// 単位一覧
export const UNITS = [
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
] as const;

// 保存場所一覧
export const LOCATIONS = [
  '冷蔵庫',
  '冷凍庫',
  '常温',
  '野菜室',
] as const;

// 調理ステータス
export const COOKING_STATUSES = [
  'preparing',
  'cooking',
  'completed',
] as const;

// レシピ抽出方法
export const EXTRACTION_METHODS = [
  'gemini_video_analysis',
  'gemini_text_analysis',
  'description',
  'database',
  'captions',
  'ai_analysis',
] as const;

// アプリケーション設定
export const APP_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  defaultServings: 2,
  defaultCookingTime: 30,
  searchDebounceMs: 300,
  maxSearchResults: 50,
} as const;

// デフォルト値
export const DEFAULTS = {
  ingredient: {
    quantity: 1,
    category: 'その他',
    unit: '個',
  },
  shoppingItem: {
    quantity: 1,
    category: 'その他',
    unit: '個',
    is_purchased: false,
  },
  cookingSession: {
    servings: 2,
    cookingTime: 30,
    status: 'preparing' as const,
  },
} as const;

// エラーメッセージ
export const ERROR_MESSAGES = {
  required: '必須項目を入力してください',
  invalidUrl: '有効なYouTube URLを入力してください',
  networkError: 'ネットワークエラーが発生しました',
  loginRequired: 'ログインが必要です',
  deleteConfirm: '削除しますか？',
  saveError: '保存に失敗しました',
  loadError: 'データの読み込みに失敗しました',
} as const;

// 成功メッセージ
export const SUCCESS_MESSAGES = {
  saved: '保存しました',
  deleted: '削除しました',
  addedToShoppingList: '買い物リストに追加しました',
  addedToIngredients: '材料管理に追加しました',
  recipeExtracted: 'レシピを抽出しました',
} as const;

// YouTube URL用の正規表現
export const YOUTUBE_URL_REGEX = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;

// 期限切れチェック用の日数
export const EXPIRY_WARNING_DAYS = 3;

// タイプガード用のヘルパー関数
export const isValidCategory = (category: string): category is typeof CATEGORIES[number] => {
  return CATEGORIES.includes(category as typeof CATEGORIES[number]);
};

export const isValidUnit = (unit: string): unit is typeof UNITS[number] => {
  return UNITS.includes(unit as typeof UNITS[number]);
};

export const isValidLocation = (location: string): location is typeof LOCATIONS[number] => {
  return LOCATIONS.includes(location as typeof LOCATIONS[number]);
};

export const isValidCookingStatus = (status: string): status is typeof COOKING_STATUSES[number] => {
  return COOKING_STATUSES.includes(status as typeof COOKING_STATUSES[number]);
};

export const isValidExtractionMethod = (method: string): method is typeof EXTRACTION_METHODS[number] => {
  return EXTRACTION_METHODS.includes(method as typeof EXTRACTION_METHODS[number]);
}; 