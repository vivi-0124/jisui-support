'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  Shield,
  AlertTriangle,
  Trash2,
  Edit,
} from 'lucide-react';
import { useUserAllergies } from '@/hooks/useUserAllergies';
import { 
  COMMON_ALLERGENS, 
  ALLERGEN_SEVERITY_LABELS,
  ALLERGEN_SEVERITY_COLORS,
  UserAllergy 
} from '@/lib/allergens';

interface AllergyManagementProps {
  className?: string;
}

export default function AllergyManagement({ className }: AllergyManagementProps) {
  const { 
    allergies, 
    loading, 
    error, 
    addAllergy, 
    updateAllergy, 
    removeAllergy 
  } = useUserAllergies();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAllergy, setEditingAllergy] = useState<UserAllergy | null>(null);
  const [newAllergen, setNewAllergen] = useState('');
  const [newSeverity, setNewSeverity] = useState<'mild' | 'moderate' | 'severe'>('mild');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddAllergy = async () => {
    if (!newAllergen.trim()) return;

    setIsSubmitting(true);
    const success = await addAllergy(newAllergen.trim(), newSeverity, newNotes.trim() || undefined);
    
    if (success) {
      setIsAddDialogOpen(false);
      resetForm();
    }
    setIsSubmitting(false);
  };

  const handleUpdateAllergy = async () => {
    if (!editingAllergy) return;

    setIsSubmitting(true);
    const success = await updateAllergy(editingAllergy.id, {
      severity: newSeverity,
      notes: newNotes.trim() || null,
    });
    
    if (success) {
      setEditingAllergy(null);
      resetForm();
    }
    setIsSubmitting(false);
  };

  const handleRemoveAllergy = async (id: string) => {
    if (confirm('このアレルギー情報を削除しますか？')) {
      await removeAllergy(id);
    }
  };

  const resetForm = () => {
    setNewAllergen('');
    setNewSeverity('mild');
    setNewNotes('');
  };

  const startEdit = (allergy: UserAllergy) => {
    setEditingAllergy(allergy);
    setNewAllergen(allergy.allergen);
    setNewSeverity(allergy.severity);
    setNewNotes(allergy.notes || '');
  };

  const getSeverityIcon = (severity: 'mild' | 'moderate' | 'severe') => {
    switch (severity) {
      case 'severe':
        return <AlertTriangle className="h-4 w-4" />;
      case 'moderate':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-500" />
            アレルギー管理
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Add Allergy Button */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                アレルギーを追加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>アレルギー情報を追加</DialogTitle>
                <DialogDescription>
                  アレルゲンと重症度を選択してください。
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="allergen">アレルゲン</Label>
                  <Select value={newAllergen} onValueChange={setNewAllergen}>
                    <SelectTrigger>
                      <SelectValue placeholder="アレルゲンを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_ALLERGENS.map((allergen) => (
                        <SelectItem key={allergen} value={allergen}>
                          {allergen}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="severity">重症度</Label>
                  <Select value={newSeverity} onValueChange={(value: 'mild' | 'moderate' | 'severe') => setNewSeverity(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mild">軽度 - 軽い症状</SelectItem>
                      <SelectItem value="moderate">中度 - 注意が必要</SelectItem>
                      <SelectItem value="severe">重度 - 危険</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">メモ（任意）</Label>
                  <Input
                    id="notes"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="症状や注意事項など"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleAddAllergy} disabled={!newAllergen || isSubmitting}>
                  {isSubmitting ? '追加中...' : '追加'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Allergy Dialog */}
          <Dialog open={!!editingAllergy} onOpenChange={(open) => !open && setEditingAllergy(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>アレルギー情報を編集</DialogTitle>
                <DialogDescription>
                  重症度とメモを変更できます。
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>アレルゲン</Label>
                  <div className="rounded-md border p-2 bg-gray-50">
                    {editingAllergy?.allergen}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-severity">重症度</Label>
                  <Select value={newSeverity} onValueChange={(value: 'mild' | 'moderate' | 'severe') => setNewSeverity(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mild">軽度 - 軽い症状</SelectItem>
                      <SelectItem value="moderate">中度 - 注意が必要</SelectItem>
                      <SelectItem value="severe">重度 - 危険</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-notes">メモ（任意）</Label>
                  <Input
                    id="edit-notes"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="症状や注意事項など"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingAllergy(null)}>
                  キャンセル
                </Button>
                <Button onClick={handleUpdateAllergy} disabled={isSubmitting}>
                  {isSubmitting ? '更新中...' : '更新'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Allergies List */}
          {allergies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p>登録されているアレルギーはありません</p>
              <p className="text-sm">上のボタンからアレルギー情報を追加できます</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allergies.map((allergy) => (
                <div
                  key={allergy.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {getSeverityIcon(allergy.severity)}
                    <div>
                      <div className="font-medium">{allergy.allergen}</div>
                      {allergy.notes && (
                        <div className="text-sm text-gray-600">{allergy.notes}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className={ALLERGEN_SEVERITY_COLORS[allergy.severity]}
                    >
                      {ALLERGEN_SEVERITY_LABELS[allergy.severity]}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(allergy)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAllergy(allergy.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}