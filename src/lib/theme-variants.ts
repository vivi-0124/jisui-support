import { tv } from 'tailwind-variants';

// 各機能のアクセントカラー定義
export const themeColors = {
  home: {
    primary: 'gray-600',
    secondary: 'gray-100',
    hover: 'gray-700',
    gradient: 'from-gray-500 to-gray-600',
    gradientHover: 'from-gray-600 to-gray-700',
    background: 'gray-50',
    accent: 'gray-600',
  },
  ingredients: {
    primary: 'green-600',
    secondary: 'green-100',
    hover: 'green-700',
    gradient: 'from-green-500 to-green-600',
    gradientHover: 'from-green-600 to-green-700',
    background: 'green-50',
    accent: 'green-600',
  },
  shopping: {
    primary: 'purple-600',
    secondary: 'purple-100',
    hover: 'purple-700',
    gradient: 'from-purple-500 to-purple-600',
    gradientHover: 'from-purple-600 to-purple-700',
    background: 'purple-50',
    accent: 'purple-600',
  },
  recipes: {
    primary: 'blue-600',
    secondary: 'blue-100',
    hover: 'blue-700',
    gradient: 'from-blue-500 to-blue-600',
    gradientHover: 'from-blue-600 to-blue-700',
    background: 'blue-50',
    accent: 'blue-600',
  },
  search: {
    primary: 'orange-600',
    secondary: 'orange-100',
    hover: 'orange-700',
    gradient: 'from-orange-500 to-orange-600',
    gradientHover: 'from-orange-600 to-orange-700',
    background: 'orange-50',
    accent: 'orange-600',
  },
  cooking: {
    primary: 'amber-600',
    secondary: 'amber-100',
    hover: 'amber-700',
    gradient: 'from-amber-500 to-amber-600',
    gradientHover: 'from-amber-600 to-amber-700',
    background: 'amber-50',
    accent: 'amber-600',
  },
} as const;

// ボタンのバリアント定義
export const buttonVariants = tv({
  base: 'transition-all duration-200 font-medium',
  variants: {
    theme: {
      home: 'bg-gray-600 hover:bg-gray-700 text-white shadow-lg hover:shadow-xl',
      ingredients:
        'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl',
      shopping:
        'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl',
      recipes:
        'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl',
      search:
        'bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl',
      cooking:
        'bg-amber-600 hover:bg-amber-700 text-white shadow-lg hover:shadow-xl',
    },
    variant: {
      solid: '',
      outline: 'bg-transparent border-2',
      ghost: 'bg-transparent hover:bg-opacity-10',
    },
    size: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2',
      lg: 'px-6 py-3 text-lg',
      icon: 'p-2',
      round: 'h-14 w-14 rounded-full',
    },
  },
  compoundVariants: [
    {
      theme: 'home',
      variant: 'outline',
      class: 'border-gray-600 text-gray-600 hover:bg-gray-50',
    },
    {
      theme: 'ingredients',
      variant: 'outline',
      class: 'border-green-600 text-green-600 hover:bg-green-50',
    },
    {
      theme: 'shopping',
      variant: 'outline',
      class: 'border-purple-600 text-purple-600 hover:bg-purple-50',
    },
    {
      theme: 'recipes',
      variant: 'outline',
      class: 'border-blue-600 text-blue-600 hover:bg-blue-50',
    },
    {
      theme: 'search',
      variant: 'outline',
      class: 'border-orange-600 text-orange-600 hover:bg-orange-50',
    },
    {
      theme: 'cooking',
      variant: 'outline',
      class: 'border-amber-600 text-amber-600 hover:bg-amber-50',
    },
  ],
  defaultVariants: {
    theme: 'home',
    variant: 'solid',
    size: 'md',
  },
});

