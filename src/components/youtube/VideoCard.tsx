'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Eye,
  Clock,
  ExternalLink,
  Save,
  Plus,
  MoreVertical,
} from 'lucide-react';
import Image from 'next/image';
import { formatDuration, formatViewCount } from '@/utils/helpers';
import { usePlaylists } from '@/hooks';
import type { YouTubeVideo, Playlist } from '@/types';

interface VideoCardProps {
  video: YouTubeVideo;
  playlists: Playlist[];
  onLoginRequired: () => void;
}

export function VideoCard({
  video,
  playlists,
  onLoginRequired,
}: VideoCardProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const { saveVideoToPlaylist, createPlaylistWithVideo } = usePlaylists();

  const handleSaveClick = () => {
    if (playlists.length === 0) {
      onLoginRequired();
      return;
    }
    setSaveDialogOpen(true);
  };

  const createNewPlaylist = async () => {
    if (!newPlaylistName.trim()) {
      alert('プレイリスト名を入力してください');
      return;
    }

    setSaving(true);
    try {
      const success = await createPlaylistWithVideo(
        {
          name: newPlaylistName,
          description: null,
          videos: [],
        },
        {
          title: video.title,
          url: `https://www.youtube.com/watch?v=${video.videoId}`,
          thumbnail: video.thumbnailUrl,
          duration: video.duration,
        }
      );

      if (success) {
        alert('新しいプレイリストに動画を保存しました！');
        setSaveDialogOpen(false);
        setNewPlaylistName('');
      } else {
        alert('保存に失敗しました');
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert('保存中にエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  const saveToPlaylist = async () => {
    if (!selectedPlaylist) {
      alert('プレイリストを選択してください');
      return;
    }

    setSaving(true);
    try {
      const success = await saveVideoToPlaylist(selectedPlaylist, {
        title: video.title,
        url: `https://www.youtube.com/watch?v=${video.videoId}`,
        thumbnail: video.thumbnailUrl,
        duration: video.duration,
      });

      if (success) {
        alert('プレイリストに動画を保存しました！');
        setSaveDialogOpen(false);
        setSelectedPlaylist('');
      } else {
        alert('保存に失敗しました');
      }
    } catch (error) {
      console.error('Error saving to playlist:', error);
      alert('保存中にエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="flex gap-4 p-4">
          {/* サムネイル */}
          <div className="w-48 shrink-0">
            <AspectRatio ratio={16 / 9}>
              <Image
                src={video.thumbnailUrl}
                alt={video.title}
                fill
                className="rounded-md object-cover"
                sizes="(max-width: 768px) 100vw, 192px"
              />
            </AspectRatio>
          </div>

          {/* 動画情報 */}
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                {video.title}
              </h3>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <a
                      href={`https://www.youtube.com/watch?v=${video.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      YouTubeで開く
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <p className="text-sm text-gray-600 line-clamp-1">
              {video.channelName}
            </p>

            {/* 動画のメタ情報 */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              {video.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDuration(video.duration)}</span>
                </div>
              )}
              {video.viewCount && (
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>{formatViewCount(video.viewCount)}</span>
                </div>
              )}
              {video.publishedAt && (
                <div className="flex items-center gap-1">
                  <span>{new Date(video.publishedAt).toLocaleDateString('ja-JP')}</span>
                </div>
              )}
            </div>

            {/* 保存ボタン */}
            <div className="pt-2">
              <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    onClick={handleSaveClick}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Save className="mr-1 h-4 w-4" />
                    保存
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>プレイリストに保存</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {/* 既存のプレイリストに保存 */}
                    {playlists.length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">
                          既存のプレイリストに保存
                        </Label>
                        <div className="space-y-2">
                          {playlists.map((playlist) => (
                            <div
                              key={playlist.id}
                              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                selectedPlaylist === playlist.id
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => setSelectedPlaylist(playlist.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-sm">{playlist.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {playlist.videos.length}本の動画
                                  </p>
                                </div>
                                {selectedPlaylist === playlist.id && (
                                  <Badge variant="default" className="text-xs">
                                    選択中
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        {selectedPlaylist && (
                          <Button
                            onClick={saveToPlaylist}
                            disabled={saving}
                            className="w-full"
                          >
                            {saving ? '保存中...' : 'プレイリストに保存'}
                          </Button>
                        )}
                      </div>
                    )}

                    {/* 新しいプレイリストを作成 */}
                    <div className="space-y-3 pt-4 border-t">
                      <Label className="text-sm font-medium">
                        新しいプレイリストを作成
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="プレイリスト名"
                          value={newPlaylistName}
                          onChange={(e) => setNewPlaylistName(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          onClick={createNewPlaylist}
                          disabled={saving || !newPlaylistName.trim()}
                          size="sm"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSaveDialogOpen(false);
                        setSelectedPlaylist('');
                        setNewPlaylistName('');
                      }}
                    >
                      キャンセル
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 