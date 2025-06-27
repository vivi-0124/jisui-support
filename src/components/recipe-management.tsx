"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Plus,
  List,
  Trash2,
  Edit,
  MoreVertical,
  Clock,
  Video,
} from "lucide-react";
import { buttonVariants, iconColorVariants, cardVariants } from "@/lib/theme-variants";
import Image from "next/image";
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

interface AddPlaylistButtonProps {
  onSave: (playlist: Omit<Playlist, "id" | "user_id" | "created_at" | "updated_at">) => void;
  editingPlaylist?: Playlist | null;
  onEditComplete?: () => void;
  children: React.ReactNode;
}

function AddPlaylistButton({ 
  onSave, 
  editingPlaylist, 
  onEditComplete, 
  children 
}: AddPlaylistButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState<Omit<Playlist, "id" | "user_id" | "created_at" | "updated_at">>({
    name: "",
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
      alert("プレイリスト名を入力してください");
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
      name: "",
      description: null,
      videos: [],
    });
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingPlaylist ? "プレイリストを編集" : "新しいプレイリストを作成"}
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
              value={newPlaylist.description || ""}
              onChange={(e) =>
                setNewPlaylist({ ...newPlaylist, description: e.target.value })
              }
              placeholder="プレイリストの説明を入力してください"
              rows={3}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCloseDialog}>
            キャンセル
          </Button>
          <Button onClick={handleSavePlaylist} className={buttonVariants({ theme: "recipes" })}>
            {editingPlaylist ? "更新" : "作成"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AddVideoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVideo: (video: Omit<Video, "id" | "added_at">) => void;
}

