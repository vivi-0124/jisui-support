import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
  extractionMethod: 'gemini_video_analysis' | 'gemini_text_analysis' | 'description';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json(
        { error: '動画IDが必要です' },
        { status: 400 }
      );
    }

    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!youtubeApiKey) {
      return NextResponse.json(
        { error: 'YouTube API キーが設定されていません' },
        { status: 500 }
      );
    }

    // 1. 動画の基本情報を取得
    const videoDetails = await getVideoDetails(videoId, youtubeApiKey);
    if (!videoDetails) {
      return NextResponse.json(
        { error: '動画が見つかりませんでした' },
        { status: 404 }
      );
    }

    let extractedRecipe: ExtractedRecipe;

    // 2. Gemini APIが利用可能な場合は動画分析を試行
    if (geminiApiKey) {
      try {
        console.log('Gemini APIで動画分析を開始...');
        extractedRecipe = await analyzeVideoWithGemini(
          videoId,
          videoDetails,
          geminiApiKey
        );
        console.log('Gemini APIで動画分析完了');
      } catch (geminiError) {
        console.log('Gemini動画分析失敗、テキスト分析にフォールバック:', geminiError);
        
        // 動画分析が失敗した場合はテキスト分析を試行
        try {
          extractedRecipe = await analyzeTextWithGemini(
            videoDetails,
            geminiApiKey
          );
        } catch (textError) {
          console.log('Geminiテキスト分析も失敗、説明文から抽出:', textError);
          extractedRecipe = extractRecipeFromDescription(
            videoDetails.title,
            videoDetails.description
          );
        }
      }
    } else {
      // Gemini APIが利用できない場合は説明文から抽出
      console.log('Gemini APIキーが設定されていません。説明文から抽出します。');
      extractedRecipe = extractRecipeFromDescription(
        videoDetails.title,
        videoDetails.description
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

  return {
    title: data.items[0].snippet.title,
    description: data.items[0].snippet.description,
    channelTitle: data.items[0].snippet.channelTitle,
  };
}

async function analyzeVideoWithGemini(
  videoId: string,
  videoDetails: any,
  apiKey: string
): Promise<ExtractedRecipe> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  // YouTube動画のURLを構築
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const prompt = `
この料理動画を分析して、以下の情報を抽出してください：

動画タイトル: ${videoDetails.title}
動画URL: ${videoUrl}

以下の形式でJSONで回答してください：
{
  "ingredients": [
    "材料名 分量単位",
    "例: 玉ねぎ 1個",
    "例: 醤油 大さじ2"
  ],
  "steps": [
    "手順1の詳細な説明",
    "手順2の詳細な説明"
  ],
  "servings": "何人分",
  "cookingTime": "調理時間（分）",
  "tips": "料理のコツやポイント"
}

重要な指示：
1. 材料は具体的な分量と単位を含めて記載してください
2. 手順は順序立てて、具体的に記載してください
3. 動画で実際に使用されている材料と手順のみを抽出してください
4. 推測ではなく、動画で確認できる内容のみを記載してください
5. 日本語で回答してください

動画の内容を詳しく分析して、正確な料理レシピを抽出してください。
`;

  try {
    // Gemini 1.5 Proは動画URLを直接分析できる
    const result = await model.generateContent([
      {
        text: prompt
      },
      {
        fileData: {
          mimeType: "video/*",
          fileUri: videoUrl
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    
    // JSONレスポンスをパース
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('有効なJSONレスポンスが見つかりません');
    }

    const recipeData = JSON.parse(jsonMatch[0]);

    return {
      title: videoDetails.title,
      ingredients: recipeData.ingredients || [],
      steps: recipeData.steps || [],
      servings: recipeData.servings,
      cookingTime: recipeData.cookingTime,
      description: videoDetails.description,
      extractionMethod: 'gemini_video_analysis',
    };
  } catch (error) {
    console.error('Gemini動画分析エラー:', error);
    throw error;
  }
}

async function analyzeTextWithGemini(
  videoDetails: any,
  apiKey: string
): Promise<ExtractedRecipe> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
以下のYouTube料理動画のタイトルと説明文から、料理のレシピ情報を抽出してください。

タイトル: ${videoDetails.title}
説明文: ${videoDetails.description}
チャンネル名: ${videoDetails.channelTitle}

以下の形式でJSONで回答してください：
{
  "ingredients": [
    "材料名 分量単位",
    "例: 玉ねぎ 1個",
    "例: 醤油 大さじ2"
  ],
  "steps": [
    "手順1の詳細な説明",
    "手順2の詳細な説明"
  ],
  "servings": "何人分",
  "cookingTime": "調理時間（分）"
}

重要な指示：
1. 材料は具体的な分量と単位を含めて記載してください
2. 手順は順序立てて、具体的に記載してください
3. 説明文に記載されていない情報は推測で補完してください
4. 料理名から一般的な材料や手順を推測して追加してください
5. 日本語で回答してください
6. 最低でも5つの材料と5つの手順を含めてください

料理の専門知識を活用して、実用的なレシピを作成してください。
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // JSONレスポンスをパース
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('有効なJSONレスポンスが見つかりません');
    }

    const recipeData = JSON.parse(jsonMatch[0]);

    return {
      title: videoDetails.title,
      ingredients: recipeData.ingredients || [],
      steps: recipeData.steps || [],
      servings: recipeData.servings,
      cookingTime: recipeData.cookingTime,
      description: videoDetails.description,
      extractionMethod: 'gemini_text_analysis',
    };
  } catch (error) {
    console.error('Geminiテキスト分析エラー:', error);
    throw error;
  }
}

