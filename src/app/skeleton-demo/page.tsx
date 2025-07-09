'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { VideoCardSkeleton, VideoGridSkeleton } from '@/components/ui/video-skeleton';
import { IngredientsManagementSkeleton, ShoppingListSkeleton, CookingManagementSkeleton } from '@/components/ui/content-skeleton';

export default function SkeletonDemo() {
  const [activeDemo, setActiveDemo] = useState<string>('page');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4">Shadcn/ui Skeleton Demo</h1>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={activeDemo === 'page' ? 'default' : 'outline'}
              onClick={() => setActiveDemo('page')}
            >
              Page Skeleton
            </Button>
            <Button 
              variant={activeDemo === 'video-grid' ? 'default' : 'outline'}
              onClick={() => setActiveDemo('video-grid')}
            >
              Video Grid
            </Button>
            <Button 
              variant={activeDemo === 'ingredients' ? 'default' : 'outline'}
              onClick={() => setActiveDemo('ingredients')}
            >
              Ingredients
            </Button>
            <Button 
              variant={activeDemo === 'shopping' ? 'default' : 'outline'}
              onClick={() => setActiveDemo('shopping')}
            >
              Shopping List
            </Button>
            <Button 
              variant={activeDemo === 'cooking' ? 'default' : 'outline'}
              onClick={() => setActiveDemo('cooking')}
            >
              Cooking
            </Button>
          </div>
        </div>
      </header>

      {/* Demo Content */}
      <main className="p-4">
        {activeDemo === 'page' && <PageSkeleton />}
        
        {activeDemo === 'video-grid' && (
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">Video Grid Skeleton</h2>
            <VideoGridSkeleton count={6} />
          </div>
        )}
        
        {activeDemo === 'ingredients' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">Ingredients Management Skeleton</h2>
            <IngredientsManagementSkeleton />
          </div>
        )}
        
        {activeDemo === 'shopping' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">Shopping List Skeleton</h2>
            <ShoppingListSkeleton />
          </div>
        )}
        
        {activeDemo === 'cooking' && (
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">Cooking Management Skeleton</h2>
            <CookingManagementSkeleton />
          </div>
        )}
      </main>
    </div>
  );
}