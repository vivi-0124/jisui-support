import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';

interface ExtractedRecipe {
  title: string;
  ingredients: string[];
  steps: string[];
  servings?: string;
  cookingTime?: string;
  description: string;
}

export function AIRecipeExtract() {
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<ExtractedRecipe | null>(null);

  // YouTube動画IDを抽出
  const extractVideoId = (url: string): string | null => {
    const match = url.match(/(?:v=|youtu\.be\/|\/embed\/)([\w-]{11})/);
    return match ? match[1] : null;
  };

  // YouTube Data APIで動画情報を取得
  const fetchVideoInfo = async (videoId: string) => {
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    if (!apiKey) throw new Error('YouTube APIキーが設定されていません');
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('動画情報の取得に失敗しました');
    const data = await res.json();
    if (!data.items || data.items.length === 0) throw new Error('動画が見つかりません');
    const snippet = data.items[0].snippet;
    return {
      title: snippet.title,
      description: snippet.description,
      channelTitle: snippet.channelTitle,
    };
  };

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRecipe(null);
    setLoading(true);
    try {
      const videoId = extractVideoId(videoUrl);
      if (!videoId) throw new Error('有効なYouTube動画URLを入力してください');
      const videoInfo = await fetchVideoInfo(videoId);
      const params = new URLSearchParams({
        title: videoInfo.title,
        description: videoInfo.description,
        channelTitle: videoInfo.channelTitle,
      });
      const res = await fetch(`/api/gemini/extract-recipe?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || '抽出に失敗しました');
      setRecipe(data.recipe);
    } catch (err) {
      setError(err instanceof Error ? err.message : '抽出中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      <h2 className="text-xl font-semibold">YouTube動画からAIでレシピ抽出</h2>
      <form onSubmit={handleExtract} className="flex gap-2">
        <Input
          type="text"
          placeholder="YouTube動画URLを入力"
          value={videoUrl}
          onChange={e => setVideoUrl(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={loading} className="shrink-0">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '抽出'}
        </Button>
      </form>
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}
      {recipe && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <h3 className="text-lg font-bold">{recipe.title}</h3>
            <div>
              <span className="font-semibold">材料:</span>
              <ul className="list-disc ml-5">
                {recipe.ingredients.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <span className="font-semibold">手順:</span>
              <ol className="list-decimal ml-5">
                {recipe.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
            {recipe.servings && <div>分量: {recipe.servings}</div>}
            {recipe.cookingTime && <div>調理時間: {recipe.cookingTime}</div>}
            {recipe.description && <div className="text-xs text-gray-500 mt-2">{recipe.description}</div>}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 