// グラデーションボタンのバリアント定義
export const gradientButtonVariants = tv({
  base: 'transition-all duration-200 shadow-lg hover:shadow-xl rounded-full',
  variants: {
    theme: {
      home: 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700',
      ingredients:
        'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
      shopping:
        'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
      recipes:
        'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      search:
        'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
      cooking:
        'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700',
    },
    size: {
      sm: 'h-10 w-10',
      md: 'h-12 w-12',
      lg: 'h-14 w-14',
    },
  },
  defaultVariants: {
    theme: 'home',
    size: 'lg',
  },
});

// カードのバリアント定義
export const cardVariants = tv({
  base: 'border-0 shadow-lg hover:shadow-xl transition-shadow duration-200',
  variants: {
    theme: {
      home: 'bg-gradient-to-br from-gray-50 to-slate-50',
      ingredients: 'bg-gradient-to-br from-green-50 to-emerald-50',
      shopping: 'bg-gradient-to-br from-purple-50 to-violet-50',
      recipes: 'bg-gradient-to-br from-blue-50 to-cyan-50',
      search: 'bg-gradient-to-br from-orange-50 to-amber-50',
      cooking: 'bg-gradient-to-br from-amber-50 to-amber-50',
    },
  },
  defaultVariants: {
    theme: 'home',
  },
});

// アイコン背景のバリアント定義
export const iconBackgroundVariants = tv({
  base: 'w-10 h-10 rounded-full flex items-center justify-center',
  variants: {
    theme: {
      home: 'bg-gray-100',
      ingredients: 'bg-green-100',
      shopping: 'bg-purple-100',
      recipes: 'bg-blue-100',
      search: 'bg-orange-100',
      cooking: 'bg-amber-100',
    },
  },
  defaultVariants: {
    theme: 'home',
  },
});

// アイコンカラーのバリアント定義
export const iconColorVariants = tv({
  base: 'w-5 h-5',
  variants: {
    theme: {
      home: 'text-gray-600',
      ingredients: 'text-green-600',
      shopping: 'text-purple-600',
      recipes: 'text-blue-600',
      search: 'text-orange-600',
      cooking: 'text-amber-600',
    },
  },
  defaultVariants: {
    theme: 'home',
  },
});

// テキストカラーのバリアント定義
export const textColorVariants = tv({
  base: '',
  variants: {
    theme: {
      home: 'text-gray-600',
      ingredients: 'text-green-600',
      shopping: 'text-purple-600',
      recipes: 'text-blue-600',
      search: 'text-orange-600',
      cooking: 'text-amber-600',
    },
  },
  defaultVariants: {
    theme: 'home',
  },
});

// ヘッダーのバリアント定義
export const headerVariants = tv({
  base: 'text-white px-4 py-3',
  variants: {
    theme: {
      home: 'bg-gray-600',
      ingredients: 'bg-green-600',
      shopping: 'bg-purple-600',
      recipes: 'bg-blue-600',
      search: 'bg-orange-600',
      cooking: 'bg-amber-600',
    },
  },
  defaultVariants: {
    theme: 'home',
  },
});

// 背景のバリアント定義
export const backgroundVariants = tv({
  base: 'min-h-screen pb-20',
  variants: {
    theme: {
      home: 'bg-gray-50',
      ingredients: 'bg-green-50',
      shopping: 'bg-purple-50',
      recipes: 'bg-blue-50',
      search: 'bg-orange-50',
      cooking: 'bg-amber-50',
    },
  },
  defaultVariants: {
    theme: 'home',
  },
});

// ヘッダーボタンのバリアント定義
export const headerButtonVariants = tv({
  base: 'text-white p-2',
  variants: {
    theme: {
      home: 'hover:bg-gray-500',
      ingredients: 'hover:bg-green-500',
      shopping: 'hover:bg-purple-500',
      recipes: 'hover:bg-blue-500',
      search: 'hover:bg-orange-500',
      cooking: 'hover:bg-amber-500',
    },
  },
  defaultVariants: {
    theme: 'home',
  },
});

export type ThemeType = keyof typeof themeColors;
