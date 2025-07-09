-- ============================================================================
-- Allergy Support Migration Script
-- ============================================================================

-- 1. Add allergens column to existing ingredients table
ALTER TABLE public.ingredients 
ADD COLUMN IF NOT EXISTS allergens text[] DEFAULT NULL;

-- 2. Add allergens column to existing shopping_items table  
ALTER TABLE public.shopping_items 
ADD COLUMN IF NOT EXISTS allergens text[] DEFAULT NULL;

-- 3. Add allergens column to existing extracted_recipes table
ALTER TABLE public.extracted_recipes 
ADD COLUMN IF NOT EXISTS allergens text[] DEFAULT NULL;

-- 4. Create user_allergies table
CREATE TABLE IF NOT EXISTS public.user_allergies (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    allergen text NOT NULL,
    severity text NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe')),
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, allergen)
);

-- 5. Enable RLS on the new table
ALTER TABLE public.user_allergies ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for user_allergies
CREATE POLICY "Users can view own allergies" ON public.user_allergies
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own allergies" ON public.user_allergies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own allergies" ON public.user_allergies
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own allergies" ON public.user_allergies
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_allergies_user_id ON public.user_allergies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_allergies_allergen ON public.user_allergies(allergen);
CREATE INDEX IF NOT EXISTS idx_ingredients_allergens ON public.ingredients USING GIN(allergens);
CREATE INDEX IF NOT EXISTS idx_shopping_items_allergens ON public.shopping_items USING GIN(allergens);
CREATE INDEX IF NOT EXISTS idx_extracted_recipes_allergens ON public.extracted_recipes USING GIN(allergens);

-- 8. Add comments for documentation
COMMENT ON TABLE public.user_allergies IS 'User allergy profiles with severity levels';
COMMENT ON COLUMN public.user_allergies.allergen IS 'Common allergen name (e.g., 卵, 乳, 小麦, etc.)';
COMMENT ON COLUMN public.user_allergies.severity IS 'Severity level: mild, moderate, or severe';
COMMENT ON COLUMN public.ingredients.allergens IS 'Array of allergens present in this ingredient';
COMMENT ON COLUMN public.shopping_items.allergens IS 'Array of allergens present in this shopping item';
COMMENT ON COLUMN public.extracted_recipes.allergens IS 'Array of allergens detected in this recipe';