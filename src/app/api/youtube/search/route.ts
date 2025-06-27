import { NextRequest, NextResponse } from 'next/server';

interface YouTubeSearchResponse {
  items: Array<{
    id: {
      videoId: string;
    };
    snippet: {
      title: string;
      channelTitle: string;
      description: string;
      thumbnails: {
        medium: {
          url: string;
        };
      };
      publishedAt: string;
    };
  }>;
}

interface YouTubeVideoDetailsResponse {
  items: Array<{
    id: string;
    contentDetails: {
      duration: string;
    };
    statistics: {
      viewCount: string;
    };
    snippet: {
      title: string;
      description: string;
      channelTitle: string;
      thumbnails: {
        medium: {
          url: string;
        };
      };
      publishedAt: string;
    };
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: '検索クエリが必要です' },
        { status: 400 }
      );
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'YouTube API キーが設定されていません' },
        { status: 500 }
      );
    }

    // YouTube Data APIで動画検索
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + ' レシピ 料理')}&type=video&maxResults=12&key=${apiKey}`;

    const searchResponse = await fetch(searchUrl);

    if (!searchResponse.ok) {
      const errorData = await searchResponse.text();
      console.error('YouTube検索エラー:', errorData);
      return NextResponse.json(
        { error: 'YouTube検索に失敗しました' },
        { status: searchResponse.status }
      );
    }

    const searchData: YouTubeSearchResponse = await searchResponse.json();

    if (!searchData.items || searchData.items.length === 0) {
      return NextResponse.json({
        videos: [],
        message: '検索結果が見つかりませんでした',
      });
    }

    // 動画IDを取得
    const videoIds = searchData.items.map((item) => item.id.videoId).join(',');

    // 動画の詳細情報を取得（再生時間、再生回数など）
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics,snippet&id=${videoIds}&key=${apiKey}`;

    const detailsResponse = await fetch(detailsUrl);
    const detailsData: YouTubeVideoDetailsResponse =
      await detailsResponse.json();

    // 検索結果と詳細情報をマージ
    const videos = searchData.items.map((item) => {
      const details = detailsData.items?.find(
        (detail) => detail.id === item.id.videoId
      );

      const snippet = details?.snippet || item.snippet;

      return {
        videoId: item.id.videoId,
        title: snippet.title,
        channelName: snippet.channelTitle,
        thumbnailUrl: snippet.thumbnails.medium.url,
        description: snippet.description,
        duration: details?.contentDetails.duration || undefined,
        viewCount: details?.statistics.viewCount
          ? parseInt(details.statistics.viewCount)
          : undefined,
        publishedAt: snippet.publishedAt,
      };
    });

    return NextResponse.json({ videos });
  } catch (error) {
    console.error('YouTube API エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