function AddVideoDialog({ isOpen, onClose, onAddVideo }: AddVideoDialogProps) {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const extractVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const fetchVideoInfo = async (url: string) => {
    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new Error("有効なYouTube URLを入力してください");
    }

    try {
      const response = await fetch(`/api/youtube/search?videoId=${videoId}`);
      if (!response.ok) {
        throw new Error("動画情報の取得に失敗しました");
      }
      const data = await response.json();
      return data;
    } catch {
      // APIが利用できない場合のフォールバック
      return {
        title: videoTitle || "YouTube動画",
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        duration: "不明",
      };
    }
  };

  const handleAddVideo = async () => {
    if (!videoUrl.trim()) {
      alert("YouTube URLを入力してください");
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
      setVideoUrl("");
      setVideoTitle("");
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : "エラーが発生しました");
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
            className={buttonVariants({ theme: "recipes" })}
          >
            {isLoading ? "追加中..." : "追加"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PlaylistManagement() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isAddVideoDialogOpen, setIsAddVideoDialogOpen] = useState(false);
  
  const { user, loading } = useAuth();

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!user) {
        setPlaylists([]);
        return;
      }

      const { data, error } = await supabase
        .from('playlists')
        .select(`
          *,
          videos (*)
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error("Error fetching playlists:", error);
      } else {
        setPlaylists(data.map(p => ({
          ...p,
          videos: p.videos || []
        })) as Playlist[]);
      }
    };

    if (!loading) {
      fetchPlaylists();
    }
  }, [user, loading]);

  const totalVideos = playlists.reduce((total, playlist) => total + playlist.videos.length, 0);

  const handleSavePlaylist = async (playlistData: Omit<Playlist, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return;

    if (editingPlaylist) {
      const { data, error } = await supabase
        .from('playlists')
        .update({
          name: playlistData.name,
          description: playlistData.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingPlaylist.id)
        .select();

      if (error) {
        console.error("Error updating playlist:", error);
      } else if (data && data.length > 0) {
        setPlaylists(playlists.map(p => p.id === editingPlaylist.id ? { ...p, ...data[0], videos: p.videos } : p));
        if (selectedPlaylist?.id === editingPlaylist.id) {
          setSelectedPlaylist(prev => prev ? { ...prev, ...data[0], videos: prev.videos } : null);
        }
      }
    } else {
      const { data, error } = await supabase
        .from('playlists')
        .insert({
          user_id: user.id,
          name: playlistData.name,
          description: playlistData.description,
        })
        .select();

      if (error) {
        console.error("Error creating playlist:", error);
      } else if (data && data.length > 0) {
        setPlaylists([...playlists, { ...data[0], videos: [] }]);
      }
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    if (!user) return;

    if (confirm("このプレイリストを削除しますか？（関連する動画も削除されます）")) {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error("Error deleting playlist:", error);
      } else {
        setPlaylists(playlists.filter((playlist) => playlist.id !== id));
        if (selectedPlaylist?.id === id) {
          setSelectedPlaylist(null);
        }
      }
    }
  };

  const handleEditPlaylist = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
  };

  const handleEditComplete = () => {
    setEditingPlaylist(null);
  };

  const handleAddVideo = async (videoData: Omit<Video, "id" | "added_at">) => {
    if (!selectedPlaylist || !user) return;

    const { data, error } = await supabase
      .from('videos')
      .insert({
        playlist_id: selectedPlaylist.id,
        user_id: user.id,
        title: videoData.title,
        url: videoData.url,
        thumbnail: videoData.thumbnail,
        duration: videoData.duration || null,
      })
      .select();

    if (error) {
      console.error("Error adding video:", error);
    } else if (data && data.length > 0) {
      const newVideo = data[0] as Video;
      const updatedPlaylist = {
        ...selectedPlaylist,
        videos: [...selectedPlaylist.videos, newVideo],
        updated_at: new Date().toISOString(),
      };

      setPlaylists(playlists.map(p => p.id === selectedPlaylist.id ? updatedPlaylist : p));
      setSelectedPlaylist(updatedPlaylist);

      const { error: playlistUpdateError } = await supabase
        .from('playlists')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedPlaylist.id);

      if (playlistUpdateError) {
        console.error("Error updating playlist timestamp:", playlistUpdateError);
      }
    }
  };

  const handleDeleteVideo = async (playlistId: string, videoId: string) => {
    if (!user) return;

    if (confirm("この動画をプレイリストから削除しますか？")) {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId)
        .eq('playlist_id', playlistId)
        .eq('user_id', user.id);

      if (error) {
        console.error("Error deleting video:", error);
      } else {
        setPlaylists(playlists.map(playlist => 
          playlist.id === playlistId 
            ? { 
              ...playlist, 
              videos: playlist.videos.filter(video => video.id !== videoId),
              updated_at: new Date().toISOString()
            }
            : playlist
        ));
        
        if (selectedPlaylist?.id === playlistId) {
          setSelectedPlaylist(prev => prev ? {
            ...prev,
            videos: prev.videos.filter(video => video.id !== videoId),
            updated_at: new Date().toISOString()
          } : null);
        }

        const { error: playlistUpdateError } = await supabase
          .from('playlists')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', playlistId);

        if (playlistUpdateError) {
          console.error("Error updating playlist timestamp:", playlistUpdateError);
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <List className={iconColorVariants({ theme: "recipes" })} />
          <span>プレイリスト {playlists.length}個</span>
        </div>
        <div className="flex items-center gap-1">
          <Video className="w-4 h-4 text-blue-600" />
          <span>動画 {totalVideos}本</span>
        </div>
      </div>

      <div className="flex sm:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-semibold">レシピ管理</h2>
        {playlists.length > 0 && (
          <AddPlaylistButton 
            onSave={handleSavePlaylist}
            editingPlaylist={editingPlaylist}
            onEditComplete={handleEditComplete}
          >
            <Button className={buttonVariants({ theme: "recipes" })}>
              <Plus className="w-4 h-4 mr-2" />
              プレイリスト作成
            </Button>
          </AddPlaylistButton>
        )}
      </div>

      <div className="space-y-4">
        {playlists.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              {loading ? (
                <p className="text-gray-600">読み込み中...</p>
              ) : !user ? (
                <>
                  <Video className="w-16 h-16 mx-auto mb-4 text-blue-300" />
                  <h3 className="text-lg font-semibold mb-2">プレイリストが空です</h3>
                  <p className="text-gray-600 mb-4">
                    ログインしてプレイリストを管理しましょう
                  </p>
                  {/* 例: <Button onClick={() => openLoginModal()}>ログイン</Button> */}
                </>
              ) : (
                <>
                  <Video className="w-16 h-16 mx-auto mb-4 text-blue-300" />
                  <h3 className="text-lg font-semibold mb-2">
                    プレイリストが空です
                  </h3>
                  <p className="text-gray-600 mb-4">
                    最初のプレイリストを作成して動画を整理しましょう
                  </p>
                  <AddPlaylistButton 
                    onSave={handleSavePlaylist}
                    editingPlaylist={editingPlaylist}
                    onEditComplete={handleEditComplete}
                  >
                    <Button className={buttonVariants({ theme: "recipes" })}>
                      <Plus className="w-4 h-4 mr-2" />
                      プレイリスト作成
                    </Button>
                  </AddPlaylistButton>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {playlists.map((playlist) => (
              <AccordionItem key={playlist.id} value={playlist.id} className="border-0">
                <Card className={cardVariants({ theme: "recipes" })}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <AccordionTrigger className="hover:no-underline p-0">
                          <div className="flex items-center gap-3 text-left">
                            <div>
                              <CardTitle className="text-lg">{playlist.name}</CardTitle>
                              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                <span>{playlist.videos.length}本の動画</span>
                                <span>作成日: {new Date(playlist.created_at).toLocaleDateString("ja-JP")}</span>
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditPlaylist(playlist)}>
                              <Edit className="w-4 h-4 mr-2" />
                              編集
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedPlaylist(playlist);
                                setIsAddVideoDialogOpen(true);
                              }}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              動画追加
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeletePlaylist(playlist.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              削除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    {playlist.description && (
                      <p className="text-gray-600 text-sm mt-2">{playlist.description}</p>
                    )}
                  </CardHeader>
                  <AccordionContent>
                    <CardContent className="pt-0">
                      {playlist.videos.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Video className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p className="mb-4">動画がありません</p>
                          <Button
                            onClick={() => {
                              setSelectedPlaylist(playlist);
                              setIsAddVideoDialogOpen(true);
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            動画を追加
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {playlist.videos.map((video, index) => (
                            <div
                              key={video.id}
                              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div className="text-sm text-gray-500 font-mono w-8 text-center">
                                {index + 1}
                              </div>
                              <a 
                                href={video.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative w-24 h-14 flex-shrink-0 block"
                              >
                                <Image
                                  src={video.thumbnail}
                                  alt={video.title}
                                  width={96}
                                  height={56}
                                  className="object-cover rounded"
                                  onError={(e) => {
                                    e.currentTarget.src = "/placeholder-video.png";
                                  }}
                                />
                              </a>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">{video.title}</h4>
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                  <Clock className="w-3 h-3" />
                                  <span>{video.duration}</span>
                                  <span>•</span>
                                  <span>追加日: {new Date(video.added_at).toLocaleDateString("ja-JP")}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteVideo(playlist.id, video.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
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