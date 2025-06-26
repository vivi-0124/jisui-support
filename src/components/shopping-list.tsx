"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  ShoppingCart,
  Circle,
  CheckCircle,
  Trash2,
  Edit,
} from "lucide-react";
import { buttonVariants, iconColorVariants, cardVariants, textColorVariants } from "@/lib/theme-variants";

interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  isPurchased: boolean;
  notes?: string;
  addedDate: string;
}

const categories = [
  "野菜",
  "肉類",
  "魚介類",
  "乳製品",
  "調味料",
  "冷凍食品",
  "その他",
];

const units = ["個", "g", "kg", "ml", "L", "本", "枚", "袋", "パック"];

interface AddShoppingItemButtonProps {
  onSave: (item: Omit<ShoppingItem, "id" | "addedDate">) => void;
  editingItem?: ShoppingItem | null;
  onEditComplete?: () => void;
  children: React.ReactNode;
}

function AddShoppingItemButton({ 
  onSave, 
  editingItem, 
  onEditComplete, 
  children 
}: AddShoppingItemButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState<Omit<ShoppingItem, "id" | "addedDate">>({
    name: "",
    category: "",
    quantity: 1,
    unit: "",
    isPurchased: false,
    notes: "",
  });

  // 編集モードの時に初期値をセット
  useEffect(() => {
    if (editingItem) {
      setNewItem({
        name: editingItem.name,
        category: editingItem.category,
        quantity: editingItem.quantity,
        unit: editingItem.unit,
        isPurchased: editingItem.isPurchased,
        notes: editingItem.notes || "",
      });
      setIsDialogOpen(true);
    }
  }, [editingItem]);

  const handleSaveItem = () => {
    if (!newItem.name || !newItem.category || !newItem.unit) {
      alert("必須項目を入力してください");
      return;
    }

    onSave(newItem);
    handleCloseDialog();
    if (editingItem && onEditComplete) {
      onEditComplete();
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setNewItem({
      name: "",
      category: "",
      quantity: 1,
      unit: "",
      isPurchased: false,
      notes: "",
    });
    if (editingItem && onEditComplete) {
      onEditComplete();
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? "アイテムを編集" : "新しいアイテムを追加"}
          </DialogTitle>
          <DialogDescription>
            買い物リストに追加するアイテムの詳細を入力してください。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="name">商品名 *</Label>
            <Input
              id="name"
              value={newItem.name}
              onChange={(e) =>
                setNewItem({ ...newItem, name: e.target.value })
              }
              placeholder="例: 牛乳"
            />
          </div>
          <div>
            <Label htmlFor="category">カテゴリ *</Label>
            <Select
              value={newItem.category}
              onValueChange={(value) =>
                setNewItem({ ...newItem, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="カテゴリを選択" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="quantity">数量</Label>
              <Input
                id="quantity"
                type="number"
                value={newItem.quantity}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    quantity: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="unit">単位 *</Label>
              <Select
                value={newItem.unit}
                onValueChange={(value) =>
                  setNewItem({ ...newItem, unit: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="単位" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="notes">メモ</Label>
            <Input
              id="notes"
              value={newItem.notes}
              onChange={(e) =>
                setNewItem({ ...newItem, notes: e.target.value })
              }
              placeholder="例: 低脂肪"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCloseDialog}>
            キャンセル
          </Button>
          <Button onClick={handleSaveItem} className={buttonVariants({ theme: "shopping" })}>
            {editingItem ? "更新" : "追加"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ShoppingList() {
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);

  // ローカルストレージから買い物リストデータを読み込み
  useEffect(() => {
    const savedItems = localStorage.getItem("shoppingItems");
    if (savedItems) {
      setShoppingItems(JSON.parse(savedItems));
    }
  }, []);

  // 買い物リストデータをローカルストレージに保存
  useEffect(() => {
    localStorage.setItem("shoppingItems", JSON.stringify(shoppingItems));
  }, [shoppingItems]);

  const unpurchasedItems = shoppingItems.filter((item) => !item.isPurchased);
  const purchasedItems = shoppingItems.filter((item) => item.isPurchased);

  // アイテムを追加/編集
  const handleSaveItem = (itemData: Omit<ShoppingItem, "id" | "addedDate">) => {
    if (editingItem) {
      // 編集モード
      setShoppingItems(
        shoppingItems.map((item) =>
          item.id === editingItem.id
            ? { ...itemData, id: editingItem.id, addedDate: editingItem.addedDate }
            : item
        )
      );
    } else {
      // 新規追加モード
      const item: ShoppingItem = {
        ...itemData,
        id: Date.now().toString(),
        addedDate: new Date().toISOString(),
      };
      setShoppingItems([...shoppingItems, item]);
    }
  };

  // アイテムを削除
  const handleDeleteItem = (id: string) => {
    setShoppingItems(shoppingItems.filter((item) => item.id !== id));
  };

  // アイテムを編集
  const handleEditItem = (item: ShoppingItem) => {
    setEditingItem(item);
  };

  // 編集完了
  const handleEditComplete = () => {
    setEditingItem(null);
  };

  // 購入状況を切り替え
  const togglePurchaseStatus = (id: string) => {
    setShoppingItems(
      shoppingItems.map((item) =>
        item.id === id ? { ...item, isPurchased: !item.isPurchased } : item
      )
    );
  };

  // 購入済みアイテムを一括削除
  const clearPurchasedItems = () => {
    setShoppingItems(shoppingItems.filter((item) => !item.isPurchased));
  };

  return (
    <div className="space-y-6">
      {/* 統計 */}
      <div className="flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Circle className={iconColorVariants({ theme: "shopping" })} />
          <span>未購入 {unpurchasedItems.length}品</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span>購入済み {purchasedItems.length}品</span>
        </div>
        <div className="flex items-center gap-1">
          <ShoppingCart className={iconColorVariants({ theme: "shopping" })} />
          <span>合計 {shoppingItems.length}品</span>
        </div>
      </div>

      {/* アクション */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">買い物リスト</h2>
        {shoppingItems.length > 0 && (
          <div className="flex gap-2">
            {purchasedItems.length > 0 && (
              <Button 
                variant="outline" 
                onClick={clearPurchasedItems}
                className={buttonVariants({ theme: "shopping", variant: "outline", size: "sm" })}
              >
                購入済みを削除
              </Button>
            )}
            <AddShoppingItemButton 
              onSave={handleSaveItem}
              editingItem={editingItem}
              onEditComplete={handleEditComplete}
            >
              <Button className={buttonVariants({ theme: "shopping" })}>
                <Plus className="w-4 h-4 mr-2" />
                アイテムを追加
              </Button>
            </AddShoppingItemButton>
          </div>
        )}
      </div>

      {/* 買い物リスト */}
      <div className="space-y-4">
        {shoppingItems.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-purple-300" />
              <h3 className="text-lg font-semibold mb-2">買い物リストが空です</h3>
              <p className="text-gray-600 mb-4">
                最初のアイテムを追加して買い物を始めましょう
              </p>
              <AddShoppingItemButton 
                onSave={handleSaveItem}
                editingItem={editingItem}
                onEditComplete={handleEditComplete}
              >
                <Button className={buttonVariants({ theme: "shopping" })}>
                  <Plus className="w-4 h-4 mr-2" />
                  アイテムを追加
                </Button>
              </AddShoppingItemButton>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 未購入アイテム */}
            {unpurchasedItems.length > 0 && (
              <div className="space-y-2">
                <h3 className={`text-lg font-semibold ${textColorVariants({ theme: "shopping" })}`}>
                  未購入 ({unpurchasedItems.length}品)
                </h3>
                {unpurchasedItems.map((item) => (
                  <Card key={item.id} className={cardVariants({ theme: "shopping" })}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => togglePurchaseStatus(item.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Circle className="w-4 h-4" />
                        </Button>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{item.name}</h4>
                            <Badge variant="secondary">{item.category}</Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            数量: {item.quantity}{item.unit}
                            {item.notes && ` | ${item.notes}`}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditItem(item)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* 購入済みアイテム */}
            {purchasedItems.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-green-600">
                  購入済み ({purchasedItems.length}品)
                </h3>
                {purchasedItems.map((item) => (
                  <Card key={item.id} className="border-green-200 bg-green-50 opacity-75">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => togglePurchaseStatus(item.id)}
                          className="h-8 w-8 p-0 bg-green-100"
                        >
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </Button>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold line-through text-gray-500">
                              {item.name}
                            </h4>
                            <Badge variant="secondary">{item.category}</Badge>
                          </div>
                          <div className="text-sm text-gray-500 line-through">
                            数量: {item.quantity}{item.unit}
                            {item.notes && ` | ${item.notes}`}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* 編集用のAddShoppingItemButton（非表示） */}
      <AddShoppingItemButton 
        onSave={handleSaveItem}
        editingItem={editingItem}
        onEditComplete={handleEditComplete}
      >
        <div style={{ display: 'none' }} />
      </AddShoppingItemButton>
    </div>
  );
} 