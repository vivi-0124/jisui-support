import { YOUTUBE_URL_REGEX, EXPIRY_WARNING_DAYS, UNITS } from '@/constants';
import type { Ingredient, MatchedIngredient } from '@/types';

// YouTube URLから動画IDを抽出
export const extractVideoId = (url: string): string | null => {
  const match = url.match(YOUTUBE_URL_REGEX);
  return match ? match[1] : null;
};

// 期限状態を判定
export const getExpiryStatus = (expiryDate: string | null): 'fresh' | 'expiring' | 'expired' => {
  if (!expiryDate) return 'fresh';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'expired';
  if (diffDays <= EXPIRY_WARNING_DAYS) return 'expiring';
  return 'fresh';
};

// 材料の解析（レシピから材料名、数量、単位を抽出）
export const parseIngredient = (
  ingredient: string
): { name: string; quantity: number; unit: string } => {
  const unitRegex = UNITS.join('|');
  // 全角数字と分数を処理
  const quantityRegex = `([\\d０-９\\.\\/\\-〜～]+)`;

  // 全角文字を半角に正規化
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
      quantity = parseFloat(parts[1]); // 範囲の上限を使用
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

// 材料の在庫とのマッチング
export const matchIngredientsWithInventory = (
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
};

// マッチ率を計算
export const calculateMatchPercentage = (matchedIngredients: MatchedIngredient[]): number => {
  if (matchedIngredients.length === 0) return 0;
  const availableCount = matchedIngredients.filter((m) => m.available).length;
  return Math.round((availableCount / matchedIngredients.length) * 100);
};

// 動画の尺を読みやすい形式にフォーマット
export const formatDuration = (duration: string | undefined): string => {
  if (!duration) return '不明';
  
  // ISO 8601 duration format (PT1H2M3S) をパース
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return duration;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
};

// 視聴回数を読みやすい形式にフォーマット
export const formatViewCount = (count: number | undefined): string => {
  if (!count) return '0回';
  
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M回`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K回`;
  } else {
    return `${count}回`;
  }
};

// 日付を相対的な形式でフォーマット
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return '今日';
  } else if (diffDays === 1) {
    return '昨日';
  } else if (diffDays < 7) {
    return `${diffDays}日前`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks}週間前`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months}ヶ月前`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years}年前`;
  }
};

// UUIDを生成（crypto.randomUUID()のフォールバック）
export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // フォールバック実装
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// 配列を安全にソート
export const sortByProperty = <T>(
  array: T[],
  property: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[property];
    const bVal = b[property];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

// 配列を重複除去
export const uniqueBy = <T>(array: T[], key: keyof T): T[] => {
  const seen = new Set();
  return array.filter(item => {
    const val = item[key];
    if (seen.has(val)) {
      return false;
    }
    seen.add(val);
    return true;
  });
};

// デバウンス関数
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}; 