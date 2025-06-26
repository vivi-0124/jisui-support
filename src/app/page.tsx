"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import {
  Home,
  Package,
  ShoppingCart,
  BookOpen,
  Search,
  Plus,
  User,
} from "lucide-react";
import IngredientsManagement from "@/components/ingredients-management";
import ShoppingList from "@/components/shopping-list";
import RecipeManagement from "@/components/recipe-management";
import { gradientButtonVariants, headerVariants, backgroundVariants, headerButtonVariants, textColorVariants } from "@/lib/theme-variants";

export default function JisuiSupport() {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div className={backgroundVariants({ theme: "home" })}>
      {/* Header */}
      <header className={headerVariants({ theme: "home" })}>
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <Home className="w-6 h-6" />
            <h1 className="text-xl font-bold">自炊サポート</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className={headerButtonVariants({ theme: "home" })}>
              <Search className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" className={headerButtonVariants({ theme: "home" })}>
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          {/* Home Tab Content */}
          <TabsContent value="home" className="space-y-8">
            {/* Welcome Section */}
            <div className="text-center space-y-3 pt-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                おかえりなさい！
              </h2>
              <p className={`text-lg ${textColorVariants({ theme: "home" })}`}>今日も自炊を楽しくサポートします</p>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-4 justify-center py-4">
              <Button 
                size="lg" 
                onClick={() => setActiveTab("ingredients")}
                className={gradientButtonVariants({ theme: "ingredients", size: "lg" })}
              >
                <Plus className="w-6 h-6 text-white" />
              </Button>
              <Button 
                size="lg" 
                onClick={() => setActiveTab("shopping")}
                className={gradientButtonVariants({ theme: "shopping", size: "lg" })}
              >
                <ShoppingCart className="w-6 h-6 text-white" />
              </Button>
              <Button 
                size="lg" 
                onClick={() => setActiveTab("recipes")}
                className={gradientButtonVariants({ theme: "recipes", size: "lg" })}
              >
                <BookOpen className="w-6 h-6 text-white" />
              </Button>
            </div>
          </TabsContent>

          {/* Other Tab Contents */}
          <TabsContent value="ingredients">
            <IngredientsManagement />
          </TabsContent>

          <TabsContent value="shopping">
            <ShoppingList />
          </TabsContent>

          <TabsContent value="recipes">
            <RecipeManagement />
          </TabsContent>


          {/* Bottom Navigation */}
          <TabsList className="fixed bottom-0 left-0 right-0 grid w-full grid-cols-4 h-16 p-1 bg-white border-t shadow-lg rounded-none">
            <TabsTrigger value="home" className={`flex flex-col items-center gap-1 px-2 py-1 text-xs data-[state=active]:text-gray-600`}>
              <Home className="w-4 h-4" />
              ホーム
            </TabsTrigger>
            <TabsTrigger value="ingredients" className={`flex flex-col items-center gap-1 px-2 py-1 text-xs data-[state=active]:text-green-600`}>
              <Package className="w-4 h-4" />
              材料管理
            </TabsTrigger>
            <TabsTrigger value="shopping" className={`flex flex-col items-center gap-1 px-2 py-1 text-xs data-[state=active]:text-purple-600`}>
              <ShoppingCart className="w-4 h-4" />
              買い物リスト
            </TabsTrigger>
            <TabsTrigger value="recipes" className={`flex flex-col items-center gap-1 px-2 py-1 text-xs data-[state=active]:text-blue-600`}>
              <BookOpen className="w-4 h-4" />
              レシピ管理
            </TabsTrigger>
          </TabsList>

        </Tabs>
      </main>
    </div>
  );
}
