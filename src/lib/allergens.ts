// Common allergens in Japan (based on Japanese food labeling requirements)
export const COMMON_ALLERGENS = [
  '卵', // Eggs
  '乳', // Milk/Dairy
  '小麦', // Wheat
  'そば', // Buckwheat
  '落花生', // Peanuts
  'えび', // Shrimp
  'かに', // Crab
  '大豆', // Soy
  '魚', // Fish
  '肉', // Meat
  'ナッツ類', // Tree nuts
  'ごま', // Sesame
  '貝類', // Shellfish
] as const;

export type AllergenType = (typeof COMMON_ALLERGENS)[number];

export interface UserAllergy {
  id: string;
  user_id: string;
  allergen: string;
  severity: 'mild' | 'moderate' | 'severe';
  notes: string | null;
  created_at: string;
}

export const ALLERGEN_SEVERITY_LABELS = {
  mild: '軽度',
  moderate: '中度',
  severe: '重度',
} as const;

export const ALLERGEN_SEVERITY_COLORS = {
  mild: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  moderate: 'text-orange-600 bg-orange-50 border-orange-200',
  severe: 'text-red-600 bg-red-50 border-red-200',
} as const;

// Common ingredient to allergen mapping for auto-detection
export const INGREDIENT_ALLERGEN_MAP: Record<string, string[]> = {
  // 卵 (Eggs)
  '卵': ['卵'],
  'たまご': ['卵'],
  '玉子': ['卵'],
  '鶏卵': ['卵'],
  'マヨネーズ': ['卵'],
  
  // 乳 (Dairy)
  '牛乳': ['乳'],
  'ミルク': ['乳'],
  'チーズ': ['乳'],
  'バター': ['乳'],
  'ヨーグルト': ['乳'],
  'クリーム': ['乳'],
  
  // 小麦 (Wheat)
  '小麦': ['小麦'],
  '小麦粉': ['小麦'],
  'パン': ['小麦'],
  'うどん': ['小麦'],
  'ラーメン': ['小麦'],
  'パスタ': ['小麦'],
  'スパゲッティ': ['小麦'],
  '醤油': ['小麦', '大豆'],
  '味噌': ['大豆'],
  
  // そば (Buckwheat)
  'そば': ['そば'],
  '蕎麦': ['そば'],
  
  // 落花生 (Peanuts)
  '落花生': ['落花生'],
  'ピーナッツ': ['落花生'],
  
  // えび (Shrimp)
  'えび': ['えび'],
  '海老': ['えび'],
  'エビ': ['えび'],
  'シュリンプ': ['えび'],
  
  // かに (Crab)
  'かに': ['かに'],
  '蟹': ['かに'],
  'カニ': ['かに'],
  'クラブ': ['かに'],
  
  // 大豆 (Soy)
  '大豆': ['大豆'],
  '豆腐': ['大豆'],
  '納豆': ['大豆'],
  '豆乳': ['大豆'],
  'もやし': ['大豆'],
  
  // 魚 (Fish)
  '魚': ['魚'],
  'さかな': ['魚'],
  'サーモン': ['魚'],
  'まぐろ': ['魚'],
  'さば': ['魚'],
  'いわし': ['魚'],
  'あじ': ['魚'],
  
  // ナッツ類 (Tree nuts)
  'アーモンド': ['ナッツ類'],
  'クルミ': ['ナッツ類'],
  'カシューナッツ': ['ナッツ類'],
  'ピスタチオ': ['ナッツ類'],
  
  // ごま (Sesame)
  'ごま': ['ごま'],
  '胡麻': ['ごま'],
  'セサミ': ['ごま'],
  
  // 貝類 (Shellfish)
  'あさり': ['貝類'],
  'はまぐり': ['貝類'],
  'しじみ': ['貝類'],
  'ホタテ': ['貝類'],
  'カキ': ['貝類'],
  '牡蠣': ['貝類'],
};

/**
 * Detect potential allergens in an ingredient name
 */
export function detectAllergens(ingredientName: string): string[] {
  const allergens = new Set<string>();
  const lowerName = ingredientName.toLowerCase();
  
  Object.entries(INGREDIENT_ALLERGEN_MAP).forEach(([ingredient, allergenList]) => {
    if (lowerName.includes(ingredient.toLowerCase())) {
      allergenList.forEach(allergen => allergens.add(allergen));
    }
  });
  
  return Array.from(allergens);
}

/**
 * Check if ingredients contain any of the user's allergens
 */
export function hasUserAllergens(
  ingredients: string[], 
  userAllergies: UserAllergy[]
): { hasAllergens: boolean; conflictingAllergens: string[]; maxSeverity: 'mild' | 'moderate' | 'severe' | null } {
  const userAllergenSet = new Set(userAllergies.map(allergy => allergy.allergen));
  const conflictingAllergens: string[] = [];
  let maxSeverity: 'mild' | 'moderate' | 'severe' | null = null;
  
  ingredients.forEach(ingredient => {
    const detectedAllergens = detectAllergens(ingredient);
    detectedAllergens.forEach(allergen => {
      if (userAllergenSet.has(allergen)) {
        conflictingAllergens.push(allergen);
        const userAllergy = userAllergies.find(ua => ua.allergen === allergen);
        if (userAllergy) {
          if (!maxSeverity || getSeverityLevel(userAllergy.severity) > getSeverityLevel(maxSeverity)) {
            maxSeverity = userAllergy.severity;
          }
        }
      }
    });
  });
  
  return {
    hasAllergens: conflictingAllergens.length > 0,
    conflictingAllergens: Array.from(new Set(conflictingAllergens)),
    maxSeverity
  };
}

function getSeverityLevel(severity: 'mild' | 'moderate' | 'severe'): number {
  switch (severity) {
    case 'mild': return 1;
    case 'moderate': return 2;
    case 'severe': return 3;
    default: return 0;
  }
}