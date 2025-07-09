import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { extractVideoId } from '@/utils/helpers';
import { ERROR_MESSAGES } from '@/constants';
import type { Playlist, PlaylistFormData, Video, VideoFormData } from '@/types';

export const usePlaylists = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // データを読み込み
  const loadPlaylists = useCallback(async () => {
    if (!user) {
      setPlaylists([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('playlists')
        .select(`
          *,
          videos (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const normalizedPlaylists = (data || []).map(p => ({
        ...p,
        videos: p.videos || [],
      })) as Playlist[];
      
      setPlaylists(normalizedPlaylists);
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.loadError);
      console.error('Error loading playlists:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // プレイリストを追加/更新
  const savePlaylist = useCallback(async (
    playlistData: PlaylistFormData,
    editingId?: string
  ): Promise<boolean> => {
    if (!user) {
      setError(ERROR_MESSAGES.loginRequired);
      return false;
    }

    try {
      if (editingId) {
        // 更新
        const { data, error } = await supabase
          .from('playlists')
          .update({
            name: playlistData.name,
            description: playlistData.description,
          })
          .eq('id', editingId)
          .select(`
            *,
            videos (*)
          `)
          .single();

        if (error) throw error;
        setPlaylists(prev => prev.map(p => p.id === data.id ? {
          ...data,
          videos: data.videos || [],
        } : p));
      } else {
        // 新規作成
        const { data, error } = await supabase
          .from('playlists')
          .insert([{
            name: playlistData.name,
            description: playlistData.description,
            user_id: user.id,
          }])
          .select(`
            *,
            videos (*)
          `)
          .single();

        if (error) throw error;
        setPlaylists(prev => [...prev, {
          ...data,
          videos: data.videos || [],
        }]);
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.saveError);
      console.error('Error saving playlist:', err);
      return false;
    }
  }, [user]);

  // プレイリストを削除
  const deletePlaylist = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      setError(ERROR_MESSAGES.loginRequired);
      return false;
    }

    try {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPlaylists(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.saveError);
      console.error('Error deleting playlist:', err);
      return false;
    }
  }, [user]);

  // 動画を追加
  const addVideo = useCallback(async (
    playlistId: string,
    videoData: VideoFormData
  ): Promise<boolean> => {
    if (!user) {
      setError(ERROR_MESSAGES.loginRequired);
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('videos')
        .insert([{
          playlist_id: playlistId,
          title: videoData.title,
          url: videoData.url,
          thumbnail: videoData.thumbnail,
          duration: videoData.duration,
        }])
        .select()
        .single();

      if (error) throw error;
      
      setPlaylists(prev => prev.map(playlist => 
        playlist.id === playlistId
          ? { ...playlist, videos: [...playlist.videos, data] }
          : playlist
      ));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.saveError);
      console.error('Error adding video:', err);
      return false;
    }
  }, [user]);

  // 動画を削除
  const deleteVideo = useCallback(async (
    playlistId: string,
    videoId: string
  ): Promise<boolean> => {
    if (!user) {
      setError(ERROR_MESSAGES.loginRequired);
      return false;
    }

    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;
      
      setPlaylists(prev => prev.map(playlist => 
        playlist.id === playlistId
          ? { ...playlist, videos: playlist.videos.filter(v => v.id !== videoId) }
          : playlist
      ));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.saveError);
      console.error('Error deleting video:', err);
      return false;
    }
  }, [user]);

  // YouTube動画を既存のプレイリストに保存
  const saveVideoToPlaylist = useCallback(async (
    playlistId: string,
    videoData: {
      title: string;
      url: string;
      thumbnail: string;
      duration?: string;
    }
  ): Promise<boolean> => {
    if (!user) {
      setError(ERROR_MESSAGES.loginRequired);
      return false;
    }

    // 動画IDを抽出してURLを正規化
    const videoId = extractVideoId(videoData.url);
    if (!videoId) {
      setError(ERROR_MESSAGES.invalidUrl);
      return false;
    }

    const normalizedUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // 同じ動画が既に存在するかチェック
    const targetPlaylist = playlists.find(p => p.id === playlistId);
    if (targetPlaylist?.videos.some(v => v.url === normalizedUrl)) {
      setError('この動画は既にプレイリストに追加されています');
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('videos')
        .insert([{
          playlist_id: playlistId,
          title: videoData.title,
          url: normalizedUrl,
          thumbnail: videoData.thumbnail,
          duration: videoData.duration,
        }])
        .select()
        .single();

      if (error) throw error;
      
      setPlaylists(prev => prev.map(playlist => 
        playlist.id === playlistId
          ? { ...playlist, videos: [...playlist.videos, data] }
          : playlist
      ));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.saveError);
      console.error('Error saving video to playlist:', err);
      return false;
    }
  }, [user, playlists]);

  // 新しいプレイリストを作成して動画を保存
  const createPlaylistWithVideo = useCallback(async (
    playlistData: PlaylistFormData,
    videoData: {
      title: string;
      url: string;
      thumbnail: string;
      duration?: string;
    }
  ): Promise<boolean> => {
    if (!user) {
      setError(ERROR_MESSAGES.loginRequired);
      return false;
    }

    try {
      // まずプレイリストを作成
      const { data: playlistResult, error: playlistError } = await supabase
        .from('playlists')
        .insert([{
          name: playlistData.name,
          description: playlistData.description,
          user_id: user.id,
        }])
        .select()
        .single();

      if (playlistError) throw playlistError;

      // 次に動画を追加
      const videoId = extractVideoId(videoData.url);
      if (!videoId) {
        setError(ERROR_MESSAGES.invalidUrl);
        return false;
      }

      const normalizedUrl = `https://www.youtube.com/watch?v=${videoId}`;

      const { data: videoResult, error: videoError } = await supabase
        .from('videos')
        .insert([{
          playlist_id: playlistResult.id,
          title: videoData.title,
          url: normalizedUrl,
          thumbnail: videoData.thumbnail,
          duration: videoData.duration,
        }])
        .select()
        .single();

      if (videoError) throw videoError;

      // 状態を更新
      const newPlaylist: Playlist = {
        ...playlistResult,
        videos: [videoResult],
      };
      setPlaylists(prev => [...prev, newPlaylist]);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.saveError);
      console.error('Error creating playlist with video:', err);
      return false;
    }
  }, [user]);

  // すべての動画を取得（プレイリスト横断）
  const getAllVideos = useCallback((): Video[] => {
    return playlists.flatMap(playlist => playlist.videos);
  }, [playlists]);

  // 特定のプレイリストを取得
  const getPlaylistById = useCallback((id: string): Playlist | undefined => {
    return playlists.find(p => p.id === id);
  }, [playlists]);

  // 統計情報を計算
  const getStats = useCallback(() => {
    const totalPlaylists = playlists.length;
    const totalVideos = getAllVideos().length;
    const playlistsWithVideos = playlists.filter(p => p.videos.length > 0).length;

    return {
      totalPlaylists,
      totalVideos,
      playlistsWithVideos,
      averageVideosPerPlaylist: totalPlaylists > 0 ? Math.round(totalVideos / totalPlaylists) : 0,
    };
  }, [playlists, getAllVideos]);

  // データ読み込み
  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  // エラーをクリア
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    playlists,
    loading,
    error,
    savePlaylist,
    deletePlaylist,
    addVideo,
    deleteVideo,
    saveVideoToPlaylist,
    createPlaylistWithVideo,
    getAllVideos,
    getPlaylistById,
    getStats,
    loadPlaylists,
    clearError,
  };
}; 