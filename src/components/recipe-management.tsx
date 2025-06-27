'use client';

import React, { useState, useEffect } from 'react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Plus,
  List,
  Trash2,
  Edit,
  MoreVertical,
  Clock,
  Video,
} from 'lucide-react';
import {
  buttonVariants,
  iconColorVariants,
  cardVariants,
} from '@/lib/theme-variants';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Video {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration?: string;
  added_at: string;
}

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  videos: Video[];
  created_at: string;
  updated_at: string;
}

interface RecipeManagementProps {
  playlists: Playlist[];
  setPlaylists: React.Dispatch<React.SetStateAction<Playlist[]>>;
}

interface AddPlaylistButtonProps {
  onSave: (
    playlist: Omit<Playlist, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => void;
  editingPlaylist?: Playlist | null;
  onEditComplete?: () => void;
  children: React.ReactNode;
}

function AddPlaylistButton({
  onSave,
  editingPlaylist,
  onEditComplete,
  children,
}: AddPlaylistButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState<
    Omit<Playlist, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  >({
    name: '',
    description: null,
    videos: [],
  });

  useEffect(() => {
    if (editingPlaylist) {
      setNewPlaylist({
        name: editingPlaylist.name,
        description: editingPlaylist.description,
        videos: editingPlaylist.videos,
      });
      setIsDialogOpen(true);
    }
  }, [editingPlaylist]);

  const handleSavePlaylist = () => {
    if (!newPlaylist.name.trim()) {
      alert('プレイリスト名を入力してください');
      return;
    }

    onSave(newPlaylist);
    handleCloseDialog();
    if (editingPlaylist && onEditComplete) {
      onEditComplete();
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
    if (editingPlaylist && onEditComplete) {
      onEditComplete();
    }
  };

  const resetForm = () => {
    setNewPlaylist({
      name: '',
      description: null,
      videos: [],
    });
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingPlaylist
              ? 'プレイリストを編集'
              : '新しいプレイリストを作成'}
          </DialogTitle>
          <DialogDescription>
            プレイリストの詳細情報を入力してください。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="name">プレイリスト名 *</Label>
            <Input
              id="name"
              value={newPlaylist.name}
              onChange={(e) =>
                setNewPlaylist({ ...newPlaylist, name: e.target.value })
              }
              placeholder="例: お気に入りの料理動画"
            />
          </div>
          <div>
            <Label htmlFor="description">説明</Label>
            <textarea
              id="description"
              value={newPlaylist.description || ''}
              onChange={(e) =>
                setNewPlaylist({ ...newPlaylist, description: e.target.value })
              }
              placeholder="プレイリストの説明を入力してください"
              rows={3}
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCloseDialog}>
            キャンセル
          </Button>
          <Button
            onClick={handleSavePlaylist}
            className={buttonVariants({ theme: 'recipes' })}
          >
            {editingPlaylist ? '更新' : '作成'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AddVideoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVideo: (video: Omit<Video, 'id' | 'added_at'>) => void;
}

function AddVideoDialog({ isOpen, onClose, onAddVideo }: AddVideoDialogProps) {
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const extractVideoId = (url: string) => {
    const regex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const fetchVideoInfo = async (url: string) => {
    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new Error('有効なYouTube URLを入力してください');
    }

    try {
      const response = await fetch(`/api/youtube/search?videoId=${videoId}`);
      if (!response.ok) {
        throw new Error('動画情報の取得に失敗しました');
      }
      const data = await response.json();
      return data;
    } catch {
      // APIが利用できない場合のフォールバック
      return {
        title: videoTitle || 'YouTube動画',
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        duration: '不明',
      };
    }
  };

  const handleAddVideo = async () => {
    if (!videoUrl.trim()) {
      alert('YouTube URLを入力してください');
      return;
    }

    setIsLoading(true);
    try {
      const videoInfo = await fetchVideoInfo(videoUrl);
      onAddVideo({
        title: videoInfo.title,
        url: videoUrl,
        thumbnail: videoInfo.thumbnail,
        duration: videoInfo.duration,
      });
      setVideoUrl('');
      setVideoTitle('');
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>動画を追加</DialogTitle>
          <DialogDescription>
            YouTube URLを入力して動画をプレイリストに追加してください。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="videoUrl">YouTube URL *</Label>
            <Input
              id="videoUrl"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>
          <div>
            <Label htmlFor="videoTitle">動画タイトル（オプション）</Label>
            <Input
              id="videoTitle"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="動画のタイトルを入力"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button
            onClick={handleAddVideo}
            disabled={isLoading}
            className={buttonVariants({ theme: 'recipes' })}
          >
            {isLoading ? '追加中...' : '追加'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function RecipeManagement({
  playlists,
  setPlaylists,
}: RecipeManagementProps) {
  const { user } = useAuth();
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [isAddVideoDialogOpen, setIsAddVideoDialogOpen] = useState(false);

  const handleSavePlaylist = async (
    playlistData: Omit<Playlist, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => {
    if (!user) return;

    if (editingPlaylist) {
      // Update existing playlist
      const { data, error } = await supabase
        .from('playlists')
        .update({
          name: playlistData.name,
          description: playlistData.description,
        })
        .eq('id', editingPlaylist.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating playlist:', error);
      } else {
        setPlaylists(
          playlists.map((p) => (p.id === data.id ? { ...p, ...data } : p))
        );
      }
    } else {
      // Create new playlist
      const { data, error } = await supabase
        .from('playlists')
        .insert([{ ...playlistData, user_id: user.id }])
        .select()
        .single();

      if (error) {
        console.error('Error creating playlist:', error);
      } else {
        setPlaylists([...playlists, { ...data, videos: [] }]);
      }
    }
    setEditingPlaylist(null);
  };

  const handleDeletePlaylist = async (id: string) => {
    if (!user) return;

    if (
      confirm('このプレイリストを削除しますか？（関連する動画も削除されます）')
    ) {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting playlist:', error);
      } else {
        setPlaylists(playlists.filter((p) => p.id !== id));
      }
    }
  };

  const handleEditPlaylist = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
  };

  const handleEditComplete = () => {
    setEditingPlaylist(null);
  };

  const handleAddVideo = async (videoData: Omit<Video, 'id' | 'added_at'>) => {
    if (!activePlaylistId || !user) return;

    const { data, error } = await supabase
      .from('playlist_videos')
      .insert([
        {
          playlist_id: activePlaylistId,
          video_title: videoData.title,
          video_url: videoData.url,
          thumbnail_url: videoData.thumbnail,
          duration: videoData.duration,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error adding video to playlist:', error);
    } else {
      const newVideo = {
        id: data.id,
        title: data.video_title,
        url: data.video_url,
        thumbnail: data.thumbnail_url,
        duration: data.duration,
        added_at: data.created_at,
      };

      setPlaylists(
        playlists.map((p) =>
          p.id === activePlaylistId
            ? { ...p, videos: [...p.videos, newVideo] }
            : p
        )
      );
    }
  };

  const handleDeleteVideo = async (playlistId: string, videoId: string) => {
    const { error } = await supabase
      .from('playlist_videos')
      .delete()
      .eq('id', videoId);

    if (error) {
      console.error('Error deleting video:', error);
    } else {
      setPlaylists(
        playlists.map((p) =>
          p.id === playlistId
            ? { ...p, videos: p.videos.filter((v) => v.id !== videoId) }
            : p
        )
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <List className={iconColorVariants({ theme: 'recipes' })} />
          <span>プレイリスト {playlists.length}個</span>
        </div>
        <div className="flex items-center gap-1">
          <Video className="h-4 w-4 text-blue-600" />
          <span>
            動画{' '}
            {playlists.reduce(
              (total, playlist) => total + playlist.videos.length,
              0
            )}
            本
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:flex-row">
        <h2 className="text-xl font-semibold">レシピ管理</h2>
        {playlists.length > 0 && (
          <AddPlaylistButton
            onSave={handleSavePlaylist}
            editingPlaylist={editingPlaylist}
            onEditComplete={handleEditComplete}
          >
            <Button className={buttonVariants({ theme: 'recipes' })}>
              <Plus className="mr-2 h-4 w-4" />
              プレイリスト作成
            </Button>
          </AddPlaylistButton>
        )}
      </div>

      <div className="space-y-4">
        {playlists.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              {user ? (
                <>
                  <Video className="mx-auto mb-4 h-16 w-16 text-blue-300" />
                  <h3 className="mb-2 text-lg font-semibold">
                    プレイリストが空です
                  </h3>
                  <p className="mb-4 text-gray-600">
                    最初のプレイリストを作成して動画を整理しましょう
                  </p>
                  <AddPlaylistButton
                    onSave={handleSavePlaylist}
                    editingPlaylist={editingPlaylist}
                    onEditComplete={handleEditComplete}
                  >
                    <Button className={buttonVariants({ theme: 'recipes' })}>
                      <Plus className="mr-2 h-4 w-4" />
                      プレイリスト作成
                    </Button>
                  </AddPlaylistButton>
                </>
              ) : (
                <>
                  <Video className="mx-auto mb-4 h-16 w-16 text-blue-300" />
                  <h3 className="mb-2 text-lg font-semibold">
                    プレイリストが空です
                  </h3>
                  <p className="mb-4 text-gray-600">
                    ログインしてプレイリストを管理しましょう
                  </p>
                  {/* 例: <Button onClick={() => openLoginModal()}>ログイン</Button> */}
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {playlists.map((playlist) => (
              <AccordionItem
                key={playlist.id}
                value={playlist.id}
                className="border-0"
              >
                <Card className={cardVariants({ theme: 'recipes' })}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <AccordionTrigger className="p-0 hover:no-underline">
                          <div className="flex items-center gap-3 text-left">
                            <div>
                              <CardTitle className="text-lg">
                                {playlist.name}
                              </CardTitle>
                              <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
                                <span>{playlist.videos.length}本の動画</span>
                                <span>
                                  作成日:{' '}
                                  {new Date(
                                    playlist.created_at
                                  ).toLocaleDateString('ja-JP')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                      </div>
                      <div className="ml-4 flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEditPlaylist(playlist)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              編集
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setActivePlaylistId(playlist.id);
                                setIsAddVideoDialogOpen(true);
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              動画追加
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeletePlaylist(playlist.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              削除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    {playlist.description && (
                      <p className="mt-2 text-sm text-gray-600">
                        {playlist.description}
                      </p>
                    )}
                  </CardHeader>
                  <AccordionContent>
                    <CardContent className="pt-0">
                      {playlist.videos.length === 0 ? (
                        <div className="py-8 text-center text-gray-500">
                          <Video className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                          <p className="mb-4">動画がありません</p>
                          <Button
                            onClick={() => {
                              setActivePlaylistId(playlist.id);
                              setIsAddVideoDialogOpen(true);
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            動画を追加
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {playlist.videos.map((video, index) => (
                            <div
                              key={video.id}
                              className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                            >
                              <div className="w-8 text-center font-mono text-sm text-gray-500">
                                {index + 1}
                              </div>
                              <a
                                href={video.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative block h-14 w-24 flex-shrink-0"
                              >
                                <Image
                                  src={video.thumbnail}
                                  alt={video.title}
                                  width={96}
                                  height={56}
                                  className="rounded object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src =
                                      '/placeholder-video.png';
                                  }}
                                />
                              </a>
                              <div className="min-w-0 flex-1">
                                <h4 className="truncate text-sm font-medium">
                                  {video.title}
                                </h4>
                                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                                  <Clock className="h-3 w-3" />
                                  <span>{video.duration}</span>
                                  <span>•</span>
                                  <span>
                                    追加日:{' '}
                                    {new Date(
                                      video.added_at
                                    ).toLocaleDateString('ja-JP')}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleDeleteVideo(playlist.id, video.id)
                                  }
                                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      <AddPlaylistButton
        onSave={handleSavePlaylist}
        editingPlaylist={editingPlaylist}
        onEditComplete={handleEditComplete}
      >
        <div style={{ display: 'none' }} />
      </AddPlaylistButton>

      <AddVideoDialog
        isOpen={isAddVideoDialogOpen}
        onClose={() => setIsAddVideoDialogOpen(false)}
        onAddVideo={handleAddVideo}
      />
    </div>
  );
}
