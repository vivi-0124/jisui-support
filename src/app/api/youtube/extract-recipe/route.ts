import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/utils/supabase/server';

interface YouTubeVideoDetailsResponse {
  items: Array<{
    id: string;
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

interface ExtractedRecipe {
  title: string;
  ingredients: string[];
  steps: string[];
  servings?: string;
  cookingTime?: string;
  description: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json({ error: '動画IDが必要です' }, { status: 400 });
    }

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. データベースでレシピを検索 (ログインしている場合)
    if (user) {
      const { data: dbRecipe, error: dbError } = await supabase
        .from('extracted_recipes')
        .select('*')
        .eq('user_id', user.id)
        .eq('video_id', videoId)
        .single();

      if (dbError && dbError.code !== 'PGRST116') {
        console.error('DB読み込みエラー:', dbError);
      }

      if (dbRecipe) {
        console.log('レシピをデータベースから取得しました');
        return NextResponse.json({
          recipe: {
            title: dbRecipe.title,
            ingredients: dbRecipe.ingredients || [],
            steps: dbRecipe.steps || [],
            servings: dbRecipe.servings,
            cookingTime: dbRecipe.cooking_time,
            description: dbRecipe.description || '',
          } as ExtractedRecipe,
        });
      }
    }

    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!youtubeApiKey) {
      return NextResponse.json(
        { error: 'YouTube API キーが設定されていません' },
        { status: 500 }
      );
    }

    // 2. 動画の基本情報を取得
    const videoDetails = await getVideoDetails(videoId, youtubeApiKey);
    if (!videoDetails) {
      return NextResponse.json(
        { error: '動画が見つかりませんでした' },
        { status: 404 }
      );
    }

    let extractedRecipe: ExtractedRecipe;

    // 3. Gemini APIが利用可能な場合はテキスト分析を試行
    if (geminiApiKey) {
      try {
        console.log('Gemini APIでテキスト分析を開始...');
        extractedRecipe = await analyzeTextWithGemini(
          videoDetails,
          geminiApiKey
        );
        console.log('Gemini APIでテキスト分析完了');
      } catch (geminiError) {
        console.error('Geminiテキスト分析失敗:', geminiError);
        return NextResponse.json(
          { error: 'AIによるレシピの抽出に失敗しました。' },
          { status: 500 }
        );
      }
    } else {
      // Gemini APIが利用できない場合はエラー
      console.error('Gemini APIキーが設定されていません。');
      return NextResponse.json(
        { error: 'レシピ抽出機能が設定されていません。' },
        { status: 500 }
      );
    }

    // 抽出結果の検証
    if (
      (extractedRecipe.ingredients &&
        extractedRecipe.ingredients.length === 0) &&
      (extractedRecipe.steps && extractedRecipe.steps.length === 0)
    ) {
      return NextResponse.json(
        {
          error:
            '動画の説明欄からレシピ情報（材料と手順）を抽出できませんでした。',
        },
        { status: 422 }
      );
    }

    // 4. 分析結果をデータベースに保存 (ログインしている場合)
    if (user && videoDetails) {
      try {
        const { error: saveError } = await supabase
          .from('extracted_recipes')
          .insert({
            user_id: user.id,
            video_id: videoId,
            title: extractedRecipe.title,
            ingredients: extractedRecipe.ingredients,
            steps: extractedRecipe.steps,
            servings: extractedRecipe.servings,
            cooking_time: extractedRecipe.cookingTime,
            description: videoDetails.description,
            video_url: `https://www.youtube.com/watch?v=${videoId}`,
            video_title: videoDetails.title,
            video_thumbnail: videoDetails.thumbnail,
          });

        if (saveError) {
          console.error('DB保存エラー:', saveError);
        } else {
          console.log('レシピをデータベースに保存しました');
        }
      } catch (e) {
        console.error('DB保存中に予期せぬエラー:', e);
      }
    }

    return NextResponse.json({ recipe: extractedRecipe });
  } catch (error) {
    console.error('レシピ抽出エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

async function getVideoDetails(videoId: string, apiKey: string) {
  const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;
  const response = await fetch(detailsUrl);

  if (!response.ok) {
    throw new Error('動画詳細の取得に失敗しました');
  }

  const data: YouTubeVideoDetailsResponse = await response.json();

  if (!data.items || data.items.length === 0) {
    return null;
  }

  const snippet = data.items[0].snippet;
  return {
    title: snippet.title,
    description: snippet.description,
    channelTitle: snippet.channelTitle,
    thumbnail: snippet.thumbnails.medium.url,
  };
}

async function analyzeTextWithGemini(
  videoDetails: {
    title: string;
    description: string;
    channelTitle: string;
    thumbnail: string;
  },
  apiKey: string
): Promise<ExtractedRecipe> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

  const prompt = `あなたは料理レシピ抽出の専門家です。
以下のYouTube料理動画の情報から、レシピを抽出し、指定されたJSON形式で出力してください。

# 入力情報
- タイトル: ${videoDetails.title}
- 説明文: ${videoDetails.description}
- チャンネル名: ${videoDetails.channelTitle}

# 出力形式
必ず以下のJSON形式に従ってください。
説明文に記載がない項目は、キーはそのままに、値はnullまたは空配列にしてください。
JSON以外のテキスト（例：「はい、承知しました」などの前置き）は一切含めないでください。

{
  "ingredients": ["材料1", "材料2", ...],
  "steps": ["手順1", "手順2", ...],
  "servings": "X人分",
  "cookingTime": "X分"
}

# 指示
- 説明文から材料（分量含む）と手順を正確に抜き出してください。
- 材料が見つからない場合は \`"ingredients": []\` としてください。
- 手順が見つからない場合は \`"steps": []\` としてください。
- \`servings\` と \`cookingTime\` が見つからない場合は、そのキーの値に \`null\` を設定してください。
- 説明文に書かれていないことは絶対に推測しないでください。
- 必ず日本語で、指定されたJSON形式のみを出力してください。
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // AIの応答からJSON部分を抽出するロジックを強化
    const markdownMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
      // 1. Markdownブロックがある場合は、その中身を抽出
      text = markdownMatch[1];
    } else {
      // 2. ない場合は、最初と最後の波括弧で囲まれた部分を抽出
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        text = text.slice(firstBrace, lastBrace + 1);
      }
    }

    const recipeData = JSON.parse(text);

    return {
      title: videoDetails.title,
      ingredients: recipeData.ingredients || [],
      steps: recipeData.steps || [],
      servings: recipeData.servings,
      cookingTime: recipeData.cookingTime,
      description: videoDetails.description,
    };
  } catch (error) {
    console.error('Geminiテキスト分析エラー:', error);
    throw error;
  }
}
