'use client';

import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog';
import { Button } from './button';
import { Share } from 'lucide-react';

interface AddToHomeScreenProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddToHomeScreen({ open, onOpenChange }: AddToHomeScreenProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ホーム画面に追加</DialogTitle>
          <DialogDescription>
            より便利にアプリを使用するために、ホーム画面に追加することをお勧めします。
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="relative aspect-[390/844] w-full max-w-[200px] mx-auto">
            <Image
              src="/add-to-home-screen.jpg"
              alt="ホーム画面に追加する方法"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <p className="inline-flex items-center gap-1 whitespace-nowrap">
                1. ブラウザの共有ボタン
                <Share className="h-5 w-5 shrink-0" />
                をタップ
              </p>
            </div>
            <div className="flex items-center gap-2">
              <p>2. 「ホーム画面に追加」を選択</p>
            </div>
            <div className="flex items-center gap-2">
              <p>3. 「追加」をタップして完了</p>
            </div>
          </div>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            閉じる
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 