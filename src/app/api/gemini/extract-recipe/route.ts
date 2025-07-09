import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
    const videoTitle = searchParams.get('title') || '';
    const videoDescription = searchParams.get('description') || '';
    const channelTitle = searchParams.get('channelTitle') || '';

    if (!videoTitle && !videoDescription) {
      return NextResponse.json({ error: '動画タイトルまたは説明文が必要です' }, { status: 400 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API キーが設定されていません' },
        { status: 500 }
      );
    }

    const extractedRecipe = await analyzeTextWithGemini({
      title: videoTitle,
      description: videoDescription,
      channelTitle,
      thumbnail: '',
    }, geminiApiKey);

    if (
      (extractedRecipe.ingredients && extractedRecipe.ingredients.length === 0) &&
      (extractedRecipe.steps && extractedRecipe.steps.length === 0)
    ) {
      return NextResponse.json(
        {
          error: '説明文からレシピ情報（材料と手順）を抽出できませんでした。',
        },
        { status: 422 }
      );
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
- 材料が見つからない場合は "ingredients": [] としてください。
- 手順が見つからない場合は "steps": [] としてください。
- servings と cookingTime が見つからない場合は、そのキーの値に null を設定してください。
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
      text = markdownMatch[1];
    } else {
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