function extractRecipeFromDescription(title: string, description: string): ExtractedRecipe {
  const lines = description.split('\n').map(line => line.trim()).filter(line => line);
  
  const ingredients: string[] = [];
  const steps: string[] = [];
  let servings: string | undefined;
  let cookingTime: string | undefined;
  
  let currentSection = '';
  let stepCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // セクションの判定
    if (lowerLine.includes('材料') || lowerLine.includes('ingredient')) {
      currentSection = 'ingredients';
      continue;
    }
    
    if (lowerLine.includes('作り方') || lowerLine.includes('手順') || 
        lowerLine.includes('レシピ') || lowerLine.includes('method') || 
        lowerLine.includes('instruction') || lowerLine.includes('step')) {
      currentSection = 'steps';
      stepCounter = 0;
      continue;
    }

    // 人数の抽出
    if (lowerLine.includes('人分') || lowerLine.includes('serving')) {
      const servingMatch = line.match(/(\d+)人分|(\d+)\s*serving/i);
      if (servingMatch) {
        servings = servingMatch[1] || servingMatch[2] + '人分';
      }
      continue;
    }

    // 調理時間の抽出
    if (lowerLine.includes('分') && (lowerLine.includes('時間') || lowerLine.includes('調理') || lowerLine.includes('time'))) {
      const timeMatch = line.match(/(\d+)分|(\d+)\s*min/i);
      if (timeMatch) {
        cookingTime = timeMatch[1] || timeMatch[2] + '分';
      }
      continue;
    }

    // 材料の抽出
    if (currentSection === 'ingredients') {
      if (line.match(/[・•\-\*]/) || 
          line.match(/\d+/) || 
          line.match(/(g|ml|個|本|枚|袋|パック|大さじ|小さじ|カップ|適量|少々)/)) {
        const cleanedLine = line.replace(/^[・•\-\*\s]+/, '');
        if (cleanedLine && !cleanedLine.includes('http') && cleanedLine.length < 100) {
          ingredients.push(cleanedLine);
        }
      }
    }

    // 手順の抽出
    if (currentSection === 'steps') {
      if (line.match(/^\d+[\.．\)）]/) || 
          line.match(/[・•\-\*]/) ||
          (stepCounter < 20 && line.length > 10 && line.length < 200)) {
        
        let cleanedLine = line.replace(/^\d+[\.．\)）\s]*/, '');
        cleanedLine = cleanedLine.replace(/^[・•\-\*\s]+/, '');
        
        if (cleanedLine && !cleanedLine.includes('http') && 
            !cleanedLine.includes('チャンネル') && 
            !cleanedLine.includes('登録')) {
          steps.push(cleanedLine);
          stepCounter++;
        }
      }
    }
  }

  // 材料が見つからない場合、タイトルから推測
  if (ingredients.length === 0) {
    const commonIngredients = extractIngredientsFromTitle(title);
    ingredients.push(...commonIngredients);
  }

  return {
    title,
    ingredients,
    steps,
    servings,
    cookingTime,
    description,
    extractionMethod: 'description',
  };
}

function extractIngredientsFromTitle(title: string): string[] {
  const ingredients: string[] = [];
  const commonIngredients = [
    '玉ねぎ', 'にんじん', 'じゃがいも', '豚肉', '牛肉', '鶏肉',
    '卵', '米', 'パン', 'パスタ', 'トマト', 'きゅうり', 'レタス',
    '醤油', '味噌', '塩', '砂糖', '油', 'バター', 'チーズ'
  ];

  for (const ingredient of commonIngredients) {
    if (title.includes(ingredient)) {
      ingredients.push(ingredient);
    }
  }

  return ingredients;
}